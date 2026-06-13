/**
 * Minimal, valid fixtures for the authenticated E2E specs. Each builder returns
 * an object matching the shape the app's `api.ts` unwraps, with overridable
 * fields. Dates are ISO strings (several `api.ts` functions run them through
 * `date-fns` `format`, which requires a parseable date).
 */

const ISO = "2026-06-13T10:30:00Z";

export function restaurant(over: Record<string, unknown> = {}) {
  return {
    id: "rest-1",
    owner: {
      id: "owner-1",
      full_name: "Mama Put",
      email: "owner@doorstep.com",
      phone_number: "08012345678",
      role: "restaurant",
      status: "Active",
      avatar_url: null,
      created_at: ISO,
    },
    name: "Mama Put Kitchen",
    description: "Home-style Nigerian dishes",
    address: {
      id: "addr-r1",
      street_name: "12 Allen Avenue",
      latitude: "6.5244",
      longitude: "3.3792",
    },
    image_url: null,
    rating: "4.6",
    is_active: true,
    created_at: ISO,
    updated_at: ISO,
    ...over,
  };
}

export function menuItem(over: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    restaurant: "rest-1",
    name: "Jollof Rice & Chicken",
    description: "Smoky party jollof with grilled chicken",
    price: "3500.00",
    image_url: null,
    is_available: true,
    category: { id: "cat-1", name: "Mains", order_index: 0 },
    options: {},
    item_type: "single",
    created_at: ISO,
    updated_at: ISO,
    ...over,
  };
}

export function address(over: Record<string, unknown> = {}) {
  return {
    id: "addr-1",
    user: "test-id",
    is_default: true,
    street_address: "5 Marina Road",
    city: "Lagos",
    nearest_landmark: "Near the bank",
    address_nickname: "Home",
    latitude: "6.4500",
    longitude: "3.4000",
    ...over,
  };
}

export function customerOrder(over: Record<string, unknown> = {}) {
  return {
    id: "order-cust-1",
    restaurant_id: "rest-1",
    restaurant_name: "Mama Put Kitchen",
    total_amount: "4200.00",
    status: "Order Placed",
    created_at: ISO,
    delivery_address: {
      street_address: "5 Marina Road",
      city: "Lagos",
      nearest_landmark: "Near the bank",
      address_nickname: "Home",
      latitude: "6.4500",
      longitude: "3.4000",
    },
    order_type: "delivery",
    delivery_fee: "700.00",
    ...over,
  };
}

export function vendorOrder(over: Record<string, unknown> = {}) {
  return {
    id: "order-vend-0001abcd",
    customer_name: "Ada Customer",
    total_amount: "4200.00",
    status: "Pending",
    created_at: ISO,
    order_type: "delivery",
    ...over,
  };
}

export function vendorProfile(over: Record<string, unknown> = {}) {
  return {
    id: "rest-1",
    owner: {
      id: "owner-1",
      full_name: "Mama Put",
      email: "owner@doorstep.com",
      phone_number: "08012345678",
      role: "restaurant",
      status: "Active",
      avatar_url: null,
    },
    name: "Mama Put Kitchen",
    description: "Home-style Nigerian dishes",
    address: { street_name: "12 Allen Avenue", latitude: 6.5244, longitude: 3.3792 },
    image_url: null,
    rating: "4.6",
    is_active: true,
    is_open: true,
    ...over,
  };
}

export function vendorAnalytics(over: Record<string, unknown> = {}) {
  return {
    restaurant: "Mama Put Kitchen",
    total_revenue: "1250000.00",
    platform_revenue_from_this_restaurant: "125000.00",
    total_orders: 320,
    active_orders: 4,
    delivered_orders: 300,
    cancelled_orders: 16,
    top_items: [
      { item_name: "Jollof Rice & Chicken", orders: 120 },
      { item_name: "Pounded Yam & Egusi", orders: 90 },
    ],
    ...over,
  };
}

export function riderOrder(over: Record<string, unknown> = {}) {
  return {
    id: "order-ride-0001abcd",
    status: "Arrived at Destination",
    total_amount: "4200.00",
    delivery_fee: "700.00",
    restaurant_latitude: "6.5244",
    restaurant_longitude: "3.3792",
    delivery_latitude: "6.4500",
    delivery_longitude: "3.4000",
    order_type: "delivery",
    customer: { name: "Ada Customer", phone: "08087654321" },
    delivery_address_str: "5 Marina Road, Lagos",
    created_at: ISO,
    restaurant: "Mama Put Kitchen",
    ...over,
  };
}

export function adminUser(over: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "ada@doorstep.com",
    full_name: "Ada Customer",
    phone_number: "08087654321",
    role: "customer",
    status: "Active",
    is_active: true,
    ...over,
  };
}

export function adminOrder(over: Record<string, unknown> = {}) {
  return {
    id: "order-admin-0001abcd",
    customer_name: "Ada Customer",
    restaurant_name: "Mama Put Kitchen",
    total_amount: "4200.00",
    status: "Pending",
    payment_method: "card",
    created_at: ISO,
    order_type: "delivery",
    ...over,
  };
}
