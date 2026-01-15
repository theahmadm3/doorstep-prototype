
"use client";

import SignupForm from "@/components/auth/signup-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, ArrowLeft } from "lucide-react";
import { useState } from "react";
import WhatsappOnboarding from "@/components/auth/whatsapp-onboarding";

export default function SignupPage() {
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
                <Card className="w-full max-w-lg mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-headline">Create a Customer Account</CardTitle>
                        <CardDescription>
                            {hasOnboarded 
                                ? "Sign up to start ordering your favorite meals." 
                                : "First, join our WhatsApp channel to get started."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasOnboarded ? (
                            <SignupForm />
                        ) : (
                            <WhatsappOnboarding onConfirm={() => setHasOnboarded(true)} />
                        )}
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/" className="underline text-primary">
                            Log in
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
