import PartnerSignupForm from "@/components/auth/partner-signup-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, ArrowLeft } from "lucide-react";
import Footer from "@/components/layout/footer";

export default function RiderSignupPage() {
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
                    <CardTitle className="text-2xl font-headline">Join as a Rider</CardTitle>
                    <CardDescription>
                        Want to join our delivery team? Enter your email, and we'll contact you to get you on board.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PartnerSignupForm role="rider" />
                    </CardContent>
                </Card>
            </div>
        </main>
        <Footer />
    </div>
  );
}
