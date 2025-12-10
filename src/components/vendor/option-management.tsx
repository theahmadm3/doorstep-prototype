
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	getMenuOptions,
	createMenuOption,
	updateMenuOption,
	deleteMenuOption,
	getVendorMenuItems,
} from "@/lib/api";
import {
	OptionChoice,
	OptionPayload,
	optionSchema,
	optionTypes,
	MenuItem,
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";

export default function OptionManagement() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<OptionChoice | null>(null);
	const [editingItem, setEditingItem] = useState<OptionChoice | null>(null);

	const { data: options = [], isLoading: isLoadingOptions } = useQuery<
		OptionChoice[]
	>({
		queryKey: ["menuOptions"],
		queryFn: getMenuOptions,
	});

	const { data: menuItems = [], isLoading: isLoadingMenuItems } = useQuery<
		MenuItem[]
	>({
		queryKey: ["vendorMenuItems"],
		queryFn: getVendorMenuItems,
	});

	const form = useForm<OptionPayload>({
		resolver: zodResolver(optionSchema),
		defaultValues: {
			name: "",
			price_adjustment: "0.00",
			is_available: true,
		},
	});

	const { mutate: createOption, isPending: isCreating } = useMutation({
		mutationFn: createMenuOption,
		onSuccess: () => {
			toast({ title: "Option Created" });
			queryClient.invalidateQueries({ queryKey: ["menuOptions"] });
			setDialogOpen(false);
		},
		onError: (error) => {
			toast({
				title: "Failed to Create Option",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const { mutate: updateOption, isPending: isUpdating } = useMutation({
		mutationFn: (payload: { id: string; data: Partial<OptionPayload> }) =>
			updateMenuOption(payload.id, payload.data),
		onSuccess: () => {
			toast({ title: "Option Updated" });
			queryClient.invalidateQueries({ queryKey: ["menuOptions"] });
			setDialogOpen(false);
		},
		onError: (error) => {
			toast({
				title: "Failed to Update Option",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const { mutate: deleteOption, isPending: isDeleting } = useMutation({
		mutationFn: (id: string) => deleteMenuOption(id),
		onSuccess: () => {
			toast({ title: "Option Deleted" });
			queryClient.invalidateQueries({ queryKey: ["menuOptions"] });
			setItemToDelete(null);
		},
		onError: (error) => {
			toast({
				title: "Failed to Delete Option",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const openDialog = (item: OptionChoice | null) => {
		setEditingItem(item);
		if (item) {
			form.reset({
				menu_item: item.menu_item,
				name: item.name,
				type: item.type,
				price_adjustment: item.price_adjustment,
				is_available: item.is_available,
			});
		} else {
			form.reset({
				name: "",
				price_adjustment: "0.00",
				is_available: true,
			});
		}
		setDialogOpen(true);
	};

	const onSubmit = (data: OptionPayload) => {
		if (editingItem) {
			updateOption({ id: editingItem.id, data });
		} else {
			createOption(data);
		}
	};

	const handleDelete = () => {
		if (itemToDelete) {
			deleteOption(itemToDelete.id);
		}
	};

	return (
		<>
			{/* Add/Edit Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? "Edit Option" : "Add a New Option"}
						</DialogTitle>
						<DialogDescription>
							Options can be added to menu items to allow customization.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
							id="option-form"
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 py-4"
						>
							<FormField
								control={form.control}
								name="menu_item"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Assign to Menu Item</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={isLoadingMenuItems}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select an item" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{menuItems.map((item) => (
													<SelectItem key={item.id} value={item.id}>
														{item.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Option Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Extra Cheese" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Option Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{optionTypes.map((type) => (
													<SelectItem
														key={type}
														value={type}
														className="capitalize"
													>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="price_adjustment"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Price Adjustment (₦)</FormLabel>
										<FormControl>
											<Input type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="is_available"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
										<div className="space-y-0.5">
											<FormLabel>Available</FormLabel>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</form>
					</Form>
					<DialogFooter>
						<Button
							type="submit"
							form="option-form"
							disabled={isCreating || isUpdating}
						>
							{isCreating || isUpdating ? "Saving..." : "Save Option"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!itemToDelete}
				onOpenChange={(open) => !open && setItemToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the option "
							<strong>{itemToDelete?.name}</strong>". This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Main Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Menu Options</CardTitle>
						<CardDescription>
							Create and manage options for your menu items.
						</CardDescription>
					</div>
					<Button onClick={() => openDialog(null)}>
						<PlusCircle className="mr-2 h-4 w-4" /> Add Option
					</Button>
				</CardHeader>
				<CardContent>
					{isLoadingOptions ? (
						<Skeleton className="h-48 w-full" />
					) : options.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Price Adjustment</TableHead>
									<TableHead>Assigned to</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{options.map((option) => {
									const assignedItem = menuItems.find(
										(item) => item.id === option.menu_item,
									);
									return (
										<TableRow key={option.id}>
											<TableCell className="font-medium">
												{option.name}
											</TableCell>
											<TableCell className="capitalize">{option.type}</TableCell>
											<TableCell>
												₦{parseFloat(option.price_adjustment).toFixed(2)}
											</TableCell>
											<TableCell>{assignedItem?.name || "N/A"}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => openDialog(option)}>
															<Edit className="mr-2 h-4 w-4" /> Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => setItemToDelete(option)}
															className="text-red-600"
														>
															<Trash2 className="mr-2 h-4 w-4" /> Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					) : (
						<div className="text-center text-muted-foreground py-8">
							<p>No options created yet.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
