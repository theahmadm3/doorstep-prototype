
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { signupCustomer } from "@/lib/auth-api";
import { customerSignupSchema, type CustomerSignupPayload } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"


export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { setPhoneNumber } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<CustomerSignupPayload>({
    resolver: zodResolver(customerSignupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "",
      referral_code: "",
    },
    mode: "onChange"
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(values: CustomerSignupPayload) {
    setErrorMessage("");
    
    // Format phone number
    let formattedPhoneNumber = values.phone_number;
    if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '234' + formattedPhoneNumber.substring(1);
    }
    
    const payload = {
        ...values,
        phone_number: formattedPhoneNumber,
        birthday: values.birthday ? format(values.birthday, "yyyy-MM-dd") : undefined,
    };

    try {
      await signupCustomer(payload);
      toast({
        title: "OTP Sent!",
        description: "We've sent a verification code to you via WhatsApp.",
      });
      setPhoneNumber(formattedPhoneNumber);
      router.push("/verify-otp");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(message);
      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Birthday (Optional)</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="referral_code"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="E.g. JDOE123" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
       
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
        </Button>
        {errorMessage && (
            <p className="text-center text-sm text-red-500">{errorMessage}</p>
        )}
      </form>
    </Form>
  );
}
