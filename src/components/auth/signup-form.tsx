
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Please enter a valid phone number."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const partnerSchema = z.object({
    email: z.string().email("Please enter a valid email."),
});


type FormType = "customer" | "vendor" | "rider";

export default function SignupForm() {
  const { toast } = useToast();

  const customerForm = useForm<z.infer<typeof customerSchema>>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" } });
  const vendorForm = useForm<z.infer<typeof partnerSchema>>({ resolver: zodResolver(partnerSchema), defaultValues: { email: "" } });
  const riderForm = useForm<z.infer<typeof partnerSchema>>({ resolver: zodResolver(partnerSchema), defaultValues: { email: "" } });

  const onCustomerSubmit = (values: z.infer<typeof customerSchema>) => {
    console.log(`Submitting for customer:`, values);
    toast({
      title: "Account Created!",
      description: "Welcome to Doorstep. Please log in to continue.",
    });
    customerForm.reset();
  };

  const onPartnerSubmit = (type: "vendor" | "rider") => (values: z.infer<typeof partnerSchema>) => {
     console.log(`Submitting for ${type}:`, values);
    toast({
      title: "Thank you for your interest!",
      description: "We've received your submission and will be in touch shortly.",
    });
    if (type === 'vendor') {
        vendorForm.reset();
    } else {
        riderForm.reset();
    }
  }

  return (
    <Tabs defaultValue="customer" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="customer">Customer</TabsTrigger>
        <TabsTrigger value="vendor">Vendor</TabsTrigger>
        <TabsTrigger value="rider">Rider</TabsTrigger>
      </TabsList>
      
      <TabsContent value="customer">
        <Form {...customerForm}>
          <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4 pt-4">
             <FormField control={customerForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={customerForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={customerForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={customerForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={customerForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Sign Up as Customer</Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="vendor">
        <Form {...vendorForm}>
          <form onSubmit={vendorForm.handleSubmit(onPartnerSubmit("vendor"))} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground text-center">Interested in becoming a vendor? Enter your email below, and our team will reach out to you with the next steps.</p>
            <FormField control={vendorForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Business Email</FormLabel><FormControl><Input placeholder="business@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Submit Interest</Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="rider">
        <Form {...riderForm}>
          <form onSubmit={riderForm.handleSubmit(onPartnerSubmit("rider"))} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground text-center">Want to join our delivery team? Enter your email, and we'll contact you to get you on board.</p>
            <FormField control={riderForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Your Email</FormLabel><FormControl><Input placeholder="rider@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Join the Team</Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
