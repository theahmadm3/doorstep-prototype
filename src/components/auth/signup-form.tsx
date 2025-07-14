
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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Please enter a valid phone number."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


export default function SignupForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({ 
      resolver: zodResolver(formSchema), 
      defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" } 
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(`Submitting for customer:`, values);
    toast({
      title: "Account Created!",
      description: "Welcome to Doorstep. Please log in to continue.",
    });
    form.reset();
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
        <Button type="submit" className="w-full">Sign Up</Button>
        </form>
    </Form>
  );
}
