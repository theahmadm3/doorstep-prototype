"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	getWalletBalance,
	getPayoutRecipients,
	createPayoutRecipient,
	initiatePayout,
} from "@/lib/api";
import {
	WalletBalance,
	PayoutRecipient,
	CreateRecipientPayload,
	createRecipientSchema,
	InitiatePayoutPayload,
	requestPayoutSchema,
} from "@/lib/types";
import { nigerianBanks } from "@/lib/banks";
import { useToast } from "@/hooks/use-toast";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, PlusCircle, Landmark, Wallet, Eye } from "lucide-react";

const formatCurrency = (value: number | undefined) => {
	if (value === undefined) return "₦0.00";
	return `₦${value.toLocaleString("en-NG", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const PayoutManagement = forwardRef((props, ref) => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [isAddRecipientOpen, setAddRecipientOpen] = useState(false);

	const {
		data: balance,
		isLoading: isBalanceLoading,
		refetch: refetchBalance,
	} = useQuery<WalletBalance, Error>({
		queryKey: ["walletBalance"],
		queryFn: getWalletBalance,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const {
		data: recipients,
		isLoading: isRecipientsLoading,
		refetch: refetchRecipients,
	} = useQuery<PayoutRecipient[], Error>({
		queryKey: ["payoutRecipients"],
		queryFn: getPayoutRecipients,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	useImperativeHandle(ref, () => ({
		refetch() {
			refetchBalance();
			refetchRecipients();
		},
	}));

	const addRecipientForm = useForm<CreateRecipientPayload>({
		resolver: zodResolver(createRecipientSchema),
		defaultValues: { name: "", account_number: "", bank_code: "" },
	});

	const requestPayoutForm = useForm<InitiatePayoutPayload>({
		resolver: zodResolver(requestPayoutSchema),
		defaultValues: { amount: 1000, recipient_code: "" },
	});

	const createRecipientMutation = useMutation({
		mutationFn: createPayoutRecipient,
		onSuccess: () => {
			toast({
				title: "Account Added",
				description: "Your payout destination has been saved.",
			});
			queryClient.invalidateQueries({ queryKey: ["payoutRecipients"] });
			setAddRecipientOpen(false);
			addRecipientForm.reset();
		},
		onError: (error) => {
			toast({
				title: "Failed to Add Account",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const initiatePayoutMutation = useMutation({
		mutationFn: initiatePayout,
		onSuccess: (data) => {
			toast({
				title: "Payout Initiated",
				description: data.message,
			});
			queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
			requestPayoutForm.reset();
		},
		onError: (error) => {
			toast({
				title: "Payout Failed",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const onAddRecipientSubmit = (data: CreateRecipientPayload) => {
		createRecipientMutation.mutate(data);
	};

	const onRequestPayoutSubmit = (data: InitiatePayoutPayload) => {
		if (balance && data.amount > balance.withdrawable_balance) {
			toast({
				title: "Insufficient Balance",
				description:
					"You cannot request a payout greater than your withdrawable balance.",
				variant: "destructive",
			});
			return;
		}
		initiatePayoutMutation.mutate(data);
	};

	const getBankName = (bankCode: string) => {
		return (
			nigerianBanks.find((b) => b.code === bankCode)?.name || "Unknown Bank"
		);
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			{/* Left side */}
			<div className="lg:col-span-2 space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Wallet className="h-6 w-6 text-primary" />
								Total Balance
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isBalanceLoading ? (
								<Skeleton className="h-12 w-48" />
							) : (
								<p className="text-4xl font-bold">
									{formatCurrency(balance?.balance)}
								</p>
							)}
							<p className="text-sm text-muted-foreground mt-1">
								This includes all earnings.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Eye className="h-6 w-6 text-green-500" />
								Withdrawable Balance
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isBalanceLoading ? (
								<Skeleton className="h-12 w-48" />
							) : (
								<p className="text-4xl font-bold">
									{formatCurrency(balance?.withdrawable_balance)}
								</p>
							)}
							<p className="text-sm text-muted-foreground mt-1">
								Available for immediate payout.
							</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Request Payout</CardTitle>
						<CardDescription>
							Transfer funds from your wallet to a saved bank account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...requestPayoutForm}>
							<form
								onSubmit={requestPayoutForm.handleSubmit(onRequestPayoutSubmit)}
								className="space-y-4"
							>
								<FormField
									control={requestPayoutForm.control}
									name="recipient_code"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Select Account</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={isRecipientsLoading || !recipients?.length}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Choose a bank account" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{recipients?.map((r) => (
														<SelectItem
															key={r.recipient_code}
															value={r.recipient_code}
														>
															{getBankName(r.bank_code)} - ****
															{r.account_number.slice(-4)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={requestPayoutForm.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Amount (NGN)</FormLabel>
											<FormControl>
												<Input type="number" placeholder="1000" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									disabled={initiatePayoutMutation.isPending}
								>
									{initiatePayoutMutation.isPending
										? "Requesting..."
										: "Request Payout"}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>

			{/* Right side */}
			<div className="space-y-8">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>Payout Destinations</CardTitle>
							<CardDescription>Your saved bank accounts.</CardDescription>
						</div>
						<Dialog
							open={isAddRecipientOpen}
							onOpenChange={setAddRecipientOpen}
						>
							<DialogTrigger asChild>
								<Button variant="outline" size="icon">
									<PlusCircle className="h-4 w-4" />
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Payout Destination</DialogTitle>
									<DialogDescription>
										Enter your bank account details below.
									</DialogDescription>
								</DialogHeader>
								<Form {...addRecipientForm}>
									<form
										onSubmit={addRecipientForm.handleSubmit(
											onAddRecipientSubmit,
										)}
										className="space-y-4 py-4"
									>
										<FormField
											control={addRecipientForm.control}
											name="bank_code"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Bank Name</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select a bank" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{nigerianBanks.map((bank) => (
																<SelectItem key={bank.code} value={bank.code}>
																	{bank.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={addRecipientForm.control}
											name="account_number"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Account Number</FormLabel>
													<FormControl>
														<Input placeholder="0123456789" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={addRecipientForm.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Full Account Name</FormLabel>
													<FormControl>
														<Input placeholder="John Doe" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<DialogFooter>
											<Button
												type="submit"
												disabled={createRecipientMutation.isPending}
												className="w-full"
											>
												{createRecipientMutation.isPending
													? "Adding Account..."
													: "Add Account"}
											</Button>
										</DialogFooter>
									</form>
								</Form>
							</DialogContent>
						</Dialog>
					</CardHeader>
					<CardContent>
						{isRecipientsLoading ? (
							<div className="space-y-3">
								{[...Array(2)].map((_, i) => (
									<Skeleton key={i} className="h-16 w-full" />
								))}
							</div>
						) : recipients && recipients.length > 0 ? (
							<div className="space-y-4">
								{recipients.map((r) => (
									<div
										key={r.recipient_code}
										className="flex items-center gap-4 p-3 rounded-md border"
									>
										<div className="p-2 bg-muted rounded-full">
											<Landmark className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="font-semibold">
												{getBankName(r.bank_code)}
											</p>
											<p className="text-sm text-muted-foreground">
												{r.name} - ****
												{r.account_number.slice(-4)}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center text-muted-foreground py-8">
								<Banknote className="mx-auto h-12 w-12 text-gray-400" />
								<p className="mt-4">No payout destinations saved.</p>
								<p className="text-xs">Add a bank account to get started.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
});
PayoutManagement.displayName = "PayoutManagement";

export default PayoutManagement;
