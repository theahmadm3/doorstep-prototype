"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MenuItem } from "@/lib/types";
import { Plus, Minus } from "lucide-react";

interface AddToCartModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: MenuItem;
	onAddToCart: (item: MenuItem, quantity: number) => void;
}

export default function AddToCartModal({
	isOpen,
	onClose,
	item,
	onAddToCart,
}: AddToCartModalProps) {
	const [quantity, setQuantity] = useState(1);

	const handleAddToCart = () => {
		onAddToCart(item, quantity);
		setQuantity(1); // Reset quantity for next time
	};

	const incrementQuantity = () => setQuantity((prev) => prev + 1);
	const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

	const imageUrl =
		item.image_url && item.image_url.startsWith("http")
			? item.image_url
			: "https://placehold.co/400x400.png";

	const totalPrice = (parseFloat(item.price) * quantity).toFixed(2);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-center">
						{item.name}
					</DialogTitle>
				</DialogHeader>
				<div className="py-4">
					<div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
						<Image src={imageUrl} alt={item.name} fill objectFit="cover" />
					</div>
					<p className="text-muted-foreground text-sm mb-4">
						{item.description}
					</p>
					<div className="flex items-center justify-center gap-4 my-6">
						<Button
							variant="outline"
							size="icon"
							onClick={decrementQuantity}
							disabled={quantity <= 1}
						>
							<Minus className="h-4 w-4" />
						</Button>
						<span className="text-xl font-bold w-12 text-center">
							{quantity}
						</span>
						<Button variant="outline" size="icon" onClick={incrementQuantity}>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleAddToCart} className="w-full" size="lg">
						Add to Cart - ₦{totalPrice}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
