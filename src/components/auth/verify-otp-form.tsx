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
import { useCartStore } from "@/stores/useCartStore";

const RESEND_TIMEOUT = 59; // seconds

export default function VerifyOtpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { clearUserOrders } = useCartStore();

  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [isResending, setIsResending] = useState(false);

  // Get phone number from localStorage on mount
  useEffect(() => {
    const storedPhone = localStorage.getItem('tempPhoneNumber');
    
    if (!storedPhone) {
      toast({
        title: "Phone number not found",
        description: "Please start the login process again.",
        variant: "destructive",
      });
      router.replace("/login");
      return;
    }
    
    setPhoneNumber(storedPhone);
  }, [router, toast]);

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const form = useForm<OtpVerificationPayload>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: { otp_code: "" },
    mode: "onChange",
  });

  const { formState: { isSubmitting } } = form;

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      await resendOTP(phoneNumber);
      toast({ 
        title: "OTP Resent", 
        description: `A new code has been sent to +${phoneNumber}` 
      });
      setResendTimer(RESEND_TIMEOUT);
    } catch(error) {
      const message = error instanceof Error ? error.message : "Failed to resend OTP.";
      toast({ 
        title: "Resend Failed", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setIsResending(false);
    }
  }

  async function onSubmit(values: OtpVerificationPayload) {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Verify OTP
      const response = await verifyLoginOTP({
        phone_number: phoneNumber,
        otp_code: values.otp_code,
      });

      // Step 2: Store tokens
      if (response.tokens?.access) {
        localStorage.setItem('token', response.tokens.access);
        localStorage.setItem('accessToken', response.tokens.access);
      }
      // if (response.tokens?.refresh) {
      //   localStorage.setItem('refreshToken', response.tokens.refresh);
      // }

      // Step 3: Fetch user data
      const user = await getAuthUser();
      localStorage.setItem('user', JSON.stringify(user));

      // Step 4: Clear guest cart
      clearUserOrders();

      // Step 5: Clear temporary phone number
      localStorage.removeItem('tempPhoneNumber');

      // Step 6: Success toast
      toast({
        title: "Verification Successful!",
        description: `Welcome back, ${user.full_name}!`,
      });

      // Step 7: Redirect based on role
      setTimeout(() => {
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
            router.push("/login");
        }
      }, 100);

    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : "Verification failed. Please try again.";
      
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
      
      form.reset();
    }
  }

  // Don't render form until phone number is loaded
  if (!phoneNumber) {
    return null;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="text-center text-sm text-muted-foreground mb-4">
          Enter the code sent to <strong>{phoneNumber}</strong>
        </div>

        <FormField
          control={form.control}
          name="otp_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="123456" 
                  {...field}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                />
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
            {isResending 
              ? "Sending..." 
              : resendTimer > 0 
                ? `Resend in ${resendTimer}s` 
                : "Resend code"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
