import Link from "next/link";
import { Utensils, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold font-headline text-foreground">Doorstep</span>
            </Link>
            <p className="text-sm">Your city's best flavors, delivered to you.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/menu" className="hover:text-primary">Menu</Link></li>
              <li><Link href="/signup" className="hover:text-primary">Sign Up</Link></li>
              <li><Link href="/login" className="hover:text-primary">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Partnerships</h4>
            <ul className="space-y-2">
              <li><Link href="/vendor/signup" className="hover:text-primary">Become a Vendor</Link></li>
              <li><Link href="/rider/signup" className="hover:text-primary">Join as a Rider</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-primary"><Facebook /></Link>
              <Link href="#" className="hover:text-primary"><Twitter /></Link>
              <Link href="#" className="hover:text-primary"><Instagram /></Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Doorstep Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
