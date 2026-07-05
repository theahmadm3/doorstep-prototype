
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
	getVendorDiscounts,
	createVendorDiscount,
	updateVendorDiscount,
	deleteVendorDiscount,
	getVendorMenuItems,
	getMenuCategories,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import {
	vendorDiscountSchema,
	type VendorDiscount,
	type VendorDiscountPayload,
	type MenuItem,
	type MenuCategory,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

const RESTAURANT_SCOPES = ["item", "category", "all_menu_items"] as const;
const DOORSTEP_SCOPES = ["order", "delivery", "service_fee"] as const;

const SCOPE_LABELS: Record<string, string> = {
	order: "Order Subtotal",
	delivery: "Delivery Fee",
	service_fee: "Service Fee",
	item: "Specific Items",
	category: "Item Category",
	all_menu_items: "All Menu Items",
};

function toDatetimeLocal(iso: string): string {
	return iso.slice(0, 16);
}

function toISOString(datetimeLocal: string): string {
	return new Date(datetimeLocal).toISOString();
}

// ─── Form Dialog ─────────────────────────────────────────────────────────────

interface DiscountFormProps {
	open: boolean;
	onClose: () => void;
	editing: VendorDiscount | null;
	onSubmit: (payload: VendorDiscountPayload) => void;
	isPending: boolean;
}

function DiscountFormDialog({
	open,
	onClose,
	editing,
	onSubmit,
	isPending,
}: DiscountFormProps) {
	const {
		register,
		handleSubmit,
		watch,
		control,
		reset,
		setValue,
		formState: { errors },
	} = useForm<VendorDiscountPayload>({
		resolver: zodResolver(vendorDiscountSchema),
		defaultValues: {
			funded_by: "restaurant",
			scope_type: "all_menu_items",
			discount_type: "percentage",
			value: "",
			min_order_value: "0",
			is_active: true,
			menu_items: [],
			categories: [],
		},
	});

	const fundedBy = watch("funded_by");
	const scopeType = watch("scope_type");
	const discountType = watch("discount_type");

	// Populate form when editing
	useEffect(() => {
		if (editing) {
			reset({
				code: editing.code ?? undefined,
				description: editing.description ?? undefined,
				discount_type: editing.discount_type,
				value: editing.value,
				min_order_value: editing.min_order_value,
				max_discount_amount: editing.max_discount_amount ?? undefined,
				start_date: toDatetimeLocal(editing.start_date),
				end_date: toDatetimeLocal(editing.end_date),
				is_active: editing.is_active,
				scope_type: editing.scope_type,
				funded_by: editing.funded_by,
				menu_items: editing.menu_items,
				categories: editing.categories,
			});
		} else {
			reset({
				funded_by: "restaurant",
				scope_type: "all_menu_items",
				discount_type: "percentage",
				value: "",
				min_order_value: "0",
				is_active: true,
				menu_items: [],
				categories: [],
			});
		}
	}, [editing, reset, open]);

	// Reset scope_type when funded_by changes
	useEffect(() => {
		const validScopes =
			fundedBy === "restaurant" ? RESTAURANT_SCOPES : DOORSTEP_SCOPES;
		if (!(validScopes as readonly string[]).includes(scopeType)) {
			setValue("scope_type", validScopes[0]);
		}
	}, [fundedBy, scopeType, setValue]);

	// Fetch menu items / categories only when needed
	const { data: menuItems = [] } = useQuery<MenuItem[]>({
		queryKey: QUERY_KEYS.vendorMenuItems,
		queryFn: getVendorMenuItems,
		enabled: open && scopeType === "item",
	});

	const { data: categories = [] } = useQuery<MenuCategory[]>({
		queryKey: QUERY_KEYS.menuCategories,
		queryFn: getMenuCategories,
		enabled: open && scopeType === "category",
	});

	const availableScopes =
		fundedBy === "restaurant" ? RESTAURANT_SCOPES : DOORSTEP_SCOPES;

	const handleFormSubmit = (data: VendorDiscountPayload) => {
		onSubmit({
			...data,
			start_date: toISOString(data.start_date),
			end_date: toISOString(data.end_date),
			code: data.code || null,
			description: data.description || null,
			max_discount_amount: data.max_discount_amount || null,
		});
	};

	return (
		<Dialog className="max-w-md" open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-sm max-h-[90svh] flex flex-col">
				<DialogHeader>
					<DialogTitle>
						{editing ? "Edit Discount" : "New Discount"}
					</DialogTitle>
				</DialogHeader>

				<ScrollArea className="flex-1 pr-1">
					<form
						id="discount-form"
						onSubmit={handleSubmit(handleFormSubmit)}
						className="space-y-5 px-1 pb-2"
					>
						{/* Funded By */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Funded By</Label>
								<Controller
									name="funded_by"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="restaurant">Restaurant</SelectItem>
												<SelectItem value="doorstep">Doorstep</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Scope</Label>
								<Controller
									name="scope_type"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{availableScopes.map((s) => (
													<SelectItem key={s} value={s}>
														{SCOPE_LABELS[s]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								/>
								{errors.scope_type && (
									<p className="text-xs text-destructive">
										{errors.scope_type.message}
									</p>
								)}
							</div>
						</div>

						{/* Discount Type + Value */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Discount Type</Label>
								<Controller
									name="discount_type"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="percentage">
													Percentage (%)
												</SelectItem>
												<SelectItem value="fixed_amount">
													Fixed Amount (₦)
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Value</Label>
								<Input
									{...register("value")}
									placeholder={
										discountType === "percentage" ? "e.g. 20" : "e.g. 500"
									}
								/>
								{errors.value && (
									<p className="text-xs text-destructive">
										{errors.value.message}
									</p>
								)}
							</div>
						</div>

						{/* Code + Description */}
						<div className="space-y-1.5">
							<Label>
								Promo Code{" "}
								<span className="text-muted-foreground text-xs">
									(leave blank for auto-apply)
								</span>
							</Label>
							<Input
								{...register("code")}
								placeholder="e.g. SAVE20"
								className="uppercase"
							/>
						</div>
						<div className="space-y-1.5">
							<Label>
								Description{" "}
								<span className="text-muted-foreground text-xs">
									(optional)
								</span>
							</Label>
							<Input
								{...register("description")}
								placeholder="e.g. 20% off your first order"
							/>
						</div>

						{/* Min order + Max discount */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Min Order Value (₦)</Label>
								<Input {...register("min_order_value")} placeholder="0" />
							</div>
							{discountType === "percentage" && (
								<div className="space-y-1.5">
									<Label>
										Max Discount (₦){" "}
										<span className="text-muted-foreground text-xs">(cap)</span>
									</Label>
									<Input
										{...register("max_discount_amount")}
										placeholder="optional"
									/>
								</div>
							)}
						</div>

						{/* Dates */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label>Start Date</Label>
								<Input type="datetime-local" {...register("start_date")} />
								{errors.start_date && (
									<p className="text-xs text-destructive">
										{errors.start_date.message}
									</p>
								)}
							</div>
							<div className="space-y-1.5">
								<Label>End Date</Label>
								<Input type="datetime-local" {...register("end_date")} />
								{errors.end_date && (
									<p className="text-xs text-destructive">
										{errors.end_date.message}
									</p>
								)}
							</div>
						</div>

						{/* Active toggle */}
						<div className="flex items-center justify-between rounded-lg border p-3">
							<div>
								<p className="text-sm font-medium">Active</p>
								<p className="text-xs text-muted-foreground">
									Discount is available to customers
								</p>
							</div>
							<Controller
								name="is_active"
								control={control}
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						{/* Menu items selector */}
						{scopeType === "item" && (
							<div className="space-y-2">
								<Label>Menu Items</Label>
								<ScrollArea className="h-40 rounded-md border p-3">
									{menuItems.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No menu items found.
										</p>
									) : (
										<Controller
											name="menu_items"
											control={control}
											render={({ field }) => (
												<div className="space-y-2">
													{menuItems.map((item) => (
														<div
															key={item.id}
															className="flex items-center gap-2"
														>
															<Checkbox
																id={`item-${item.id}`}
																checked={field.value.includes(item.id)}
																onCheckedChange={(checked) => {
																	field.onChange(
																		checked
																			? [...field.value, item.id]
																			: field.value.filter(
																					(id) => id !== item.id,
																				),
																	);
																}}
															/>
															<label
																htmlFor={`item-${item.id}`}
																className="text-sm cursor-pointer"
															>
																{item.name} — ₦
																{parseFloat(item.price).toLocaleString()}
															</label>
														</div>
													))}
												</div>
											)}
										/>
									)}
								</ScrollArea>
							</div>
						)}

						{/* Categories selector */}
						{scopeType === "category" && (
							<div className="space-y-2">
								<Label>Categories</Label>
								<ScrollArea className="h-40 rounded-md border p-3">
									{categories.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											No categories found.
										</p>
									) : (
										<Controller
											name="categories"
											control={control}
											render={({ field }) => (
												<div className="space-y-2">
													{categories.map((cat) => (
														<div
															key={cat.id}
															className="flex items-center gap-2"
														>
															<Checkbox
																id={`cat-${cat.id}`}
																checked={field.value.includes(cat.id)}
																onCheckedChange={(checked) => {
																	field.onChange(
																		checked
																			? [...field.value, cat.id]
																			: field.value.filter(
																					(id) => id !== cat.id,
																				),
																	);
																}}
															/>
															<label
																htmlFor={`cat-${cat.id}`}
																className="text-sm cursor-pointer"
															>
																{cat.name}
															</label>
														</div>
													))}
												</div>
											)}
										/>
									)}
								</ScrollArea>
							</div>
						)}
					</form>
				</ScrollArea>

				<DialogFooter className="pt-2">
					<Button variant="outline" onClick={onClose} disabled={isPending}>
						Cancel
					</Button>
					<Button type="submit" form="discount-form" disabled={isPending}>
						{isPending
							? "Saving..."
							: editing
								? "Save Changes"
								: "Create Discount"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Discount Row ─────────────────────────────────────────────────────────────

function DiscountRow({
	discount,
	onEdit,
	onDelete,
}: {
	discount: VendorDiscount;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const now = new Date();
	const isExpired = new Date(discount.end_date) < now;
	const isUpcoming = new Date(discount.start_date) > now;

	const statusLabel = !discount.is_active
		? "Inactive"
		: isExpired
			? "Expired"
			: isUpcoming
				? "Upcoming"
				: "Live";

	const statusVariant: Record<
		string,
		"default" | "secondary" | "destructive" | "outline"
	> = {
		Live: "default",
		Upcoming: "secondary",
		Expired: "outline",
		Inactive: "outline",
	};

	return (
		<div className="flex items-start justify-between gap-4 py-4">
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-semibold text-sm">
						{discount.code ? (
							<code className="bg-muted px-1.5 py-0.5 rounded text-primary">
								{discount.code}
							</code>
						) : (
							<span className="text-muted-foreground italic">Auto-apply</span>
						)}
					</span>
					<Badge variant={statusVariant[statusLabel]} className="text-xs">
						{statusLabel}
					</Badge>
					<Badge variant="outline" className="text-xs capitalize">
						{discount.funded_by}
					</Badge>
				</div>

				<p className="text-sm text-muted-foreground">
					{discount.discount_type === "percentage"
						? `${discount.value}% off`
						: `₦${parseFloat(discount.value).toLocaleString()} off`}{" "}
					— {SCOPE_LABELS[discount.scope_type]}
					{parseFloat(discount.min_order_value) > 0 &&
						` · min ₦${parseFloat(discount.min_order_value).toLocaleString()}`}
				</p>

				<p className="text-xs text-muted-foreground">
					{format(new Date(discount.start_date), "dd MMM yyyy")} →{" "}
					{format(new Date(discount.end_date), "dd MMM yyyy")}
				</p>

				{discount.description && (
					<p className="text-xs text-muted-foreground">
						{discount.description}
					</p>
				)}
			</div>

			<div className="flex items-center gap-1 flex-shrink-0">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={onEdit}
				>
					<Pencil className="w-4 h-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-destructive hover:text-destructive"
					onClick={onDelete}
				>
					<Trash2 className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorDiscountsPage() {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const [isFormOpen, setFormOpen] = useState(false);
	const [editingDiscount, setEditingDiscount] = useState<VendorDiscount | null>(
		null,
	);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const { data: discounts = [], isLoading } = useQuery({
		queryKey: QUERY_KEYS.vendorDiscounts,
		queryFn: getVendorDiscounts,
	});

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorDiscounts });

	const { mutate: create, isPending: isCreating } = useMutation({
		mutationFn: createVendorDiscount,
		onSuccess: () => {
			invalidate();
			setFormOpen(false);
			toast({ title: "Discount created" });
		},
		onError: (err: Error) =>
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			}),
	});

	const { mutate: update, isPending: isUpdating } = useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: Partial<VendorDiscountPayload>;
		}) => updateVendorDiscount(id, payload),
		onSuccess: () => {
			invalidate();
			setFormOpen(false);
			setEditingDiscount(null);
			toast({ title: "Discount updated" });
		},
		onError: (err: Error) =>
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			}),
	});

	const { mutate: remove, isPending: isDeleting } = useMutation({
		mutationFn: deleteVendorDiscount,
		onSuccess: () => {
			invalidate();
			setDeletingId(null);
			toast({ title: "Discount deleted" });
		},
		onError: (err: Error) =>
			toast({
				title: "Error",
				description: err.message,
				variant: "destructive",
			}),
	});

	const handleFormSubmit = (payload: VendorDiscountPayload) => {
		if (editingDiscount) {
			update({ id: editingDiscount.id, payload });
		} else {
			create(payload);
		}
	};

	const openCreate = () => {
		setEditingDiscount(null);
		setFormOpen(true);
	};

	const openEdit = (discount: VendorDiscount) => {
		setEditingDiscount(discount);
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditingDiscount(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Discounts</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						Manage promo codes and auto-applied offers for your restaurant.
					</p>
				</div>
				<Button onClick={openCreate}>
					<Plus className="w-4 h-4 mr-2" />
					Add Discount
				</Button>
			</div>

			{/* List */}
			<div className="rounded-xl border bg-card">
				{isLoading ? (
					<div className="p-4 space-y-4">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-56" />
								<Skeleton className="h-3 w-40" />
							</div>
						))}
					</div>
				) : discounts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<Tag className="w-10 h-10 text-muted-foreground mb-3" />
						<p className="font-medium">No discounts yet</p>
						<p className="text-sm text-muted-foreground mt-1">
							Create your first promo code or auto-apply offer.
						</p>
					</div>
				) : (
					<div className="divide-y px-4">
						{discounts.map((d) => (
							<DiscountRow
								key={d.id}
								discount={d}
								onEdit={() => openEdit(d)}
								onDelete={() => setDeletingId(d.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Form dialog */}
			<DiscountFormDialog
				open={isFormOpen}
				onClose={closeForm}
				editing={editingDiscount}
				onSubmit={handleFormSubmit}
				isPending={isCreating || isUpdating}
			/>

			{/* Delete confirm */}
			<AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
				<AlertDialogContent className="max-w-xs">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Discount</AlertDialogTitle>
						<AlertDialogDescription>
							This discount will be permanently removed and can no longer be
							applied to orders.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingId && remove(deletingId)}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
