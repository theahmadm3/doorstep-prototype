

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	PlusCircle,
	MoreHorizontal,
	Edit,
	Trash2,
	UploadCloud,
	LayoutGrid,
	List,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MenuItem, MenuItemPayload, MenuCategory, MenuByCategoryGroup, MenuCategoryItem } from "@/lib/types";
import {
	createVendorMenuItem,
	getVendorMenuItems,
	updateMenuItemAvailability,
	updateVendorMenuItem,
	deleteVendorMenuItem,
	uploadMenuItemImage,
	getMenuCategories,
	getMenuByCategory,
} from "@/lib/api";
import { QUERY_KEYS } from "@/lib/query-keys";
import { Skeleton } from "../ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

type ItemUpdateStatus = "idle" | "updating" | "success" | "error";
type ViewMode = "grouped" | "all";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function mapToMenuItem(item: MenuCategoryItem, categoryId: string, categories: MenuCategory[]): MenuItem {
	return {
		id: item.id,
		restaurant: "",
		name: item.name,
		description: item.description,
		price: item.price,
		image_url: item.image_url,
		is_available: item.is_available,
		category: categories.find((c) => c.id === categoryId) || null,
		options: {},
		item_type: item.item_type,
		active_discounts: [],
		created_at: "",
		updated_at: "",
	};
}

export default function VendorItemManagement() {
	const [viewMode, setViewMode] = useState<ViewMode>("grouped");
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
	const { toast } = useToast();
	const [updatingStatus, setUpdatingStatus] = useState<
		Record<string, ItemUpdateStatus>
	>({});
	const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [savingStep, setSavingStep] = useState("");
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [isAvailable, setIsAvailable] = useState(true);
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [imageError, setImageError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
		MenuCategory[]
	>({
		queryKey: QUERY_KEYS.menuCategories,
		queryFn: getMenuCategories,
	});

	const { data: items = [], isLoading: isLoadingAll } = useQuery<MenuItem[]>({
		queryKey: QUERY_KEYS.vendorMenuItems,
		queryFn: getVendorMenuItems,
		enabled: viewMode === "all",
	});

	const { data: categoryGroups = [], isLoading: isLoadingGrouped } = useQuery<
		MenuByCategoryGroup[]
	>({
		queryKey: QUERY_KEYS.vendorMenuByCategory,
		queryFn: getMenuByCategory,
		enabled: viewMode === "grouped",
	});

	const isLoading = viewMode === "grouped" ? isLoadingGrouped : isLoadingAll;

	useEffect(() => {
		if (!isDialogOpen) {
			setEditingItem(null);
			setSelectedImage(null);
			setPreviewImage(null);
			setImageError(null);
			setIsAvailable(true);
		}
	}, [isDialogOpen]);

	const invalidateAllMenuQueries = () => {
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorMenuItems });
		queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendorMenuByCategory });
	};

	const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setImageError(null);

		if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
			setImageError("Invalid file type. Please use PNG, JPG, or JPEG.");
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			setImageError("File is too large. Maximum size is 5MB.");
			return;
		}

		setSelectedImage(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewImage(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleSaveItem = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		// For new items, an image is required
		if (!editingItem && !selectedImage) {
			setImageError("An image is required to create a new item.");
			return;
		}

		setIsSaving(true);

		const payload: MenuItemPayload = {
			name: formData.get("name") as string,
			description: formData.get("description") as string,
			price: String(parseFloat(formData.get("price") as string)),
			is_available: isAvailable,
			category_id: formData.get("category_id") as string,
			item_type: formData.get("item_type") as "single" | "combo",
		};

		if (!payload.category_id) {
			toast({
				title: "Category Required",
				description: "Please select a category for the item.",
				variant: "destructive",
			});
			setIsSaving(false);
			return;
		}

		try {
			if (editingItem) {
				// --- Editing Flow ---
				setSavingStep("Updating item details...");
				await updateVendorMenuItem(editingItem.id, payload);

				// If a new image was selected during edit, upload it
				if (selectedImage) {
					setSavingStep("Uploading new image...");
					await uploadMenuItemImage(editingItem.id, selectedImage);
				}

				toast({
					title: "Item Updated",
					description: `${payload.name} has been successfully updated.`,
				});
			} else {
				// --- Creating Flow ---
				if (!selectedImage) {
					throw new Error("Image not selected");
				}

				setSavingStep("Creating menu item...");
				const newItem = await createVendorMenuItem(payload);

				setSavingStep("Uploading image...");
				await uploadMenuItemImage(newItem.id, selectedImage);

				toast({
					title: "Item Added",
					description: `${payload.name} has been successfully added.`,
				});
			}

			await invalidateAllMenuQueries();
			setDialogOpen(false);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred.";
			const action = editingItem ? "Update" : "Add";
			toast({
				title: `Failed to ${action} Item`,
				description: message,
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
			setSavingStep("");
		}
	};

	const handleDeleteItem = async () => {
		if (!itemToDelete) return;

		try {
			await deleteVendorMenuItem(itemToDelete.id);
			await invalidateAllMenuQueries();
			toast({
				title: "Item Deleted",
				description: `${itemToDelete.name} has been removed from your menu.`,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to delete item.";
			toast({
				title: "Deletion Failed",
				description: message,
				variant: "destructive",
			});
		} finally {
			setItemToDelete(null);
		}
	};

	const handleToggleAvailability = async (
		itemId: string,
		available: boolean,
	) => {
		setUpdatingStatus((prev) => ({ ...prev, [itemId]: "updating" }));

		// Optimistic update on flat list
		const previousItems = queryClient.getQueryData<MenuItem[]>(QUERY_KEYS.vendorMenuItems);
		queryClient.setQueryData<MenuItem[]>(QUERY_KEYS.vendorMenuItems, (old) =>
			old?.map((item) =>
				item.id === itemId ? { ...item, is_available: available } : item,
			),
		);

		// Optimistic update on grouped list
		const previousGrouped = queryClient.getQueryData<MenuByCategoryGroup[]>(QUERY_KEYS.vendorMenuByCategory);
		queryClient.setQueryData<MenuByCategoryGroup[]>(
			QUERY_KEYS.vendorMenuByCategory,
			(old) =>
				old?.map((group) => ({
					...group,
					items: group.items.map((item) =>
						item.id === itemId ? { ...item, is_available: available } : item,
					),
				})),
		);

		try {
			await updateMenuItemAvailability(itemId, available);
			setUpdatingStatus((prev) => ({ ...prev, [itemId]: "success" }));
			toast({
				title: "Update applied",
				description: `Item is now ${available ? "available" : "unavailable"}.`,
			});
		} catch (error) {
			// Rollback
			queryClient.setQueryData(QUERY_KEYS.vendorMenuItems, previousItems);
			queryClient.setQueryData(QUERY_KEYS.vendorMenuByCategory, previousGrouped);
			setUpdatingStatus((prev) => ({ ...prev, [itemId]: "error" }));
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred.";
			toast({
				title: "Update failed",
				description: message,
				variant: "destructive",
			});
		} finally {
			setTimeout(() => {
				setUpdatingStatus((prev) => ({ ...prev, [itemId]: "idle" }));
			}, 5000);
		}
	};

	const openEditDialog = (item: MenuItem) => {
		setEditingItem(item);
		setIsAvailable(item.is_available);
		setDialogOpen(true);
	};

	const openEditFromGrouped = (item: MenuCategoryItem, categoryId: string) => {
		setEditingItem(mapToMenuItem(item, categoryId, categories));
		setIsAvailable(item.is_available);
		setDialogOpen(true);
	};

	const openDeleteFromGrouped = (item: MenuCategoryItem) => {
		setItemToDelete(mapToMenuItem(item, "", categories));
	};

	const renderAvailabilityToggle = (itemId: string, isAvailable: boolean) => {
		const status = updatingStatus[itemId] || "idle";
		const isUpdating = status !== "idle";

		return (
			<div className="flex items-center space-x-2">
				<Switch
					id={`available-${itemId}`}
					checked={isAvailable}
					onCheckedChange={(checked) =>
						handleToggleAvailability(itemId, checked)
					}
					disabled={isUpdating}
				/>
				{status === "updating" && (
					<span className="text-xs text-muted-foreground animate-pulse">
						Updating...
					</span>
				)}
				{status === "success" && (
					<span className="text-xs text-green-600">
						Update applied.
					</span>
				)}
				{status === "error" && (
					<span className="text-xs text-red-600">
						Update failed.
					</span>
				)}
				{status === "idle" && (
					<Badge
						variant={
							isAvailable ? "default" : "outline"
						}
						className={
							isAvailable ? "bg-green-600" : ""
						}
					>
						{isAvailable ? "On" : "Off"}
					</Badge>
				)}
			</div>
		);
	};

	const renderItemImage = (imageUrl: string | null, name: string) => {
		const src =
			imageUrl && imageUrl.startsWith("http")
				? imageUrl
				: "https://placehold.co/64x64.png";
		return (
			<img
				src={src}
				alt={name}
				width={64}
				height={64}
				className="rounded-md object-cover"
			/>
		);
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
			<AlertDialog
				open={!!itemToDelete}
				onOpenChange={(open) => !open && setItemToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							item
							<span className="font-bold"> {itemToDelete?.name}</span> from your
							menu.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteItem}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<div>
						<CardTitle>Your Menu Items</CardTitle>
						<CardDescription>
							Add, edit, or remove items from your menu.
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex items-center rounded-md border p-1">
							<button
								onClick={() => setViewMode("grouped")}
								className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition-colors ${
									viewMode === "grouped"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								data-testid="view-grouped"
							>
								<LayoutGrid className="h-4 w-4" />
								<span className="hidden sm:inline">Grouped</span>
							</button>
							<button
								onClick={() => setViewMode("all")}
								className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium transition-colors ${
									viewMode === "all"
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
								data-testid="view-all"
							>
								<List className="h-4 w-4" />
								<span className="hidden sm:inline">All</span>
							</button>
						</div>
						<DialogTrigger asChild>
							<Button>
								<PlusCircle className="mr-2 h-4 w-4" /> Add Item
							</Button>
						</DialogTrigger>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						viewMode === "grouped" ? (
							<div className="space-y-6">
								{Array.from({ length: 2 }).map((_, gi) => (
									<div key={`group-skeleton-${gi}`}>
										<Skeleton className="h-6 w-32 mb-3" />
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="hidden w-[100px] sm:table-cell">
														Image
													</TableHead>
													<TableHead>Name</TableHead>
													<TableHead>Price</TableHead>
													<TableHead>Availability</TableHead>
													<TableHead>Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{Array.from({ length: 3 }).map((_, i) => (
													<TableRow key={`item-skeleton-${gi}-${i}`}>
														<TableCell className="hidden sm:table-cell">
															<Skeleton className="h-16 w-16 rounded-md" />
														</TableCell>
														<TableCell>
															<Skeleton className="h-5 w-32" />
														</TableCell>
														<TableCell>
															<Skeleton className="h-5 w-16" />
														</TableCell>
														<TableCell>
															<Skeleton className="h-6 w-20" />
														</TableCell>
														<TableCell>
															<Skeleton className="h-8 w-8" />
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								))}
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="hidden w-[100px] sm:table-cell">
											Image
										</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>Availability</TableHead>
										<TableHead>Date Added</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Array.from({ length: 5 }).map((_, i) => (
										<TableRow key={`menu-item-skeleton-${i}`}>
											<TableCell className="hidden sm:table-cell">
												<Skeleton className="h-16 w-16 rounded-md" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-5 w-32" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-5 w-16" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-6 w-20" />
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
						)
					) : viewMode === "grouped" ? (
						// Grouped view
						categoryGroups.length === 0 ? (
							<div className="text-center py-12">
								<p className="text-muted-foreground mb-4">
									No menu items available. Please add a new item.
								</p>
								<DialogTrigger asChild>
									<Button>
										<PlusCircle className="mr-2 h-4 w-4" /> Add Your First Item
									</Button>
								</DialogTrigger>
							</div>
						) : (
							<div className="space-y-8">
								{categoryGroups.map((group) => (
									<div key={group.id}>
										<h3 className="text-lg font-semibold mb-3">{group.name}</h3>
										{group.items.length === 0 ? (
											<p className="text-sm text-muted-foreground py-4">
												No items in this category.
											</p>
										) : (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="hidden w-[100px] sm:table-cell">
															Image
														</TableHead>
														<TableHead>Name</TableHead>
														<TableHead>Price</TableHead>
														<TableHead>Availability</TableHead>
														<TableHead>Actions</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{group.items.map((item) => (
														<TableRow key={item.id}>
															<TableCell className="hidden sm:table-cell">
																{renderItemImage(item.image_url, item.name)}
															</TableCell>
															<TableCell className="font-medium">
																{item.name}
															</TableCell>
															<TableCell>
																₦{parseFloat(item.price).toFixed(2)}
															</TableCell>
															<TableCell>
																{renderAvailabilityToggle(item.id, item.is_available)}
															</TableCell>
															<TableCell>
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button variant="ghost" className="h-8 w-8 p-0">
																			<span className="sr-only">Open menu</span>
																			<MoreHorizontal className="h-4 w-4" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end">
																		<DropdownMenuItem
																			onClick={() =>
																				openEditFromGrouped(item, group.id)
																			}
																		>
																			<Edit className="mr-2 h-4 w-4" /> Edit
																		</DropdownMenuItem>
																		<DropdownMenuItem
																			onClick={() => openDeleteFromGrouped(item)}
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
									</div>
								))}
							</div>
						)
					) : items?.length === 0 ? (
						// All view - empty
						<div className="text-center py-12">
							<p className="text-muted-foreground mb-4">
								No menu items available. Please add a new item.
							</p>
							<DialogTrigger asChild>
								<Button>
									<PlusCircle className="mr-2 h-4 w-4" /> Add Your First Item
								</Button>
							</DialogTrigger>
						</div>
					) : (
						// All view - table
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="hidden w-[100px] sm:table-cell">
										Image
									</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>Availability</TableHead>
									<TableHead>Date Added</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items?.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="hidden sm:table-cell">
											{renderItemImage(item.image_url, item.name)}
										</TableCell>
										<TableCell className="font-medium">{item.name}</TableCell>
										<TableCell>
											₦{parseFloat(item.price).toFixed(2)}
										</TableCell>
										<TableCell>
											{renderAvailabilityToggle(item.id, item.is_available)}
										</TableCell>
										<TableCell>
											{item.created_at &&
											!isNaN(new Date(item.created_at).getTime())
												? new Date(item.created_at).toLocaleDateString("en-GB", {
														day: "2-digit",
														month: "short",
														year: "numeric",
												  })
												: "—"}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => openEditDialog(item)}
													>
														<Edit className="mr-2 h-4 w-4" /> Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setItemToDelete(item)}
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

			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{editingItem ? "Edit Item" : "Add a New Item"}
					</DialogTitle>
					<DialogDescription>
						Fill in the details for your menu item below.
					</DialogDescription>
				</DialogHeader>
				<form id="item-form" onSubmit={handleSaveItem}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="image">Image</Label>
							<Input
								id="image"
								name="image"
								type="file"
								ref={fileInputRef}
								onChange={handleImageChange}
								accept={ACCEPTED_IMAGE_TYPES.join(",")}
								className="hidden"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								className="w-full"
							>
								<UploadCloud className="mr-2 h-4 w-4" />
								{selectedImage ? "Change Image" : "Upload Image"}
							</Button>
							{(previewImage || editingItem?.image_url) && (
								<div className="mt-4 relative w-32 h-32">
									<img
										src={
											previewImage ||
											editingItem?.image_url ||
											"https://placehold.co/128x128.png"
										}
										alt="Item preview"
										className="absolute inset-0 h-full w-full rounded-md object-cover"
									/>
								</div>
							)}
							{imageError && (
								<p className="text-sm text-red-500 mt-2">{imageError}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								defaultValue={editingItem?.name}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								defaultValue={editingItem?.description || ""}
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="price">Price (₦)</Label>
								<Input
									id="price"
									name="price"
									type="number"
									step="0.01"
									defaultValue={editingItem?.price}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="category_id">Category</Label>
								<Select
									name="category_id"
									defaultValue={
										(typeof editingItem?.category === "object"
											? editingItem?.category?.id
											: editingItem?.category) || ""
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										{isLoadingCategories ? (
											<SelectItem value="loading" disabled>
												Loading...
											</SelectItem>
										) : (
											categories.map((cat) => (
												<SelectItem key={cat.id} value={cat.id}>
													{cat.name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="item_type">Item Type</Label>
								<Select
									name="item_type"
									defaultValue={editingItem?.item_type || "single"}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select item type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="single">Single</SelectItem>
										<SelectItem value="combo">Combo</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2 pt-8">
								<div className="flex items-center space-x-2">
									<Switch
										id="is_available"
										checked={isAvailable}
										onCheckedChange={setIsAvailable}
									/>
									<Label htmlFor="is_available">Available for purchase</Label>
								</div>
							</div>
						</div>
					</div>
				</form>
				<DialogFooter>
					<Button type="submit" form="item-form" disabled={isSaving}>
						{isSaving ? savingStep || "Saving..." : "Save changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
