
import type { OrderStatus as Status, Order } from './types';

export const restaurants = [
  { id: 1, name: "Pizza Palace" },
  { id: 2, name: "Burger Barn" },
  { id: 3, name: "Sushi Station" },
  { id: 4, name: "Taco Town" },
];

export const foodItems = [
  { id: '1', restaurant: '1', name: "Margherita Pizza", description: "Classic cheese and tomato pizza.", price: '12.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Pizzas", created_at: "", updated_at: "", quantity: 20 },
  { id: '2', restaurant: '1', name: "Pepperoni Pizza", description: "Loaded with pepperoni.", price: '14.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Pizzas", created_at: "", updated_at: "", quantity: 15 },
  { id: '3', restaurant: '2', name: "Cheeseburger", description: "Juicy beef patty with cheese.", price: '8.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burgers", created_at: "", updated_at: "", quantity: 30 },
  { id: '4', restaurant: '2', name: "Bacon Burger", description: "Burger with crispy bacon.", price: '10.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burgers", created_at: "", updated_at: "", quantity: 25 },
  { id: '5', restaurant: '3', name: "California Roll", description: "Crab, avocado, and cucumber.", price: '7.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Sushi", created_at: "", updated_at: "", quantity: 40 },
  { id: '6', restaurant: '3', name: "Spicy Tuna Roll", description: "Tuna with a spicy kick.", price: '9.99', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Sushi", created_at: "", updated_at: "", quantity: 35 },
  { id: '7', restaurant: '4', name: "Beef Tacos", description: "Three beef tacos.", price: '9.50', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Tacos", created_at: "", updated_at: "", quantity: 50 },
  { id: '8', restaurant: '4', name: "Chicken Burrito", description: "Large burrito with chicken.", price: '11.50', image_url: "https://placehold.co/300x200.png", is_available: true, category: "Burritos", created_at: "", updated_at: "", quantity: 45 },
];

export type OrderStatus = Status;

export const orderStatusFlow: OrderStatus[] = ['Order Placed', 'Vendor Accepted', 'Preparing', 'Order Ready', 'Rider Assigned', 'Rider on the Way', 'Delivered'];

export const orders: Order[] = [
  {
    id: "ORD001",
    customerId: "1",
    restaurantId: "1",
    date: "2023-10-26",
    total: 27.98,
    status: "Delivered",
    items: [
      { ...foodItems[0], quantity: 1 },
      { ...foodItems[1], quantity: 1 },
    ],
  },
  {
    id: "ORD002",
    customerId: "2",
    restaurantId: "2",
    date: "2023-10-27",
    total: 19.98,
    status: "Preparing",
    items: [
      { ...foodItems[2], quantity: 1 },
      { ...foodItems[3], quantity: 1 },
    ],
  },
  {
    id: "ORD003",
    customerId: "1",
    restaurantId: "3",
    date: "2023-10-28",
    total: 17.98,
    status: "Rider on the Way",
    items: [
      { ...foodItems[4], quantity: 1 },
      { ...foodItems[5], quantity: 1 },
    ],
  },
   {
    id: "ORD004",
    customerId: "3",
    restaurantId: "1",
    date: "2023-10-28",
    total: 12.99,
    status: "Order Placed",
    items: [
      { ...foodItems[0], quantity: 1 },
    ],
  },
   {
    id: "ORD005",
    customerId: "4",
    restaurantId: "4",
    date: "2023-10-28",
    total: 9.50,
    status: "Order Ready",
    items: [
      { ...foodItems[6], quantity: 1 },
    ],
  },
  {
    id: "ORD006",
    customerId: "2",
    restaurantId: "4",
    date: "2023-10-28",
    total: 11.50,
    status: "Rider Assigned",
    items: [
      { ...foodItems[7], quantity: 1 },
    ],
  },
];

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
