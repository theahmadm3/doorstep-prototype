
import { useState, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	getWalletBalance,
	getPayoutRecipients,
	createPayoutRecipient,
	deletePayoutRecipient,
	getBanks,
	requestWithdrawal,
	getWithdrawals,
} from "@/lib/api";
import {
	WalletBalance,
	PayoutRecipient,
	CreateRecipientPayload,
	createRecipientSchema,
	Bank,
	Withdrawal,
	WithdrawalStatus,
} from "@/lib/types";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
	Banknote,
	PlusCircle,
	Landmark,
	Wallet,
	Eye,
	Trash2,
	ArrowDownToLine,
	Clock,
} from "lucide-react";

const formatCurrency = (value: string | number | undefined) => {
	if (value === undefined) return "₦0.00";
	const num = typeof value === "string" ? parseFloat(value) : value;
	return `₦${num.toLocaleString("en-NG", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const WITHDRAWAL_STATUS_CONFIG: Record<
	WithdrawalStatus,
	{ label: string; className: string }
> = {
	PENDING: {
		label: "Pending",
		className: "bg-yellow-100 text-yellow-800",
	},
	APPROVED: {
		label: "Approved",
		className: "bg-blue-100 text-blue-800",
	},
	PROCESSING: {
		label: "Processing",
		className: "bg-blue-100 text-blue-800",
	},
	COMPLETED: {
		label: "Completed",
		className: "bg-green-100 text-green-800",
	},
	REJECTED: {
		label: "Rejected",
		className: "bg-red-100 text-red-800",
	},
	FAILED: {
		label: "Failed",
		className: "bg-red-100 text-red-800",
	},
};

const OPEN_STATUSES: WithdrawalStatus[] = ["PENDING", "APPROVED", "PROCESSING"];

const PayoutManagement = forwardRef((_props, ref) => {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [isAddRecipientOpen, setAddRecipientOpen] = useState(false);
	const [recipientToDelete, setRecipientToDelete] =
		useState<PayoutRecipient | null>(null);
	const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
		null,
	);

	const {
		data: balance,
		isLoading: isBalanceLoading,
		refetch: refetchBalance,
	} = useQuery<WalletBalance, Error>({
		queryKey: ["walletBalance"],
		queryFn: getWalletBalance,
		refetchOnReconnect: false,
	});

	const {
		data: recipients = [],
		isLoading: isRecipientsLoading,
		refetch: refetchRecipients,
	} = useQuery<PayoutRecipient[], Error>({
		queryKey: ["payoutRecipients"],
		queryFn: getPayoutRecipients,
		refetchOnReconnect: false,
	});

	const { data: banks = [] } = useQuery<Bank[], Error>({
		queryKey: ["banks"],
		queryFn: getBanks,
		staleTime: Infinity,
	});

	const {
		data: withdrawals = [],
		isLoading: isWithdrawalsLoading,
		refetch: refetchWithdrawals,
	} = useQuery<Withdrawal[], Error>({
		queryKey: ["withdrawals"],
		queryFn: getWithdrawals,
		refetchOnReconnect: false,
	});

	useImperativeHandle(ref, () => ({
		refetch() {
			refetchBalance();
			refetchRecipients();
			refetchWithdrawals();
		},
	}));

	const addRecipientForm = useForm<CreateRecipientPayload>({
		resolver: zodResolver(createRecipientSchema),
		defaultValues: { name: "", account_number: "", bank_code: "" },
	});

	const createRecipientMutation = useMutation({
		mutationFn: createPayoutRecipient,
		onSuccess: () => {
			toast({
				title: "Account Added",
				description: "Your bank account has been saved.",
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

	const requestWithdrawalMutation = useMutation({
		mutationFn: requestWithdrawal,
		onSuccess: () => {
			toast({
				title: "Withdrawal Requested",
				description:
					"Your request has been submitted and is awaiting admin review.",
			});
			queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
			queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
			setSelectedAccountId(null);
		},
		onError: (error) => {
			toast({
				title: "Withdrawal Failed",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const deleteRecipientMutation = useMutation({
		mutationFn: (recipientCode: string) => deletePayoutRecipient(recipientCode),
		onSuccess: () => {
			toast({
				title: "Account Removed",
				description: "The bank account has been removed.",
			});
			queryClient.invalidateQueries({ queryKey: ["payoutRecipients"] });
			setRecipientToDelete(null);
		},
		onError: (error) => {
			toast({
				title: "Removal Failed",
				description: error.message,
				variant: "destructive",
			});
			setRecipientToDelete(null);
		},
	});

	const withdrawableBalance = parseFloat(balance?.withdrawable_balance ?? "0");
	const canWithdraw = withdrawableBalance >= 100;
	const hasOpenRequest = withdrawals.some((w) =>
		OPEN_STATUSES.includes(w.status),
	);

	const getBankName = (bankCode: string) =>
		banks.find((b) => b.code === bankCode)?.name ?? bankCode;

	const onAddRecipientSubmit = (data: CreateRecipientPayload) => {
		createRecipientMutation.mutate(data);
	};

	const handleRequestWithdrawal = () => {
		if (!selectedAccountId) return;
		requestWithdrawalMutation.mutate({ bank_account_id: selectedAccountId });
	};

	const handleDeleteRecipient = () => {
		if (recipientToDelete) {
			deleteRecipientMutation.mutate(recipientToDelete.recipient_code);
		}
	};

	return (
		<>
			<AlertDialog
				open={!!recipientToDelete}
				onOpenChange={(open) => !open && setRecipientToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove bank account?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the selected bank account. This cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteRecipientMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteRecipient}
							disabled={deleteRecipientMutation.isPending}
						>
							{deleteRecipientMutation.isPending ? "Removing..." : "Remove"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex flex-col lg:flex-row gap-8">
				{/* Left column */}
				<div className="flex flex-col gap-8 w-full min-w-0 lg:flex-[2]">
					{/* Balance cards */}
					<div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
						<Card className="flex-1 sm:min-w-[220px]">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base font-semibold">
									<Wallet className="h-5 w-5 shrink-0 text-primary" />
									Total Balance
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isBalanceLoading ? (
									<Skeleton className="h-9 w-32" />
								) : (
									<p className="text-2xl xl:text-3xl font-bold tabular-nums break-words">
										{formatCurrency(balance?.total_balance)}
									</p>
								)}
								<p className="text-sm text-muted-foreground mt-1">
									This includes all earnings.
								</p>
							</CardContent>
						</Card>
						<Card className="flex-1 sm:min-w-[220px]">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base font-semibold">
									<Eye className="h-5 w-5 shrink-0 text-green-500" />
									Withdrawable Balance
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isBalanceLoading ? (
									<Skeleton className="h-9 w-32" />
								) : (
									<p className="text-2xl xl:text-3xl font-bold tabular-nums break-words">
										{formatCurrency(balance?.withdrawable_balance)}
									</p>
								)}
								<p className="text-sm text-muted-foreground mt-1">
									Available for withdrawal.
								</p>
							</CardContent>
						</Card>
						<Card className="flex-1 sm:min-w-[220px]">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base font-semibold">
									<Banknote className="h-5 w-5 shrink-0 text-yellow-500" />
									Pending Balance
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isBalanceLoading ? (
									<Skeleton className="h-9 w-32" />
								) : (
									<p className="text-2xl xl:text-3xl font-bold tabular-nums break-words">
										{formatCurrency(balance?.pending_balance)}
									</p>
								)}
								<p className="text-sm text-muted-foreground mt-1">
									Awaiting settlement.
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Withdrawal request */}
					<Card>
						<CardHeader>
							<CardTitle>Request Withdrawal</CardTitle>
							<CardDescription>
								Withdrawals transfer your full eligible balance to your bank
								account. Minimum withdrawable balance is ₦100.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{hasOpenRequest && (
								<div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
									<Clock className="h-4 w-4 shrink-0" />
									<span>
										You have an open withdrawal request. Only one is allowed at a
										time.
									</span>
								</div>
							)}
							{!canWithdraw && !hasOpenRequest && !isBalanceLoading && (
								<p className="text-sm text-muted-foreground">
									Your withdrawable balance must be at least ₦100.00 to request a
									withdrawal.
								</p>
							)}
							<div className="space-y-2">
								<label className="text-sm font-medium leading-none">
									Bank Account
								</label>
								<Select
									value={selectedAccountId ? String(selectedAccountId) : ""}
									onValueChange={(v) => setSelectedAccountId(Number(v))}
									disabled={isRecipientsLoading || recipients.length === 0}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												recipients.length === 0
													? "No accounts saved — add one first"
													: "Choose a bank account"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{recipients.map((r) => (
											<SelectItem key={r.id} value={String(r.id)}>
												{getBankName(r.bank_code)} — ****
												{r.account_number.slice(-4)} · {r.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								onClick={handleRequestWithdrawal}
								disabled={
									!selectedAccountId ||
									!canWithdraw ||
									hasOpenRequest ||
									requestWithdrawalMutation.isPending
								}
								className="w-full"
							>
								<ArrowDownToLine className="mr-2 h-4 w-4" />
								{requestWithdrawalMutation.isPending
									? "Submitting..."
									: "Request Withdrawal"}
							</Button>
						</CardContent>
					</Card>

					{/* Withdrawal history */}
					<Card>
						<CardHeader>
							<CardTitle>Withdrawal History</CardTitle>
						</CardHeader>
						<CardContent>
							{isWithdrawalsLoading ? (
								<div className="space-y-3">
									{[...Array(2)].map((_, i) => (
										<Skeleton key={i} className="h-20 w-full" />
									))}
								</div>
							) : withdrawals.length > 0 ? (
								<div className="space-y-3">
									{withdrawals.map((w) => {
										const cfg = WITHDRAWAL_STATUS_CONFIG[w.status];
										return (
											<div
												key={w.id}
												className="rounded-md border p-3 space-y-2"
											>
												<div className="flex items-center justify-between gap-2">
													<span
														className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
													>
														{cfg.label}
													</span>
													<span className="font-semibold tabular-nums">
														{w.amount ? formatCurrency(w.amount) : "—"}
													</span>
												</div>
												<p className="text-sm text-muted-foreground">
													{w.bank_name} · ****
													{w.bank_account_number.slice(-4)} ·{" "}
													{w.bank_account_name}
												</p>
												<p className="text-xs text-muted-foreground">
													{new Date(w.created_at).toLocaleDateString("en-NG", {
														dateStyle: "medium",
													})}
												</p>
												{w.status === "REJECTED" && w.admin_note && (
													<p className="text-sm text-destructive">
														Note: {w.admin_note}
													</p>
												)}
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center text-muted-foreground py-8">
									<ArrowDownToLine className="mx-auto h-12 w-12 text-gray-400" />
									<p className="mt-4">No withdrawal requests yet.</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right column: bank accounts */}
				<div className="flex flex-col gap-8 w-full min-w-0 lg:flex-1">
					<Card>
						<CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
							<div>
								<CardTitle>Bank Accounts</CardTitle>
								<CardDescription>Your saved bank accounts.</CardDescription>
							</div>
							<Dialog
								open={isAddRecipientOpen}
								onOpenChange={setAddRecipientOpen}
							>
								<DialogTrigger asChild>
									<Button variant="outline" size="icon" className="shrink-0">
										<PlusCircle className="h-4 w-4" />
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Add Bank Account</DialogTitle>
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
														<FormLabel>Bank</FormLabel>
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
																{banks.map((bank) => (
																	<SelectItem
																		key={bank.code}
																		value={bank.code}
																	>
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
							) : recipients.length > 0 ? (
								<div className="space-y-4">
									{recipients.map((r) => (
										<div
											key={r.id}
											className="flex items-center gap-3 p-3 rounded-md border"
										>
											<div className="p-2 bg-muted rounded-full shrink-0">
												<Landmark className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="font-semibold truncate">
													{getBankName(r.bank_code)}
												</p>
												<p className="text-sm text-muted-foreground truncate">
													{r.name} — ****{r.account_number.slice(-4)}
												</p>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="shrink-0 text-destructive hover:bg-destructive/10"
												onClick={() => setRecipientToDelete(r)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-center text-muted-foreground py-8">
									<Banknote className="mx-auto h-12 w-12 text-gray-400" />
									<p className="mt-4">No bank accounts saved.</p>
									<p className="text-xs">Add a bank account to get started.</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
});
PayoutManagement.displayName = "PayoutManagement";

export default PayoutManagement;
