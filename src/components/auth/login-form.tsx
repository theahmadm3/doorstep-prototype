
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
import { loginUser } from "@/lib/auth-api";
import { loginSchema } from "@/lib/types";
import { useState } from "react";


export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  async function onSubmit(values: z.infer<typeof loginSchema>) {
    
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    setIsSubmitting(true);
    try {
      const data = await loginUser(values);

      toast({
        title: "Login Successful",
        description: "Redirecting...",
      });

      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }
      
      switch (data.user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'restaurant':
          router.push('/vendor/dashboard');
          break;
        case 'driver':
          router.push('/rider/dashboard');
          break;
        case 'customer':
          router.push('/customer/dashboard');
          break;
        default:
          router.push('/login');
          toast({
            title: "User Type not found",
          });
          break;
      }

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
       setLoginErrorMessage(errorMessage);
       toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "signing in..." : "Sign In"}
        </Button>
        <p className={"text-center text-sm " + (loginErrorMessage ? "text-red-500" : "text-white")}> Error: {loginErrorMessage} </p>
      </form>
    </Form>
  );
}
