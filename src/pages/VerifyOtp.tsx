
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import VerifyOtpForm from "@/components/auth/verify-otp-form";

export default function VerifyOtpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/"><img src="/doorstep-logo.png" alt="Doorstep" className="h-7 w-auto" /></Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verify your account</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to your phone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerifyOtpForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
