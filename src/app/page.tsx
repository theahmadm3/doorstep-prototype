
"use client";

import LoginForm from "@/components/auth/login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { Suspense, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import WhatsappOnboarding from "@/components/auth/whatsapp-onboarding";

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

export default function LoginPage() {
  const [hasOnboarded, setHasOnboarded] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
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
                <Link href="/signup" className="underline text-primary">
                  Sign up
                </Link>
              </div>
              <div className="mt-2 text-center text-sm">
                Are you a partner?{" "}
                <Link href="/secret/non-accessible/to/customers/login" className="underline text-primary">
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
