"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendLoginOTP, verifyLoginOTP, resendOTP, getAuthUser } from "@/lib/auth-api";
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
  FormMessage,
} from "@/components/ui/form";
import { Utensils, ArrowLeft } from "lucide-react";

const ROLE_ROUTES: Record<string, string> = {
  customer: "/customer/dashboard",
  restaurant: "/vendor/dashboard",
  driver: "/rider/dashboard",
  admin: "/admin/dashboard",
};

const RESEND_TIMEOUT = 59;
type Step = "phone" | "otp";

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
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const dest = ROLE_ROUTES[user.role];
        if (dest) { navigate(dest, { replace: true }); return; }
      } catch { /* corrupted — fall through */ }
    }
    setIsCheckingAuth(false);
  }, [navigate]);

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
      const msg = error instanceof Error ? error.message : "Failed to send code.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (isVerifying || code.length < 6) return;
    setIsVerifying(true);
    try {
      const response = await verifyLoginOTP({ phone_number: formattedPhone, otp_code: code });
      if (response.tokens?.access) {
        localStorage.setItem("token", response.tokens.access);
        localStorage.setItem("accessToken", response.tokens.access);
      }
      const user = await getAuthUser();
      localStorage.setItem("user", JSON.stringify(user));
      clearUserOrders();
      localStorage.removeItem("tempPhoneNumber");
      toast({ title: `Welcome back, ${user.full_name}!` });
      navigate(ROLE_ROUTES[user.role] ?? "/login");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Verification failed.";
      toast({ title: "Invalid code", description: msg, variant: "destructive" });
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
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
      toast({ title: "Code resent", description: `Sent to +${formattedPhone}` });
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
        <Utensils className="h-8 w-8 text-primary-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary flex-col justify-between p-14 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Utensils className="h-7 w-7" />
          <span className="text-2xl font-bold tracking-tight">Doorstep</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight">
            Your favourite<br />meals, delivered<br />fast.
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xs">
            Log in to track your orders and discover restaurants near you.
          </p>
        </div>

        <p className="text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Doorstep. All rights reserved.
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile brand strip */}
        <div className="lg:hidden bg-primary px-6 pt-10 pb-8 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-6 w-6" />
            <span className="text-xl font-bold">Doorstep</span>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            Log in to your account
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {step === "phone" ? (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  Enter your phone number to get a login code.
                </p>

                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                    <FormField
                      control={phoneForm.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex">
                            <div className="flex items-center gap-1.5 px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm font-medium select-none shrink-0">
                              🇳🇬 +234
                            </div>
                            <FormControl>
                              <Input
                                className="rounded-l-none focus-visible:ring-primary"
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
                      className="w-full"
                      disabled={phoneForm.formState.isSubmitting}
                    >
                      {phoneForm.formState.isSubmitting ? "Sending…" : "Get login code"}
                    </Button>
                  </form>
                </Form>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleChangeNumber}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change number
                </button>

                <h2 className="text-2xl font-bold text-foreground mb-1">Check your phone</h2>
                <p className="text-muted-foreground text-sm mb-1">
                  We sent a 6-digit code to
                </p>
                <p className="font-semibold text-foreground mb-8">+{formattedPhone}</p>

                {/* OTP boxes */}
                <div className="flex gap-2.5 mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      disabled={isVerifying}
                      className={[
                        "w-11 h-13 text-center text-xl font-bold border-2 rounded-lg",
                        "focus:outline-none transition-colors bg-background text-foreground",
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
                  className="w-full mb-4"
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

            <div className="mt-10 pt-6 border-t space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <p>
                Are you a partner?{" "}
                <Link
                  to="/secret/non-accessible/to/customers/login"
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
