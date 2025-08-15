
import { getRestaurants } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Utensils } from "lucide-react";
import CustomerDashboardClient from "./page.client";

export default async function CustomerDashboardPage() {
    const restaurants = await getRestaurants();

  return (
    <CustomerDashboardClient restaurants={restaurants} />
  );
}
