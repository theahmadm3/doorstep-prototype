import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendLoginOTP, verifyLoginOTP, resendOTP } from "@/lib/auth-api";
import { persistAuth, getStoredToken, getStoredUser } from "@/lib/auth";
import { loginSchema } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/stores/useCartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Check, Pencil, ShieldCheck, Smartphone } from "lucide-react";

const ROLE_ROUTES: Record<string, string> = {
	customer: "/customer/dashboard",
	restaurant: "/vendor/dashboard",
	driver: "/rider/dashboard",
	admin: "/admin/dashboard",
};

const RESEND_TIMEOUT = 59;
type Step = "phone" | "otp";

const HERO_PHRASES = [
	"Your favourite\nmeals, delivered\nfast.",
	"Hot meals\nfrom top spots,\nright away.",
	"Cravings met\nin minutes,\nnot hours.",
	"Order now,\nrelax now,\nwe deliver.",
];

export default function LoginPage() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { clearUserOrders } = useCartStore();

	const [step, setStep] = useState<Step>("phone");
	const [formattedPhone, setFormattedPhone] = useState(""); // 234XXXXXXXXX
	const [displayPhone, setDisplayPhone] = useState(""); // 0XXXXXXXXX (user's input)
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const [resendTimer, setResendTimer] = useState(0);
	const [isResending, setIsResending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
	const [heroPhrase, setHeroPhrase] = useState(HERO_PHRASES[0]);
	const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		const id = setInterval(() => {
			setHeroPhrase((current) => {
				const options = HERO_PHRASES.filter((phrase) => phrase !== current);
				return (
					options[Math.floor(Math.random() * options.length)] ?? HERO_PHRASES[0]
				);
			});
		}, 3000);

		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		const token = getStoredToken();
		const user = getStoredUser();
		if (token && user) {
			const dashboard = ROLE_ROUTES[user.role];
			if (dashboard) {
				// When the service worker opens a fresh tab from a notification
				// click and we don't have an explicit URL in the payload, we land
				// here with `?openOrders=1`. Send the user to their orders page
				// instead of the role dashboard.
				const wantsOrders = searchParams.get("openOrders") === "1";
				const dest = wantsOrders
					? dashboard.replace(/\/dashboard$/, "/orders")
					: dashboard;
				navigate(dest, { replace: true });
				return;
			}
		}
		setIsCheckingAuth(false);
	}, [navigate, searchParams]);

	useEffect(() => {
		if (searchParams.get("session_expired")) {
			toast({
				title: "Session Expired",
				description: "Your session has expired. Please log in again.",
				variant: "destructive",
			});
			navigate("/", { replace: true });
		}
	}, [searchParams, toast, navigate]);

	useEffect(() => {
		if (resendTimer <= 0) return;
		const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
		return () => clearInterval(id);
	}, [resendTimer]);

	const phoneForm = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: { phone_number: "" },
		mode: "onChange",
	});

	const handleSendOtp = async (values: z.infer<typeof loginSchema>) => {
		let formatted = values.phone_number;
		if (formatted.startsWith("0")) formatted = "234" + formatted.substring(1);

		try {
			await sendLoginOTP(formatted);
			setFormattedPhone(formatted);
			setDisplayPhone(values.phone_number);
			localStorage.setItem("tempPhoneNumber", formatted);
			setOtp(Array(6).fill(""));
			setStep("otp");
			setResendTimer(RESEND_TIMEOUT);
			setTimeout(() => otpRefs.current[0]?.focus(), 50);
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Failed to send code.";
			toast({ title: "Error", description: msg, variant: "destructive" });
		}
	};

	const handleVerifyOtp = async (code: string) => {
		if (isVerifying || code.length < 6) return;
		setIsVerifying(true);
		try {
			const response = await verifyLoginOTP({
				phone_number: formattedPhone,
				otp_code: code,
			});
			persistAuth(response.tokens, response.user);
			const user = response.user;
			clearUserOrders();
			localStorage.removeItem("tempPhoneNumber");
			toast({ title: `Welcome back, ${user.full_name}!` });
			navigate(ROLE_ROUTES[user.role] ?? "/login");
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Verification failed.";
			toast({
				title: "Invalid code",
				description: msg,
				variant: "destructive",
			});
			setOtp(Array(6).fill(""));
			setTimeout(() => otpRefs.current[0]?.focus(), 50);
		} finally {
			setIsVerifying(false);
		}
	};

	const handleOtpChange = (index: number, value: string) => {
		if (!/^\d*$/.test(value)) return;
		const next = [...otp];
		next[index] = value.slice(-1);
		setOtp(next);
		if (value && index < 5) otpRefs.current[index + 1]?.focus();
		if (next.every((d) => d !== "")) handleVerifyOtp(next.join(""));
	};

	const handleOtpKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Backspace" && !otp[index] && index > 0) {
			otpRefs.current[index - 1]?.focus();
		}
	};

	const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const pasted = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, 6);
		if (pasted.length === 6) {
			const next = pasted.split("");
			setOtp(next);
			otpRefs.current[5]?.focus();
			handleVerifyOtp(pasted);
		}
		e.preventDefault();
	};

	const handleResend = async () => {
		setIsResending(true);
		try {
			await resendOTP(formattedPhone);
			toast({
				title: "Code resent",
				description: `Sent to +${formattedPhone}`,
			});
			setResendTimer(RESEND_TIMEOUT);
			setOtp(Array(6).fill(""));
			setTimeout(() => otpRefs.current[0]?.focus(), 50);
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Failed to resend.";
			toast({ title: "Error", description: msg, variant: "destructive" });
		} finally {
			setIsResending(false);
		}
	};

	const handleChangeNumber = () => {
		setStep("phone");
		setOtp(Array(6).fill(""));
		phoneForm.setValue("phone_number", displayPhone);
	};

	if (isCheckingAuth) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-primary">
				<img
					src="/doorstep-logo-icon.png"
					alt="Doorstep"
					className="h-12 w-auto animate-pulse brightness-0 invert"
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-muted/40 lg:flex">
			{/* ── Brand panel (desktop only) ── */}
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
					<p className="max-w-xs text-lg text-primary-foreground/70">
						Log in to track your orders and discover restaurants near you.
					</p>
					<div className="flex items-center gap-2 pt-5 text-sm text-primary-foreground/70">
						<span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/15"><Check className="size-3.5" /></span>
						Secure, password-free sign in
					</div>
				</div>

				<p className="text-primary-foreground/40 text-sm">
					© {new Date().getFullYear()} Doorstep. All rights reserved.
				</p>
			</div>

			{/* ── Form panel ── */}
			<div className="flex min-h-screen flex-1 flex-col bg-background">
				{/* Mobile brand strip */}
				<div className="lg:hidden bg-primary px-6 pb-7 pt-8 text-primary-foreground">
					<div className="mb-5 flex items-center justify-between">
						<img
							src="/doorstep-logo.png"
							alt="Doorstep"
							className="h-8 w-auto brightness-0 invert"
						/>
						<span className="text-xs font-medium text-primary-foreground/70">Customer sign in</span>
					</div>
					<p className="max-w-xs text-sm leading-6 text-primary-foreground/70">
						Your next meal is only a few taps away.
					</p>
				</div>

				<div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
					<div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
						{step === "phone" ? (
							<div>
								<div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
									<Smartphone className="size-5" />
								</div>
								<h2 className="mb-2 text-2xl font-bold text-foreground">
									Welcome back
								</h2>
								<p className="mb-7 text-sm leading-6 text-muted-foreground">
									Enter the number connected to your Doorstep account. We’ll send a one-time code.
								</p>

								<Form {...phoneForm}>
									<form
										onSubmit={phoneForm.handleSubmit(handleSendOtp)}
										className="space-y-4"
									>
										<FormField
											control={phoneForm.control}
											name="phone_number"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Phone number</FormLabel>
													<div className="flex">
														<div className="flex h-12 items-center gap-1.5 rounded-l-md border border-r-0 bg-muted px-3 text-sm font-medium text-muted-foreground select-none shrink-0">
															+234
														</div>
														<FormControl>
															<Input
																className="h-12 rounded-l-none text-base focus-visible:ring-primary"
																placeholder="08012345678"
																inputMode="tel"
																autoFocus
																{...field}
															/>
														</FormControl>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

												<Button
													type="submit"
													className="h-12 w-full text-base"
											disabled={phoneForm.formState.isSubmitting}
										>
											{phoneForm.formState.isSubmitting
												? "Sending…"
														: "Continue with phone"}
										</Button>
									</form>
								</Form>
							</div>
						) : (
							<div>
								<button
									onClick={handleChangeNumber}
									className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
								>
									<ArrowLeft className="h-3.5 w-3.5" />
									Change number
								</button>

								<div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
									<ShieldCheck className="size-5" />
								</div>
								<h2 className="mb-2 text-2xl font-bold text-foreground">
									Check your phone
								</h2>
								<p className="mb-5 text-sm leading-6 text-muted-foreground">Enter the six-digit code we sent to your number.</p>
								<div className="mb-7 flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
									<div>
										<p className="text-xs font-medium text-muted-foreground">Code sent to</p>
										<p className="mt-0.5 font-semibold text-foreground">+{formattedPhone}</p>
									</div>
									<button onClick={handleChangeNumber} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
										<Pencil className="size-3.5" /> Edit
									</button>
								</div>

								{/* OTP boxes */}
								<div className="mb-6 flex justify-between gap-2 sm:gap-2.5">
									{otp.map((digit, i) => (
										<input
											key={i}
											ref={(el) => {
												otpRefs.current[i] = el;
											}}
											type="text"
											inputMode="numeric"
											maxLength={1}
											value={digit}
											onChange={(e) => handleOtpChange(i, e.target.value)}
											onKeyDown={(e) => handleOtpKeyDown(i, e)}
											onPaste={handleOtpPaste}
											disabled={isVerifying}
											className={[
												"h-13 w-11 rounded-lg border-2 bg-background text-center text-xl font-bold text-foreground sm:w-12",
												"transition-colors focus:outline-none",
												"disabled:opacity-50",
												digit
													? "border-primary"
													: "border-border focus:border-primary",
											].join(" ")}
											style={{ height: "3.25rem" }}
										/>
									))}
								</div>

								<Button
									className="mb-4 h-12 w-full text-base"
									onClick={() => handleVerifyOtp(otp.join(""))}
									disabled={isVerifying || otp.some((d) => !d)}
								>
									{isVerifying ? "Verifying…" : "Verify code"}
								</Button>

								<p className="text-center text-sm text-muted-foreground">
									Didn't receive it?{" "}
									<button
										onClick={handleResend}
										disabled={resendTimer > 0 || isResending}
										className="font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline transition-opacity"
									>
										{isResending
											? "Sending…"
											: resendTimer > 0
												? `Resend in ${resendTimer}s`
												: "Resend code"}
									</button>
								</p>
							</div>
						)}

						<div className="mt-8 space-y-2 border-t pt-6 text-center text-sm text-muted-foreground">
							<p>
								Don't have an account?{" "}
								<Link
									to="/signup"
									className="font-medium text-primary hover:underline"
								>
									Sign up
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
