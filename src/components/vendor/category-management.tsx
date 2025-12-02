
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	getMenuCategories,
	createMenuCategory,
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
import { PlusCircle } from "lucide-react";

export default function CategoryManagement() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [isDialogOpen, setDialogOpen] = useState(false);

	const { data: categories = [], isLoading } = useQuery<MenuCategory[], Error>({
		queryKey: ["menuCategories"],
		queryFn: getMenuCategories,
	});

	const form = useForm<CategoryPayload>({
		resolver: zodResolver(categorySchema),
		defaultValues: { name: "" },
	});

	const { mutate, isPending } = useMutation({
		mutationFn: createMenuCategory,
		onSuccess: () => {
			toast({
				title: "Category Created",
				description: "The new category has been added successfully.",
			});
			queryClient.invalidateQueries({ queryKey: ["menuCategories"] });
			setDialogOpen(false);
			form.reset();
		},
		onError: (error) => {
			toast({
				title: "Failed to Create Category",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	const onSubmit = (data: CategoryPayload) => {
		mutate(data);
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Menu Categories</CardTitle>
						<CardDescription>
							Group your menu items into categories.
						</CardDescription>
					</div>
					<DialogTrigger asChild>
						<Button>
							<PlusCircle className="mr-2 h-4 w-4" /> Add Category
						</Button>
					</DialogTrigger>
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
								<Badge key={category.id} variant="secondary" className="text-lg py-1 px-4">
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

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add a New Category</DialogTitle>
					<DialogDescription>
						What is the name of the new category? (e.g., "Pizzas", "Drinks")
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="category-form"
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4 py-4"
					>
						<FormField
							control={form.control}
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
						form="category-form"
						disabled={isPending}
					>
						{isPending ? "Adding..." : "Add Category"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

    