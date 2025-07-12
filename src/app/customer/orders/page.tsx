import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orders, restaurants } from "@/lib/data";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import OrderStatusTracker from "@/components/dashboard/order-status";
import { Badge } from "@/components/ui/badge";

export default function CustomerOrdersPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Your Orders</h1>
      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {orders.map((order) => {
              const restaurant = restaurants.find(r => r.id === order.restaurantId);
              return (
                <AccordionItem value={order.id} key={order.id}>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-left">
                            <p className="font-bold text-lg">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">{restaurant?.name} - {new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-primary text-lg">${order.total.toFixed(2)}</span>
                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? "bg-green-600 text-white" : ""}>
                                {order.status}
                            </Badge>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div>
                      <h4 className="font-semibold mb-4">Items</h4>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <Image src={item.image} alt={item.name} width={50} height={50} className="rounded-md" />
                                <div>
                                    <p>{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p>${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="font-semibold mb-6">Order Status</h4>
                      <OrderStatusTracker currentStatus={order.status} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
