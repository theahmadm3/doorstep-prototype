import { useEffect, useRef } from "react";
import { getOrderPaymentStatus } from "@/lib/api";
import {
	getPendingPayments,
	removePendingPayment,
} from "@/lib/pending-payments";
import { useCartStore } from "@/stores/useCartStore";
import { useToast } from "@/hooks/use-toast";

// Recovers from payments that completed while the app had no memory of them
// (page refresh mid-payment, slow bank transfers settling after the user left).
// Checks each persisted pending payment once per app load; if the backend says
// it's paid, the matching local cart order is cleared so the user can't
// accidentally pay for the same cart twice.
export function usePaymentReconciliation() {
	const removeUnsubmittedOrder = useCartStore(
		(state) => state.removeUnsubmittedOrder,
	);
	const { toast } = useToast();
	const hasRun = useRef(false);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;

		const pending = getPendingPayments();
		if (pending.length === 0) return;

		void (async () => {
			let confirmedCount = 0;
			for (const payment of pending) {
				try {
					const { paid } = await getOrderPaymentStatus(payment.backendOrderId);
					if (paid) {
						removeUnsubmittedOrder(payment.localCartOrderId);
						removePendingPayment(payment.reference);
						confirmedCount += 1;
					}
				} catch {
					// transient failure — record stays, retried on next load
				}
			}
			if (confirmedCount > 0) {
				toast({
					title: "Payment Confirmed",
					description:
						confirmedCount === 1
							? "Your earlier payment went through and your order was placed."
							: "Your earlier payments went through and your orders were placed.",
				});
			}
		})();
	}, [removeUnsubmittedOrder, toast]);
}
