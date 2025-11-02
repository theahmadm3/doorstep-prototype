
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/auth-api";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/signup/vendor',
    '/signup/rider',
    '/menu',
    '/secret/non-accessible/to/customers/login',
    '/verify-otp'
];

const getDashboardRoute = (role: User['role']) => {
    switch (role) {
        case 'customer': return '/customer/dashboard';
        case 'restaurant': return '/vendor/dashboard';
        case 'driver': return '/rider/dashboard';
        case 'admin': return '/admin/dashboard';
        default: return '/login';
    }
}

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
);


export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            
            // Allow restaurant menu public view
            if (pathname.startsWith('/restaurants/')) {
                setIsLoading(false);
                return;
            }

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const user = await getAuthUser();
                localStorage.setItem('user', JSON.stringify(user));

                const dashboardRoute = getDashboardRoute(user.role);

                // If user is on a public page, redirect them to their dashboard
                if (publicRoutes.includes(pathname) || pathname.startsWith('/restaurants/')) {
                    router.replace(dashboardRoute);
                } else {
                    // User is already on a protected page, just stop loading
                    setIsLoading(false);
                }

            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                
                // If the user is on a protected route, redirect to login
                const isProtectedRoute = !publicRoutes.some(route => pathname === route || (route.includes('[') && new RegExp(route.replace(/\[.*?\]/g, '.*')).test(pathname)));
                if (isProtectedRoute) {
                    router.replace('/login');
                } else {
                    setIsLoading(false);
                }
            }
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]); // Rerun on path change

    if (isLoading) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
