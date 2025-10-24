
import { orderStatusFlow, OrderStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Bike, ChefHat, Package, PackageCheck, ShoppingCart } from "lucide-react";

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus;
}

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Order Placed': ShoppingCart,
  'Vendor Accepted': Package,
  'Preparing': ChefHat,
  'Order Ready': PackageCheck,
  'Rider Assigned': Bike,
  'Rider on the Way': Bike,
  'Delivered': CheckCircle2,
  'Cancelled': Circle, // Fallback
};

export default function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  const currentStatusIndex = orderStatusFlow.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between w-full overflow-x-auto pb-4">
      {orderStatusFlow.map((status, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const Icon = statusIcons[status] || Circle;

        return (
          <div key={status} className="flex items-center flex-1 min-w-[120px]">
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className={cn("mt-2 text-xs md:text-sm", isCurrent ? "font-bold text-primary" : "text-muted-foreground")}>{status}</p>
            </div>
            {index < orderStatusFlow.length - 1 && (
              <div className={cn("flex-1 h-1 mx-2", isCompleted ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
