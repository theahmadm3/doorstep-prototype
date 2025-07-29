
import { PaginatedResponse, Restaurant, MenuItem } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable");
}

async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${url}`);
    if (!res.ok) {
        const errorBody = await res.text();
        console.error(`API Error: ${res.status} ${res.statusText}`, errorBody);
        throw new Error(`API Error: ${res.status} ${res.statusText}. Body: ${errorBody}`);
    }
    return res.json();
}

export async function getRestaurants(): Promise<Restaurant[]> {
    const data = await fetcher<PaginatedResponse<Restaurant>>('/restaurants/');
    return data.results;
}

export async function getRestaurantById(id: string): Promise<Restaurant> {
    return await fetcher<Restaurant>(`/restaurants/${id}/`);
}

export async function getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
    const data = await fetcher<PaginatedResponse<MenuItem>>(`/restaurants/${restaurantId}/menu/`);
    // Mock categories for now as they are not in the API response
    return data.results.map((item, index) => ({
        ...item,
        category: index % 2 === 0 ? 'Pizzas' : 'Sides' 
    }));
}
