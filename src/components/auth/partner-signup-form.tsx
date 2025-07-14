
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
    email: z.string().email("Please enter a valid email."),
});

interface PartnerSignupFormProps {
    role: "vendor" | "rider";
}

export default function PartnerSignupForm({ role }: PartnerSignupFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({ 
    resolver: zodResolver(formSchema), 
    defaultValues: { email: "" } 
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
     console.log(`Submitting for ${role}:`, values);
    toast({
      title: "Thank you for your interest!",
      description: "We've received your submission and will be in touch shortly.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField 
            control={form.control} 
            name="email" 
            render={({ field }) => ( 
                <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input 
                        placeholder={role === 'vendor' ? "business@example.com" : "you@example.com"} 
                        {...field} 
                    /></FormControl>
                    <FormMessage />
                </FormItem> 
            )} 
        />
        <Button type="submit" className="w-full">Submit Interest</Button>
        </form>
    </Form>
  );
}
