import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Bike, CircleCheckBig } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Craving Something Delicious?
                </h1>
                <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
                  Doorstep brings your city's best food right to your door. Fresh, fast, and hassle-free.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
                    <Link href="/menu">Order Now</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                     <Link href="/vendor/signup">Become a Partner</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero Food"
                data-ai-hint="food delivery"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Why Choose Doorstep?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We've built a platform that's easy to use, reliable, and puts the best local food at your fingertips.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1 text-center">
                <Utensils className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Wide Selection</h3>
                <p className="text-muted-foreground">From street food to fine dining, find exactly what you're looking for.</p>
              </div>
              <div className="grid gap-1 text-center">
                <Bike className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Fast Delivery</h3>
                <p className="text-muted-foreground">Our riders are quick and careful, ensuring your food arrives hot and fresh.</p>
              </div>
              <div className="grid gap-1 text-center">
                <CircleCheckBig className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-xl font-bold">Real-Time Tracking</h3>
                <p className="text-muted-foreground">Watch your order's journey from the kitchen to your doorstep.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Get Your Meal in 3 Simple Steps</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Ordering with Doorstep is as easy as pie.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                    Browse & Select
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Explore restaurants and menus, and add your desired items to the cart.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                     <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                    Checkout
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Provide your delivery address and complete the secure payment process.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                     <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                    Track & Enjoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Follow your order in real-time and get ready to enjoy your delicious meal.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
