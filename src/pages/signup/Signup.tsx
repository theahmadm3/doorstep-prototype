import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SignupForm from "@/components/auth/signup-form";

const HERO_PHRASES = [
	"Great food,\njust a few taps\naway.",
	"Discover new\nfavorites, fast\ndelivery.",
	"Your cravings\ndeserved better.\nNow they get it.",
	"Join thousands\nordering daily\nwith Doorstep.",
];

export default function SignupPage() {
	const [heroPhrase, setHeroPhrase] = useState(HERO_PHRASES[0]);

	useEffect(() => {
		const id = setInterval(() => {
			setHeroPhrase((current) => {
				const options = HERO_PHRASES.filter((p) => p !== current);
				return options[Math.floor(Math.random() * options.length)] ?? HERO_PHRASES[0];
			});
		}, 3000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="min-h-screen bg-muted/40 lg:flex">
			{/* Brand panel — desktop only */}
			<div className="hidden lg:flex lg:w-[44%] bg-primary flex-col justify-between p-14 text-primary-foreground">
				<div>
					<img
						src="/doorstep-logo.png"
						alt="Doorstep"
						className="w-1/2 brightness-0 invert"
					/>
				</div>

				<div className="space-y-4">
					<AnimatePresence mode="wait" initial={false}>
						<motion.h1
							key={heroPhrase}
							className="text-5xl font-bold leading-[1.15] tracking-tight"
							initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
							animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
							exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
							transition={{ duration: 0.45, ease: "easeOut" }}
						>
							{heroPhrase.split("\n").map((line, i) => (
								<span key={line + i}>
									{line}
									{i < 2 && <br />}
								</span>
							))}
						</motion.h1>
					</AnimatePresence>
					<p className="text-primary-foreground/70 text-lg max-w-xs">
						Create your account and start ordering in minutes.
					</p>
				</div>

				<p className="text-primary-foreground/40 text-sm">
					© {new Date().getFullYear()} Doorstep. All rights reserved.
				</p>
			</div>

			{/* Form panel */}
			<div className="flex min-h-screen flex-1 flex-col bg-background">
				{/* Mobile brand strip */}
				<div className="lg:hidden bg-primary px-6 pb-7 pt-8 text-primary-foreground">
					<div className="mb-5 flex items-center justify-between">
						<img
							src="/doorstep-logo.png"
							alt="Doorstep"
							className="h-8 w-auto brightness-0 invert"
						/>
						<span className="text-xs font-medium text-primary-foreground/70">Customer account</span>
					</div>
					<p className="max-w-xs text-sm leading-6 text-primary-foreground/70">
						Everything you love from nearby restaurants, in one place.
					</p>
				</div>

				<div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
					<div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
						<p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">New to Doorstep</p>
						<h2 className="mb-2 text-2xl font-bold text-foreground">
							Get started
						</h2>
						<p className="mb-7 text-sm leading-6 text-muted-foreground">
							A few details and you’ll be ready to explore.
						</p>

						<SignupForm />

						<div className="mt-8 space-y-2 border-t pt-6 text-center text-sm text-muted-foreground">
							<p>
								Already have an account?{" "}
								<Link to="/" className="font-medium text-primary hover:underline">
									Log in
								</Link>
							</p>
							<p>
								Are you a partner?{" "}
								<Link
									to="/partner-login"
									className="font-medium text-primary hover:underline"
								>
									Partner login
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
