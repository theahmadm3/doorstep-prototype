
"use client";

import { useRef } from "react";
import PartnerSignupForm from "@/components/auth/partner-signup-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Utensils, ArrowLeft, ArrowDown } from "lucide-react";
import Footer from "@/components/layout/footer";
import Image from "next/image";

export default function VendorSignupPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <main className="flex-1">
        {/* Intro Section */}
        <section className="w-full py-12 md:py-20 lg:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Grow your restaurant with Doorstep
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto lg:mx-0">
                  Join hundreds of restaurants increasing their revenue with online orders and seamless delivery management.
                </p>
                <div className="flex justify-center lg:justify-start">
                    <Button size="lg" onClick={handleScrollToForm}>
                        Get Started
                        <ArrowDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Restaurant food being delivered"
                data-ai-hint="restaurant food delivery"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full"
              />
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section ref={formRef} className="w-full py-12 md:py-20 lg:py-24">
            <div className="container">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold font-headline">Ready to get started?</h2>
                    <p className="text-muted-foreground">Fill in your details below and our team will reach out with the next steps.</p>
                </div>
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Become a Vendor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PartnerSignupForm role="vendor" />
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
