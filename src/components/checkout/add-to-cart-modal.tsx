
"use client";

import { useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MenuItem, OptionChoice } from "@/lib/types";
import { Plus, Minus } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

interface AddToCartModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: MenuItem;
	onAddToCart: (
		item: MenuItem,
		quantity: number,
		selectedOptions: OptionChoice[],
	) => void;
}

export default function AddToCartModal({
	isOpen,
	onClose,
	item,
	onAddToCart,
}: AddToCartModalProps) {
	const [quantity, setQuantity] = useState(1);
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, OptionChoice>
	>({});

	const handleOptionChange = (option: OptionChoice) => {
		setSelectedOptions((prev) => {
			const newOptions = { ...prev };
			if (newOptions[option.id]) {
				delete newOptions[option.id];
			} else {
				newOptions[option.id] = option;
			}
			return newOptions;
		});
	};

	const handleAddToCart = () => {
		onAddToCart(item, quantity, Object.values(selectedOptions));
		setQuantity(1); // Reset for next time
		setSelectedOptions({});
	};

	const incrementQuantity = () => setQuantity((prev) => prev + 1);
	const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

	const { totalPrice } = useMemo(() => {
		const basePrice = parseFloat(item.price);
		const optionsPrice = Object.values(selectedOptions).reduce(
			(acc, opt) => acc + parseFloat(opt.price_adjustment),
			0,
		);
		const total = (basePrice + optionsPrice) * quantity;
		return { totalPrice: total.toFixed(2) };
	}, [item.price, selectedOptions, quantity]);

	const imageUrl =
		item.image_url && item.image_url.startsWith("http")
			? item.image_url
			: "https://placehold.co/400x400.png";

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md p-0">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle className="text-2xl font-bold text-center">
						{item.name}
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="relative w-full h-40">
						<Image
							src={imageUrl}
							alt={item.name}
							fill
							className="object-cover"
						/>
					</div>

					<div className="px-6 text-sm text-muted-foreground">
						{item.description}
					</div>

					<ScrollArea className="max-h-[30vh] px-6">
						<div className="space-y-4">
							{Object.entries(item.options).map(
								([type, choices]) =>
									choices.length > 0 && (
										<div key={type}>
											<h4 className="font-semibold capitalize mb-2">{type}</h4>
											<div className="space-y-2">
												{choices.map((option) => (
													<div
														key={option.id}
														className="flex items-center space-x-3 rounded-md border p-3"
													>
														<Checkbox
															id={`option-${option.id}`}
															checked={!!selectedOptions[option.id]}
															onCheckedChange={() => handleOptionChange(option)}
															disabled={!option.is_available}
														/>
														<Label
															htmlFor={`option-${option.id}`}
															className="flex justify-between w-full cursor-pointer"
														>
															<span>{option.name}</span>
															<span className="font-medium">
																+₦
																{parseFloat(option.price_adjustment).toFixed(2)}
															</span>
														</Label>
													</div>
												))}
											</div>
										</div>
									),
							)}
						</div>
					</ScrollArea>

					<Separator />

					<div className="flex items-center justify-center gap-4">
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
				<DialogFooter className="p-6 pt-0">
					<Button onClick={handleAddToCart} className="w-full" size="lg">
						Add to Cart - ₦{totalPrice}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
