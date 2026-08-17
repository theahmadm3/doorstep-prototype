import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Rider, RiderPayload, riderSchema } from "@/lib/types";
import {
	createVendorRider,
	getVendorRiders,
	updateVendorRider,
	deleteVendorRider,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import { Skeleton } from "../ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function VendorRiderManagement() {
	const queryClient = useQueryClient();
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [editingRider, setEditingRider] = useState<Rider | null>(null);
	const { toast } = useToast();
	const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

	const { data: riders = [], isLoading } = useQuery({
		queryKey: QUERY_KEYS.vendorRiders,
		queryFn: getVendorRiders,
	});

	const form = useForm<RiderPayload>({
		resolver: zodResolver(riderSchema),
		mode: "onChange",
	});

	const { formState: { isSubmitting } } = form;

	const invalidateRiders = () =>
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorRiders });

	const createMutation = useMutation({
		mutationFn: createVendorRider,
		onSuccess: async () => {
			toast({ title: "Rider Added", description: "The rider has been successfully added." });
			await invalidateRiders();
		},
		onError: (error: Error) => {
			toast({ title: "Save Failed", description: error.message, variant: "destructive" });
		},
	});

	const updateMutation = useMutation({
		mutationFn: updateVendorRider,
		onSuccess: async () => {
			toast({ title: "Rider Updated", description: "The rider has been updated." });
			await invalidateRiders();
		},
		onError: (error: Error) => {
			toast({ title: "Save Failed", description: error.message, variant: "destructive" });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteVendorRider,
		onSuccess: async () => {
			toast({ title: "Rider Deleted", description: "The rider has been removed." });
			await invalidateRiders();
		},
		onError: (error: Error) => {
			toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
		},
	});

	const handleOpenDialog = (rider: Rider | null) => {
		setEditingRider(rider);
		form.reset(
			rider
				? { name: rider.name, phone: rider.phone, email: rider.email }
				: { name: "", phone: "", email: "" },
		);
		setDialogOpen(true);
	};

	const handleSaveRider = async (data: RiderPayload) => {
		if (editingRider) {
			await updateMutation.mutateAsync(data);
		} else {
			await createMutation.mutateAsync(data);
		}
		setDialogOpen(false);
		setEditingRider(null);
	};

	const handleDeleteRider = () => {
		if (!riderToDelete) return;
		deleteMutation.mutate(riderToDelete.name);
		setRiderToDelete(null);
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialog
				open={!!riderToDelete}
				onOpenChange={(open) => !open && setRiderToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action will permanently delete the rider{" "}
							<strong>{riderToDelete?.name}</strong>. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteRider}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Your Riders</CardTitle>
						<CardDescription>
							Add, edit, or remove riders from your team.
						</CardDescription>
					</div>
					<DialogTrigger asChild>
						<Button onClick={() => handleOpenDialog(null)}>
							<PlusCircle className="mr-2 h-4 w-4" /> Add Rider
						</Button>
					</DialogTrigger>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Phone Number</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{[...Array(3)].map((_, i) => (
									<TableRow key={i}>
										<TableCell>
											<Skeleton className="h-5 w-32" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-40" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-24" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-8 w-8" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : riders.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground mb-4">
								You haven't added any riders yet.
							</p>
							<DialogTrigger asChild>
								<Button onClick={() => handleOpenDialog(null)}>
									<PlusCircle className="mr-2 h-4 w-4" /> Add Your First
									Rider
								</Button>
							</DialogTrigger>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Phone Number</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{riders.map((rider) => (
									<TableRow key={rider.name}>
										<TableCell className="font-medium">
											{rider.name}
										</TableCell>
										<TableCell>{rider.email}</TableCell>
										<TableCell>{rider.phone}</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0"
														aria-label={`Actions for ${rider.name}`}
													>
														<MoreHorizontal
															className="h-4 w-4"
															aria-hidden="true"
														/>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => handleOpenDialog(rider)}
													>
														<Edit className="mr-2 h-4 w-4" /> Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setRiderToDelete(rider)}
														className="text-red-600"
													>
														<Trash2 className="mr-2 h-4 w-4" /> Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{editingRider ? "Edit Rider" : "Add a New Rider"}
					</DialogTitle>
					<DialogDescription>
						{editingRider
							? "Update the details for this rider."
							: "Fill in the details for your new rider."}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="rider-form"
						onSubmit={form.handleSubmit(handleSaveRider)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input
											placeholder="John Doe"
											{...field}
											disabled={!!editingRider}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="rider@example.com"
											{...field}
											disabled={!!editingRider}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<Input placeholder="08012345678" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>
				<DialogFooter>
					<Button
						type="submit"
						form="rider-form"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
