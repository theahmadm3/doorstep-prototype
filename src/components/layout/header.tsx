"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Utensils, LogIn } from "lucide-react";

import logo from "../../../public/doorstep-logo.png";
import Image from "next/image";

export default function Header() {
	const [isMenuOpen, setMenuOpen] = useState(false);
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
							<Image src={logo} alt="Doorstep Logo" className="w-14" />
							{/* <span className="font-bold font-headline">Doorstep</span> */}
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
						<Image src={logo} alt="Doorstep Logo" className="w-14" />
						{/* <span className="font-bold font-headline">Doorstep</span> */}
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
						<SheetHeader className="text-left">
							<SheetTitle>
								<Link
									href="/"
									className="flex items-center space-x-2 mb-6"
									onClick={() => setMenuOpen(false)}
								>
									<Image src={logo} alt="Doorstep Logo" className="w-14" />
									{/* <span className="font-bold font-headline">Doorstep</span> */}
								</Link>
							</SheetTitle>
						</SheetHeader>
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
						<div className="absolute bottom-4 left-4 right-4 flex flex-col space-y-2">
							<Button asChild>
								<Link href="/signup">Sign Up</Link>
							</Button>
							<Button variant="ghost" asChild>
								<Link href="/login">Login</Link>
							</Button>
						</div>
					</SheetContent>
				</Sheet>
				<Link href="/" className="flex items-center space-x-2 md:hidden">
					<Image src={logo} alt="Doorstep Logo" className="w-14" />
					{/* <span className="font-bold font-headline">Doorstep</span> */}
				</Link>

				<div className="flex flex-1 items-center justify-end space-x-2">
					<Button asChild variant="ghost" size="icon" className="sm:hidden">
						<Link href="/login">
							<LogIn className="h-5 w-5" />
							<span className="sr-only">Login</span>
						</Link>
					</Button>
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
