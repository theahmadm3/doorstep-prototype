import LoginForm from "@/components/auth/login-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Utensils className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline">Doorstep</span>
                </Link>
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
              <CardDescription>
                Sign in to continue to Doorstep.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline text-primary">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
