# API Documentation

This document describes the API structure and data models used in the Doorstep Prototype application.

## Base URL

The API base URL is configured via the `NEXT_PUBLIC_API_BASE_URL` environment variable.

Default development URL: `http://localhost:8000/api`

## Authentication

All authenticated requests require a Firebase authentication token in the Authorization header:

```
Authorization: Bearer <firebase-token>
```

## Data Models

### User

```typescript
interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: "customer" | "restaurant" | "admin" | "rider";
  status: "Pending" | "Active" | "Suspended";
  avatar_url: string | null;
  created_at: string;
  login_count: number;
}
```

### Restaurant

```typescript
interface Restaurant {
  id: string;
  owner: Owner;
  name: string;
  description: string | null;
  address: RestaurantAddress | null;
  image_url: string | null;
  rating: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RestaurantAddress {
  id: string;
  street_name: string;
  latitude: string;
  longitude: string;
}
```

### Menu Item

```typescript
interface MenuItem {
  id: string;
  restaurant: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}
```

### Order

```typescript
type OrderStatus = 
  | 'unsubmitted'
  | 'Order Placed'
  | 'Vendor Accepted'
  | 'Preparing'
  | 'Order Ready'
  | 'Rider Assigned'
  | 'Rider on the Way'
  | 'Delivered'
  | 'Cancelled'
  | 'Pending'
  | 'Accepted'
  | 'Ready for Pickup'
  | 'On the Way'
  | 'arrived_restaurant'
  | 'pickedup'
  | 'arrived_destination'
  | 'Picked Up by Customer'
  | 'Completed';

interface Order {
  id: string;
  restaurantId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  date?: string;
  customerId?: string;
  distance?: number;
  deliveryFee?: number;
}

interface OrderItem extends MenuItem {
  quantity: number;
}
```

### Address

```typescript
interface Address {
  id: string;
  user: string;
  street_address: string | null;
  city: string | null;
  nearest_landmark: string | null;
  address_nickname: string | null;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
}
```

## API Endpoints

### Authentication

#### Login
```typescript
POST /auth/login
Body: {
  email: string;
  password: string;
}
Response: {
  access: string;
  user: User;
}
```

#### Signup
```typescript
POST /auth/signup
Body: {
  full_name: string;
  email: string;
  password: string;
}
Response: {
  user: User;
  token: string;
}
```

### Restaurants

#### List Restaurants
```typescript
GET /restaurants/
Response: PaginatedResponse<Restaurant>
```

#### Get Restaurant Details
```typescript
GET /restaurants/:id/
Response: Restaurant
```

#### Get Restaurant Menu
```typescript
GET /restaurants/:id/menu-items/
Response: PaginatedResponse<MenuItem>
```

### Orders

#### Create Order
```typescript
POST /orders/
Body: {
  restaurant_id: string;
  delivery_address_id?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
  }>;
  payment_reference: string;
  delivery_fee: string;
  order_type: 'delivery' | 'pickup';
}
Response: OrderDetail
```

#### Get Customer Orders
```typescript
GET /orders/customer/
Response: PaginatedResponse<CustomerOrder>
```

#### Get Order Details
```typescript
GET /orders/:id/
Response: OrderDetail
```

#### Confirm Delivery
```typescript
POST /orders/:id/confirm-delivery/
Response: {
  message: string;
  order: OrderDetail;
}
```

### Vendor (Restaurant) Orders

#### Get Vendor Orders
```typescript
GET /orders/vendor/
Query params:
  - status?: OrderStatus
  - page?: number
Response: PaginatedResponse<VendorOrder>
```

#### Update Order Status
```typescript
PATCH /orders/:id/status/
Body: {
  status: OrderStatus;
}
Response: VendorOrder
```

#### Assign Rider
```typescript
POST /orders/:id/assign-rider/
Body: {
  rider_phone: string;
}
Response: {
  message: string;
  order: VendorOrder;
}
```

### Rider Orders

#### Get Available Orders
```typescript
GET /orders/rider/available/
Response: AvailableRiderOrder[]
```

#### Get Assigned Orders
```typescript
GET /orders/rider/assigned/
Response: RiderOrder[]
```

#### Accept Order
```typescript
POST /orders/:id/accept/
Response: {
  message: string;
  order: RiderOrder;
}
```

#### Update Rider Status
```typescript
PATCH /orders/:id/rider-status/
Body: {
  status: OrderStatus;
}
Response: RiderOrder
```

### Admin

#### Get All Orders
```typescript
GET /admin/orders/
Query params:
  - status?: OrderStatus
  - page?: number
Response: PaginatedResponse<AdminOrder>
```

### Addresses

#### List User Addresses
```typescript
GET /addresses/
Response: Address[]
```

#### Create Address
```typescript
POST /addresses/
Body: {
  street_address?: string;
  city?: string;
  nearest_landmark?: string;
  address_nickname?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}
Response: Address
```

#### Update Address
```typescript
PATCH /addresses/:id/
Body: Partial<AddressFormData>
Response: Address
```

#### Delete Address
```typescript
DELETE /addresses/:id/
Response: 204 No Content
```

### Profile

#### Get Profile
```typescript
GET /profile/
Response: User | VendorProfile
```

#### Update Profile
```typescript
PATCH /profile/
Body: {
  full_name?: string;
  phone_number?: string;
}
Response: User
```

### Vendor Profile

#### Update Vendor Profile
```typescript
PATCH /vendor/profile/
Body: {
  name?: string;
  description?: string;
  is_active?: boolean;
  address?: {
    street_name: string | null;
    latitude: number;
    longitude: number;
  };
}
Response: VendorProfile
```

#### Get Vendor Analytics
```typescript
GET /vendor/analytics/
Response: VendorAnalyticsData
```

### Menu Items

#### Create Menu Item
```typescript
POST /menu-items/
Body: {
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  image_url?: string;
}
Response: MenuItem
```

#### Update Menu Item
```typescript
PATCH /menu-items/:id/
Body: Partial<MenuItemPayload>
Response: MenuItem
```

#### Delete Menu Item
```typescript
DELETE /menu-items/:id/
Response: 204 No Content
```

## Error Handling

All API errors follow this format:

```typescript
{
  error: string;
  message: string;
  details?: any;
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Pagination

Paginated endpoints return:

```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

Query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 30, max: 100)

## Rate Limiting

API rate limiting may apply. Check response headers:
- `X-RateLimit-Limit` - Maximum requests per time window
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

## Webhooks

(To be implemented)

## WebSocket Events

For real-time order updates:

```typescript
// Connect to WebSocket
const ws = new WebSocket('wss://api.example.com/ws/orders/');

// Events
ws.on('order.created', (data: Order) => {});
ws.on('order.updated', (data: Order) => {});
ws.on('order.status_changed', (data: { order_id: string; status: OrderStatus }) => {});
```

## Testing

Use tools like Postman or curl to test the API:

```bash
# Example: Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Example: Get restaurants with auth
curl -X GET http://localhost:8000/api/restaurants/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For API questions or issues, please open an issue on GitHub.
