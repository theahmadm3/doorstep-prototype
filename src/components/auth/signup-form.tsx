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

const baseSchema = {
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
};

const customerSchema = z.object({
    ...baseSchema,
    phone: z.string().min(10, "Please enter a valid phone number."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const vendorSchema = z.object({
    ...baseSchema,
    restaurantName: z.string().min(2, "Restaurant name is required."),
    restaurantAddress: z.string().min(10, "Please enter a full address."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const riderSchema = z.object({
    ...baseSchema,
    phone: z.string().min(10, "Please enter a valid phone number."),
    vehicleType: z.string().min(2, "Vehicle type is required (e.g., Bike, Car)."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormType = "customer" | "vendor" | "rider";

export default function SignupForm() {
  const { toast } = useToast();

  const customerForm = useForm<z.infer<typeof customerSchema>>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" } });
  const vendorForm = useForm<z.infer<typeof vendorSchema>>({ resolver: zodResolver(vendorSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "", restaurantName: "", restaurantAddress: "" } });
  const riderForm = useForm<z.infer<typeof riderSchema>>({ resolver: zodResolver(riderSchema), defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "", vehicleType: "" } });

  const onSubmit = (type: FormType) => (values: any) => {
    console.log(`Submitting for ${type}:`, values);
    toast({
      title: "Account Created!",
      description: "Welcome to Doorstep. Please log in to continue.",
    });
    // Reset all forms
    customerForm.reset();
    vendorForm.reset();
    riderForm.reset();
  };

  const renderSharedFields = (form: any) => (
    <>
      <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
      <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
      <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
      <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem> )} />
    </>
  );

  return (
    <Tabs defaultValue="customer" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="customer">Customer</TabsTrigger>
        <TabsTrigger value="vendor">Vendor</TabsTrigger>
        <TabsTrigger value="rider">Rider</TabsTrigger>
      </TabsList>
      
      <TabsContent value="customer">
        <Form {...customerForm}>
          <form onSubmit={customerForm.handleSubmit(onSubmit("customer"))} className="space-y-4 pt-4">
            {renderSharedFields(customerForm)}
            <FormField control={customerForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Sign Up as Customer</Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="vendor">
        <Form {...vendorForm}>
          <form onSubmit={vendorForm.handleSubmit(onSubmit("vendor"))} className="space-y-4 pt-4">
            {renderSharedFields(vendorForm)}
            <FormField control={vendorForm.control} name="restaurantName" render={({ field }) => ( <FormItem><FormLabel>Restaurant Name</FormLabel><FormControl><Input placeholder="The Good Place" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={vendorForm.control} name="restaurantAddress" render={({ field }) => ( <FormItem><FormLabel>Restaurant Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Sign Up as Vendor</Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="rider">
        <Form {...riderForm}>
          <form onSubmit={riderForm.handleSubmit(onSubmit("rider"))} className="space-y-4 pt-4">
            {renderSharedFields(riderForm)}
            <FormField control={riderForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={riderForm.control} name="vehicleType" render={({ field }) => ( <FormItem><FormLabel>Vehicle Type</FormLabel><FormControl><Input placeholder="Motorcycle, Bicycle, Car" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <Button type="submit" className="w-full">Sign Up as Rider</Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
