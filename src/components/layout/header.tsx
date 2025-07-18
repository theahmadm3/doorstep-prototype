

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, ShoppingCart, Utensils, User, LogOut } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();
  const { itemCount, total } = useCartSummary();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinks = [
    { href: "/menu", label: "Menu" },
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
  ];

  if (!isClient) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                 <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Utensils className="h-6 w-6 text-primary" />
                        <span className="font-bold font-headline">Doorstep</span>
                    </Link>
                </div>
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Doorstep</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              href="/"
              className="flex items-center space-x-2 mb-6"
              onClick={() => setMenuOpen(false)}
            >
              <Utensils className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline">Doorstep</span>
            </Link>
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="transition-colors hover:text-foreground text-foreground/80"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center space-x-2 md:hidden">
            <Utensils className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Doorstep</span>
        </Link>


        <div className="flex flex-1 items-center justify-end space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                   <Badge className="absolute top-2 right-2 h-4 w-4 justify-center p-0">{itemCount}</Badge>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
                <h2 className="text-lg font-medium mb-4">Your Cart</h2>
                {cart.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4 mb-4">
                                <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" />
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <SheetClose asChild>
                                <Button className="w-full" asChild>
                                    <Link href="/checkout">Go to Checkout</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    </div>
                )}
            </SheetContent>
          </Sheet>
            <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
        </div>
      </div>
    </header>
  );
}

function useCartSummary() {
    const { cart } = useCart();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    return { itemCount, total };
}
