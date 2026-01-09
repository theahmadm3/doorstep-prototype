
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth-api";
import { partnerLoginSchema } from "@/lib/types";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";

export default function PartnerLoginForm() {
	const { toast } = useToast();
	const router = useRouter();
	const queryClient = useQueryClient();
	const setTokens = useAuthStore((state) => state.setTokens);
	const { clearUserOrders } = useCartStore();

	const form = useForm<z.infer<typeof partnerLoginSchema>>({
		resolver: zodResolver(partnerLoginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const {
		formState: { isSubmitting },
	} = form;

	async function onSubmit(values: z.infer<typeof partnerLoginSchema>) {
		try {
			// Step 1: Login user and get tokens + user data
			const loginResponse = await loginUser(values);

			// Step 2: Store access and refresh tokens in memory (Zustand)
			// SECURITY: The refresh token is discarded here to adhere to the policy
			// of not storing it in browser-accessible locations.
			setTokens(loginResponse.access, loginResponse.refresh);

			// Step 3: Manually set the user data in the TanStack Query cache
			const user = loginResponse.user;
			queryClient.setQueryData(["authUser"], user);

			// Step 4: Clear any guest cart data
			clearUserOrders();

			// Step 5: Success toast
			toast({
				title: "Login Successful!",
				description: `Welcome back, ${user.full_name}!`,
			});

			// Step 6: Redirect based on role
			setTimeout(() => {
				switch (user.role) {
					case "restaurant":
						router.push("/vendor/dashboard");
						break;
					case "driver":
						router.push("/rider/dashboard");
						break;
					case "admin":
						router.push("/admin/dashboard");
						break;
					default:
						router.push("/");
				}
			}, 100);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Login failed. Please check your credentials.";
			toast({
				title: "Login Failed",
				description: message,
				variant: "destructive",
			});
			form.reset();
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="you@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? "Logging in..." : "Login"}
				</Button>
			</form>
		</Form>
	);
}
