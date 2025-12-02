
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	getMenuCategories,
	createMenuCategory,
	updateMenuCategory,
	deleteMenuCategory,
} from "@/lib/api";
import {
	MenuCategory,
	CategoryPayload,
	categorySchema,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2 } from "lucide-react";

export default function CategoryManagement() {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const [isAddDialogOpen, setAddDialogOpen] = useState(false);
	const [isEditDialogOpen, setEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);

	const { data: categories = [], isLoading } = useQuery<MenuCategory[], Error>({
		queryKey: ["menuCategories"],
		queryFn: getMenuCategories,
	});

	const addForm = useForm<CategoryPayload>({
		resolver: zodResolver(categorySchema),
		defaultValues: { name: "" },
	});

	const editForm = useForm<CategoryPayload>({
		resolver: zodResolver(categorySchema),
	});

	useEffect(() => {
		if (selectedCategory) {
			editForm.reset({ name: selectedCategory.name });
		}
	}, [selectedCategory, editForm]);

	const createMutation = useMutation({
		mutationFn: createMenuCategory,
		onSuccess: () => {
			toast({
				title: "Category Created",
				description: "The new category has been added successfully.",
			});
			queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
			setAddDialogOpen(false);
			addForm.reset();
		},
		onError: (error) => {
			toast({
				title: "Failed to Create Category",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: (data: CategoryPayload) => {
			if (!selectedCategory) throw new Error("No category selected");
			return updateMenuCategory(selectedCategory.id, data);
		},
		onSuccess: () => {
			toast({
				title: "Category Updated",
				description: "The category has been updated successfully.",
			});
			queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
			setEditDialogOpen(false);
			setSelectedCategory(null);
		},
		onError: (error) => {
			toast({
				title: "Failed to Update Category",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!selectedCategory) throw new Error("No category selected");
			return deleteMenuCategory(selectedCategory.id);
		},
		onSuccess: () => {
			toast({
				title: "Category Deleted",
				description: "The category has been successfully deleted.",
			});
			queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
			setDeleteDialogOpen(false);
			setEditDialogOpen(false);
			setSelectedCategory(null);
		},
		onError: (error) => {
			toast({
				title: "Failed to Delete Category",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const onAddSubmit = (data: CategoryPayload) => {
		createMutation.mutate(data);
	};

	const onEditSubmit = (data: CategoryPayload) => {
		updateMutation.mutate(data);
	};

	const handleDeleteClick = () => {
		setDeleteDialogOpen(true);
	};
	
	const handleOpenEditDialog = (category: MenuCategory) => {
		setSelectedCategory(category);
		setEditDialogOpen(true);
	}

	return (
		<>
			{/* Add Dialog */}
			<Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
				<DialogTrigger asChild>
					<Button className="sr-only" aria-hidden="true">Add</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add a New Category</DialogTitle>
						<DialogDescription>
							What is the name of the new category? (e.g., "Pizzas")
						</DialogDescription>
					</DialogHeader>
					<Form {...addForm}>
						<form
							id="add-category-form"
							onSubmit={addForm.handleSubmit(onAddSubmit)}
							className="space-y-4 py-4"
						>
							<FormField
								control={addForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Sides" {...field} />
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
							form="add-category-form"
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? "Adding..." : "Add Category"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			
			{/* Edit/Delete Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
						<DialogDescription>
							Update the category name or delete it.
						</DialogDescription>
					</DialogHeader>
					<Form {...editForm}>
						<form
							id="edit-category-form"
							onSubmit={editForm.handleSubmit(onEditSubmit)}
							className="space-y-4 py-4"
						>
							<FormField
								control={editForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
					<DialogFooter className="justify-between sm:justify-between">
						<Button
							variant="destructive"
							onClick={handleDeleteClick}
							disabled={deleteMutation.isPending}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							{deleteMutation.isPending ? "Deleting..." : "Delete"}
						</Button>
						<Button
							type="submit"
							form="edit-category-form"
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the 
							<strong> {selectedCategory?.name} </strong> category.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => deleteMutation.mutate()}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Main Card */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Menu Categories</CardTitle>
						<CardDescription>
							Group your menu items into categories.
						</CardDescription>
					</div>
					<Button onClick={() => setAddDialogOpen(true)}>
						<PlusCircle className="mr-2 h-4 w-4" /> Add Category
					</Button>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex flex-wrap gap-2">
							<Skeleton className="h-8 w-24 rounded-full" />
							<Skeleton className="h-8 w-32 rounded-full" />
							<Skeleton className="h-8 w-28 rounded-full" />
						</div>
					) : categories.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{categories.map((category) => (
								<Badge
									key={category.id}
									variant="secondary"
									className="text-lg py-1 px-4 cursor-pointer hover:bg-muted"
									onClick={() => handleOpenEditDialog(category)}
								>
									{category.name}
								</Badge>
							))}
						</div>
					) : (
						<div className="text-center text-muted-foreground py-4">
							<p>No categories found. Add your first one to get started.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
