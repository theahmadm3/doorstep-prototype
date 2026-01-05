
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginOTP } from "@/lib/auth-api";
import { loginSchema } from "@/lib/types";
import { useEffect, useState } from "react";

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (searchParams.get('session_expired')) {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      // Clean the URL
      router.replace('/');
    }
  }, [searchParams, toast, router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: "",
    },
    mode: "onChange",
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setErrorMessage("");

    let formattedPhoneNumber = values.phone_number;
    if (formattedPhoneNumber.startsWith('0')) {
      formattedPhoneNumber = '234' + formattedPhoneNumber.substring(1);
    }

    try {
      await sendLoginOTP(formattedPhoneNumber);
      
      // Store phone number temporarily in localStorage
      localStorage.setItem('tempPhoneNumber', formattedPhoneNumber);
      
      toast({
        title: "OTP Sent",
        description: "We've sent a login code to you via WhatsApp.",
      });

      router.push("/verify-otp");

    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="08012345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sending OTP..." : "Send Login Code"}
        </Button>
        {errorMessage && (
          <p className="text-center text-sm text-red-500">{errorMessage}</p>
        )}
      </form>
    </Form>
  );
}
