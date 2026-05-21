
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Utensils } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import WhatsappOnboarding from "@/components/auth/whatsapp-onboarding";
import { useNavigate } from "react-router-dom";

function LoginFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

const ROLE_ROUTES: Record<string, string> = {
  customer: "/customer/dashboard",
  restaurant: "/vendor/dashboard",
  driver: "/rider/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const destination = ROLE_ROUTES[user.role];
        if (destination) {
          navigate(destination, { replace: true });
          return;
        }
      } catch {
        // Corrupted data — fall through to show login
      }
    }

    setIsCheckingAuth(false);
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Utensils className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link to="/" className="flex items-center space-x-2">
                    <Utensils className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline">Doorstep</span>
                </Link>
            </div>
        </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
              <CardDescription>
                {hasOnboarded 
                  ? "Enter your phone number to receive a login code." 
                  : "First, join our WhatsApp channel to receive login codes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasOnboarded ? (
                <Suspense fallback={<LoginFormSkeleton />}>
                  <LoginForm />
                </Suspense>
              ) : (
                <WhatsappOnboarding onConfirm={() => setHasOnboarded(true)} />
              )}
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline text-primary">
                  Sign up
                </Link>
              </div>
              <div className="mt-2 text-center text-sm">
                Are you a partner?{" "}
                <Link to="/secret/non-accessible/to/customers/login" className="underline text-primary">
                  Login here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
