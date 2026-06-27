import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./useCartStore";
import type { MenuItem, OptionChoice } from "@/lib/types";

const mockMenuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: "item-1",
  restaurant: "restaurant-1",
  name: "Jollof Rice",
  description: null,
  price: "1500",
  image_url: null,
  is_available: true,
  category: null,
  options: {},
  item_type: "single",
  active_discounts: [],
  created_at: "",
  updated_at: "",
  ...overrides,
});

const mockOption = (overrides: Partial<OptionChoice> = {}): OptionChoice => ({
  id: "opt-1",
  menu_item: "item-1",
  name: "Chicken",
  type: "protein",
  price_adjustment: "500",
  is_available: true,
  ...overrides,
});

function getStore() {
  return useCartStore.getState();
}

beforeEach(() => {
  useCartStore.setState({ orders: [] });
});

describe("addOrUpdateItem", () => {
  it("creates a new order for first item from a restaurant", () => {
    const item = mockMenuItem();
    getStore().addOrUpdateItem(item, 1, []);

    const { orders } = getStore();
    expect(orders).toHaveLength(1);
    expect(orders[0].restaurantId).toBe("restaurant-1");
    expect(orders[0].items).toHaveLength(1);
    expect(orders[0].items[0].quantity).toBe(1);
    expect(orders[0].items[0].unitPrice).toBe(1500);
    expect(orders[0].items[0].totalPrice).toBe(1500);
    expect(orders[0].total).toBe(1500);
  });

  it("accumulates quantity when same item + same options added twice", () => {
    const item = mockMenuItem();
    getStore().addOrUpdateItem(item, 1, []);
    getStore().addOrUpdateItem(item, 2, []);

    const { orders } = getStore();
    expect(orders[0].items).toHaveLength(1);
    expect(orders[0].items[0].quantity).toBe(3);
    expect(orders[0].items[0].totalPrice).toBe(4500);
    expect(orders[0].total).toBe(4500);
  });

  it("adds a separate cart line when same item has different options", () => {
    const item = mockMenuItem();
    const optA = mockOption({ id: "opt-a" });
    const optB = mockOption({ id: "opt-b" });

    getStore().addOrUpdateItem(item, 1, [optA]);
    getStore().addOrUpdateItem(item, 1, [optB]);

    const { orders } = getStore();
    expect(orders[0].items).toHaveLength(2);
  });

  it("includes option price in unitPrice and totalPrice", () => {
    const item = mockMenuItem({ price: "1500" });
    const opt = mockOption({ price_adjustment: "500" });
    getStore().addOrUpdateItem(item, 2, [opt]);

    const { orders } = getStore();
    const cartItem = orders[0].items[0];
    expect(cartItem.unitPrice).toBe(2000); // 1500 + 500
    expect(cartItem.totalPrice).toBe(4000); // 2000 * 2
    expect(orders[0].total).toBe(4000);
  });

  it("clears unsubmitted orders from other restaurants when starting a new one", () => {
    const itemA = mockMenuItem({ id: "item-a", restaurant: "restaurant-1" });
    const itemB = mockMenuItem({ id: "item-b", restaurant: "restaurant-2" });

    getStore().addOrUpdateItem(itemA, 1, []);
    getStore().addOrUpdateItem(itemB, 1, []);

    const { orders } = getStore();
    expect(orders.filter((o) => o.status === "unsubmitted")).toHaveLength(1);
    expect(orders[0].restaurantId).toBe("restaurant-2");
  });

  it("preserves submitted orders when switching restaurants", () => {
    const itemA = mockMenuItem({ id: "item-a", restaurant: "restaurant-1" });
    const itemB = mockMenuItem({ id: "item-b", restaurant: "restaurant-2" });

    getStore().addOrUpdateItem(itemA, 1, []);
    useCartStore.setState({
      orders: getStore().orders.map((o) => ({ ...o, status: "Order Placed" })),
    });
    getStore().addOrUpdateItem(itemB, 1, []);

    const { orders } = getStore();
    expect(orders).toHaveLength(2);
  });
});

describe("increaseOrderItemQuantity", () => {
  it("increments quantity and recalculates total using stored unitPrice", () => {
    const item = mockMenuItem({ price: "1000" });
    const opt = mockOption({ price_adjustment: "200" });
    const order = getStore().addOrUpdateItem(item, 1, [opt]);
    const cartItemId = order.items[0].cartItemId;

    getStore().increaseOrderItemQuantity(order.id, cartItemId);

    const updated = getStore().orders[0];
    expect(updated.items[0].quantity).toBe(2);
    expect(updated.items[0].totalPrice).toBe(2400); // 1200 * 2 — no float drift
    expect(updated.total).toBe(2400);
  });
});

describe("decreaseOrderItemQuantity", () => {
  it("decrements quantity and recalculates total", () => {
    const item = mockMenuItem({ price: "1000" });
    const order = getStore().addOrUpdateItem(item, 3, []);
    const cartItemId = order.items[0].cartItemId;

    getStore().decreaseOrderItemQuantity(order.id, cartItemId);

    const updated = getStore().orders[0];
    expect(updated.items[0].quantity).toBe(2);
    expect(updated.items[0].totalPrice).toBe(2000);
  });

  it("removes the item when quantity reaches 1", () => {
    const item = mockMenuItem();
    const order = getStore().addOrUpdateItem(item, 1, []);
    const cartItemId = order.items[0].cartItemId;

    getStore().decreaseOrderItemQuantity(order.id, cartItemId);

    expect(getStore().orders).toHaveLength(0);
  });

  it("removes the entire order when last item is removed", () => {
    const item = mockMenuItem();
    const order = getStore().addOrUpdateItem(item, 1, []);
    const cartItemId = order.items[0].cartItemId;

    getStore().decreaseOrderItemQuantity(order.id, cartItemId);

    expect(getStore().orders).toHaveLength(0);
  });
});

describe("removeOrderItem", () => {
  it("removes a specific item from an order", () => {
    const item = mockMenuItem();
    const optA = mockOption({ id: "opt-a" });
    const optB = mockOption({ id: "opt-b" });
    const order = getStore().addOrUpdateItem(item, 1, [optA]);
    getStore().addOrUpdateItem(item, 1, [optB]);

    const cartItemId = getStore().orders[0].items[0].cartItemId;
    getStore().removeOrderItem(order.id, cartItemId);

    expect(getStore().orders[0].items).toHaveLength(1);
  });

  it("removes the entire order when the last item is removed", () => {
    const item = mockMenuItem();
    const order = getStore().addOrUpdateItem(item, 2, []);
    const cartItemId = order.items[0].cartItemId;

    getStore().removeOrderItem(order.id, cartItemId);

    expect(getStore().orders).toHaveLength(0);
  });
});

describe("updateOrderStatus", () => {
  it("updates the order status", () => {
    const item = mockMenuItem();
    const order = getStore().addOrUpdateItem(item, 1, []);

    getStore().updateOrderStatus(order.id, "Order Placed");

    expect(getStore().orders[0].status).toBe("Order Placed");
  });
});

describe("clearUserOrders", () => {
  it("removes all orders", () => {
    getStore().addOrUpdateItem(mockMenuItem(), 1, []);
    getStore().clearUserOrders();

    expect(getStore().orders).toHaveLength(0);
  });
});
