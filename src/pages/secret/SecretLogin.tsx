import PartnerLoginForm from "@/components/auth/partner-login-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";

export default function PartnerLoginPage() {
	return (
		<div className="min-h-screen bg-muted/40 lg:flex">
			<aside className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-primary p-14 text-primary-foreground">
				<img
					src="/doorstep-logo.png"
					alt="Doorstep"
					className="w-1/2 brightness-0 invert"
				/>
				<div>
					<div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary-foreground/15">
						<Building2 className="size-6" />
					</div>
					<h1 className="text-5xl font-bold leading-tight tracking-tight">
						Your business,
						<br />
						at your fingertips.
					</h1>
					<p className="mt-5 max-w-sm text-lg leading-7 text-primary-foreground/70">
						Manage orders, menus, and your Doorstep operations from one place.
					</p>
				</div>
				<p className="text-sm text-primary-foreground/40">
					© {new Date().getFullYear()} Doorstep. All rights reserved.
				</p>
			</aside>
			<div className="flex min-h-screen flex-1 flex-col bg-background">
				<header className="flex h-20 items-center justify-between px-5 sm:px-8">
					<Link to="/" className="lg:hidden">
						<img
							src="/doorstep-logo.png"
							alt="Doorstep"
							className="h-8 w-auto brightness-0 invert"
						/>
					</Link>
					<span className="hidden text-sm font-medium text-muted-foreground lg:block">
						Partner portal
					</span>
					<Button asChild variant="ghost" size="sm" className="ml-auto">
						<Link to="/">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Customer login
						</Link>
					</Button>
				</header>
				<main className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
					<div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
						<div className="mb-7">
							<div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
								<ShieldCheck className="size-5" />
							</div>
							<p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
								Partner portal
							</p>
							<h2 className="text-2xl font-bold text-foreground">
								Welcome back
							</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								Sign in to access your restaurant, rider, or admin workspace.
							</p>
						</div>
						<PartnerLoginForm />
					</div>
				</main>
			</div>
		</div>
	);
}
