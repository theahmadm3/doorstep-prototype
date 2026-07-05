import type { Order } from "@/lib/types";

export default function FloatingCartButton({
	order,
	onCheckout,
}: {
	order: Order | undefined;
	onCheckout: () => void;
}) {
	if (!order || order.items.length === 0) return null;
	const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
	return (
		<div className="fixed bottom-20 md:bottom-6 left-0 right-0 px-5 z-20 pointer-events-none max-w-md mx-auto">
			<button
				onClick={onCheckout}
				className="
                    pointer-events-auto w-full h-14 rounded-full
                    relative overflow-hidden
                    bg-primary text-primary-foreground font-semibold text-base
                    shadow-lg border border-primary/20
                    transition-all duration-200 ease-out
                    hover:opacity-90 hover:scale-[1.025] hover:shadow-xl
                    active:scale-[0.98]
                    flex items-center justify-between px-5
                "
			>
				{/* Crystal highlight streak */}
				<span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />
				<span className="relative bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
					{itemCount}
				</span>
				<span className="relative font-semibold tracking-wide">View Cart</span>
				<span className="relative font-bold">₦{order.total.toFixed(2)}</span>
			</button>
		</div>
	);
}
