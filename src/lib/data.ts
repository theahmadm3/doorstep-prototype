

import type { OrderStatus as Status } from './types';

export const restaurants = [
  { id: 1, name: "Pizza Palace" },
  { id: 2, name: "Burger Barn" },
  { id: 3, name: "Sushi Station" },
  { id: 4, name: "Taco Town" },
];

export const foodItems = [
  { id: '1', restaurant: '1', name: "Margherita Pizza", description: "Classic cheese and tomato pizza.", price: '12.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Pizzas", created_at: "", updated_at: "" },
  { id: '2', restaurant: '1', name: "Pepperoni Pizza", description: "Loaded with pepperoni.", price: '14.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Pizzas", created_at: "", updated_at: "" },
  { id: '3', restaurant: '2', name: "Cheeseburger", description: "Juicy beef patty with cheese.", price: '8.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burgers", created_at: "", updated_at: "" },
  { id: '4', restaurant: '2', name: "Bacon Burger", description: "Burger with crispy bacon.", price: '10.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burgers", created_at: "", updated_at: "" },
  { id: '5', restaurant: '3', name: "California Roll", description: "Crab, avocado, and cucumber.", price: '7.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Sushi", created_at: "", updated_at: "" },
  { id: '6', restaurant: '3', name: "Spicy Tuna Roll", description: "Tuna with a spicy kick.", price: '9.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Sushi", created_at: "", updated_at: "" },
  { id: '7', restaurant: '4', name: "Beef Tacos", description: "Three beef tacos.", price: '9.50', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Tacos", created_at: "", updated_at: "" },
  { id: '8', restaurant: '4', name: "Chicken Burrito", description: "Large burrito with chicken.", price: '11.50', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burritos", created_at: "", updated_at: "" },
];

export type OrderStatus = Status;

export const orderStatusFlow: OrderStatus[] = ['Order Placed', 'Vendor Accepted', 'Preparing', 'Order Ready', 'Rider Assigned', 'Rider on the Way', 'Delivered'];
export const orderStatusSteps: OrderStatus[] = ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'On the Way', 'Delivered'];
export const pickupOrderStatusSteps: OrderStatus[] = ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed'];

export const users = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", totalOrders: 25 },
    { id: 2, name: "Bob Williams", email: "bob@example.com", totalOrders: 18 },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", totalOrders: 32 },
    { id: 4, name: "Diana Prince", email: "diana@example.com", totalOrders: 15 },
];

export const analyticsData = {
    topRestaurants: [
        { name: "Burger Barn", sales: 4500, orders: 400 },
        { name: "Pizza Palace", sales: 4200, orders: 350 },
        { name: "Taco Town", sales: 3800, orders: 500 },
        { name: "Sushi Station", sales: 3200, orders: 280 },
    ],
    topItems: [
        { name: "Cheeseburger", sales: 1200 },
        { name: "Pepperoni Pizza", sales: 1100 },
        { name: "Bacon Burger", sales: 950 },
        { name: "Chicken Burrito", sales: 800 },
    ],
    topUsers: users.sort((a,b) => b.totalOrders - a.totalOrders).slice(0,5),
};
