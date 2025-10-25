
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyLoginOTP, resendOTP, getAuthUser } from "@/lib/auth-api";
import { otpVerificationSchema, type OtpVerificationPayload } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";

const RESEND_TIMEOUT = 30; // seconds

export default function VerifyOtpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { phoneNumber, setPhoneNumber } = useAuthStore();
  const { clearUserOrders } = useCartStore();

  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!phoneNumber) {
      toast({
        title: "Phone number not found",
        description: "Please start the signup or login process again.",
        variant: "destructive",
      });
      router.replace("/login");
    }
  }, [phoneNumber, router, toast]);
  
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (resendTimer > 0) {
          interval = setInterval(() => {
              setResendTimer(prev => prev - 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [resendTimer]);

  const form = useForm<OtpVerificationPayload>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: { otp_code: "" },
    mode: "onChange",
  });

  const { formState: { isSubmitting } } = form;

  const handleResendOtp = async () => {
    if (!phoneNumber) return;
    setIsResending(true);
    try {
        await resendOTP(phoneNumber);
        toast({ title: "OTP Resent", description: "A new code has been sent to you." });
        setResendTimer(RESEND_TIMEOUT);
    } catch(error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({ title: "Resend Failed", description: message, variant: "destructive" });
    } finally {
        setIsResending(false);
    }
  }

  async function onSubmit(values: OtpVerificationPayload) {
    if (!phoneNumber) return;

    try {
      const response = await verifyLoginOTP({
        phone_number: phoneNumber,
        otp_code: values.otp_code,
      });
      
      localStorage.setItem('accessToken', response.tokens.access);

      const user = await getAuthUser();
      localStorage.setItem('user', JSON.stringify(user));
      
      // Clear any guest cart items if the user is a customer
      if (user.role === 'customer') {
          clearUserOrders();
      }

      toast({
        title: "Verification Successful!",
        description: `Welcome back, ${user.full_name}!`,
      });

      // Clear the phone number from the auth store
      setPhoneNumber(null);

      // Redirect based on user role
      switch (user.role) {
        case "customer":
          router.push("/customer/dashboard");
          break;
        case "restaurant":
          router.push("/vendor/dashboard");
          break;
        case "driver":
          router.push("/rider/dashboard");
          break;
        case "admin":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/login"); // Fallback to login
      }
      
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="otp_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify Account"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
            Didn't receive a code?
            <Button
                type="button"
                variant="link"
                className="pl-1"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isResending}
            >
                {isResending ? "Sending..." : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
