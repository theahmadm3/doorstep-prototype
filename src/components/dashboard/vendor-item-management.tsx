
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	PlusCircle,
	MoreHorizontal,
	Edit,
	Trash2,
	UploadCloud,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MenuItem, MenuItemPayload } from "@/lib/types";
import {
	createVendorMenuItem,
	getVendorMenuItems,
	updateMenuItemAvailability,
	updateVendorMenuItem,
	deleteVendorMenuItem,
	uploadMenuItemImage,
} from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const itemFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters."),
	description: z.string().min(10, "Description must be at least 10 characters."),
	price: z.coerce.number().positive("Price must be a positive number."),
	is_available: z.boolean().default(true),
	image: z
		.any()
		.refine((files) => files?.[0], { message: "Image is required." })
		.refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, {
			message: `Max file size is 5MB.`,
		})
		.refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), {
			message: "Only .jpg, .jpeg, and .png formats are supported.",
		})
		.optional(),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

export default function VendorItemManagement() {
	const [items, setItems] = useState<MenuItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
	const { toast } = useToast();
	const [updatingStatus, setUpdatingStatus] = useState<
		Record<string, "idle" | "updating" | "success" | "error">
	>({});
	const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	const form = useForm<ItemFormData>({
		resolver: zodResolver(itemFormSchema),
		mode: "onChange",
	});

	const {
		formState: { isSubmitting, isValid },
		watch,
	} = form;
	const imageFile = watch("image");

	useEffect(() => {
		let fileReader: FileReader, isCancel = false;
		if (imageFile && imageFile.length) {
			const file = imageFile[0];
			if (file instanceof File) {
				fileReader = new FileReader();
				fileReader.onload = (e) => {
					const { result } = e.target as FileReader;
					if (result && !isCancel) {
						setPreviewImage(result as string);
					}
				}
				fileReader.readAsDataURL(file);
			}
		} else {
			setPreviewImage(null);
		}
	
		return () => {
			isCancel = true;
			if (fileReader && fileReader.readyState === 1) {
				fileReader.abort();
			}
		}
	}, [imageFile]);

	const fetchItems = async () => {
		setIsLoading(true);
		try {
			const fetchedItems = await getVendorMenuItems();
			setItems(fetchedItems);
		} catch (error) {
			toast({
				title: "Error fetching menu",
				description:
					"Could not retrieve your menu items. Please try again later.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchItems();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleOpenDialog = (item: MenuItem | null) => {
		setEditingItem(item);
		if (item) {
			// Editing existing item, image is not required to be re-uploaded
			const editSchema = itemFormSchema.extend({
				image: itemFormSchema.shape.image.optional(),
			});
			form.reset({
				...item,
				price: parseFloat(item.price),
			});
		} else {
			// Adding new item, image is required
			form.reset({
				name: "",
				description: "",
				price: undefined,
				is_available: true,
			});
		}
		setPreviewImage(item?.image_url || null);
		setDialogOpen(true);
	};

	const handleSaveItem = async (data: ItemFormData) => {
		const payload: MenuItemPayload = {
			name: data.name,
			description: data.description,
			price: String(data.price),
			is_available: data.is_available,
		};
		const imageFile = data.image?.[0];

		try {
			if (editingItem) {
				const updatedItemData = await updateVendorMenuItem(
					editingItem.id,
					payload,
				);
				let finalItem = updatedItemData;

				if (imageFile) {
					finalItem = await uploadMenuItemImage(editingItem.id, imageFile);
				}

				setItems(
					items.map((item) => (item.id === editingItem.id ? finalItem : item)),
				);
				toast({
					title: "Item Updated",
					description: `${payload.name} has been successfully updated.`,
				});
			} else {
				if (!imageFile) throw new Error("Image is required for new items.");

				const newItem = await createVendorMenuItem(payload);
				const newItemWithImage = await uploadMenuItemImage(newItem.id, imageFile);

				setItems([newItemWithImage, ...items]);
				toast({
					title: "Item Added",
					description: `${payload.name} has been successfully added.`,
				});
			}
			setDialogOpen(false);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "An unexpected error occurred.";
			toast({
				title: `Failed to ${editingItem ? "Update" : "Add"} Item`,
				description: message,
				variant: "destructive",
			});
		}
	};

	const handleDeleteItem = async () => {
		if (!itemToDelete) return;
		try {
			await deleteVendorMenuItem(itemToDelete.id);
			setItems(items.filter((item) => item.id !== itemToDelete.id));
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
		const originalItems = [...items];
		setItems((prevItems) =>
			prevItems.map((item) =>
				item.id === itemId ? { ...item, is_available: available } : item,
			),
		);

		try {
			await updateMenuItemAvailability(itemId, available);
			setUpdatingStatus((prev) => ({ ...prev, [itemId]: "success" }));
			toast({
				title: "Update applied",
				description: `Item is now ${available ? "available" : "unavailable"}.`,
			});
		} catch (error) {
			setItems(originalItems);
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
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Your Menu Items</CardTitle>
						<CardDescription>
							Add, edit, or remove items from your menu.
						</CardDescription>
					</div>
					<Button onClick={() => handleOpenDialog(null)}>
						<PlusCircle className="mr-2 h-4 w-4" /> Add Item
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
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
									<TableRow key={`menu-skeleton-${i}`}>
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
					) : items.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground mb-4">
								No menu items available. Please add a new item.
							</p>
							<Button onClick={() => handleOpenDialog(null)}>
								<PlusCircle className="mr-2 h-4 w-4" /> Add Your First Item
							</Button>
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
								{items.map((item) => {
									const status = updatingStatus[item.id] || "idle";
									const isUpdating = status !== "idle";
									const imageUrl =
										item.image_url && item.image_url.startsWith("http")
											? item.image_url
											: "https://placehold.co/64x64.png";

									return (
										<TableRow key={item.id}>
											<TableCell className="hidden sm:table-cell">
												<Image
													src={imageUrl}
													alt={item.name}
													width={64}
													height={64}
													className="rounded-md object-cover"
												/>
											</TableCell>
											<TableCell className="font-medium">{item.name}</TableCell>
											<TableCell>
												₦{parseFloat(item.price).toFixed(2)}
											</TableCell>
											<TableCell>
												<div className="flex items-center space-x-2">
													<Switch
														id={`available-${item.id}`}
														checked={item.is_available}
														onCheckedChange={(checked) =>
															handleToggleAvailability(item.id, checked)
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
																item.is_available ? "default" : "outline"
															}
															className={cn(
																item.is_available ? "bg-green-600" : "",
															)}
														>
															{item.is_available ? "On" : "Off"}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												{item.created_at &&
												!isNaN(new Date(item.created_at).getTime())
													? format(new Date(item.created_at), "dd MMM yyyy")
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
															onClick={() => handleOpenDialog(item)}
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
									);
								})}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{editingItem ? "Edit Item" : "Add a New Item"}
					</DialogTitle>
					<DialogDescription>
						Fill in the details for your menu item below.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="item-form"
						onSubmit={form.handleSubmit(handleSaveItem)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
							name="image"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Image</FormLabel>
									<FormControl>
										<Input
											type="file"
											accept={ACCEPTED_IMAGE_TYPES.join(",")}
											onChange={(e) => field.onChange(e.target.files)}
										/>
									</FormControl>
									<FormMessage />
									{(previewImage || editingItem?.image_url) && (
										<div className="mt-4 relative w-32 h-32">
											<Image
												src={
													previewImage ||
													editingItem?.image_url ||
													"https://placehold.co/128x128.png"
												}
												alt="Item preview"
												fill
												className="rounded-md object-cover"
											/>
										</div>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="price"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Price (₦)</FormLabel>
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
										<FormLabel>Available for ordering</FormLabel>
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
						form="item-form"
						disabled={isSubmitting || !isValid}
					>
						{isSubmitting ? "Saving..." : "Save changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
