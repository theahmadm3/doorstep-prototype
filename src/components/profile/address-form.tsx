
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addressSchema, type AddressFormData } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  defaultValues?: AddressFormData;
}

export default function AddressForm({ onSubmit, defaultValues }: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || {
      street: "",
      district_town: "",
      nearest_landmark: "",
      address_nickname: "",
    },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form id="address-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>House number and street name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 123 Allen Avenue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="district_town"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                    District/Town
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Your area name</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Ikeja" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <FormField
          control={form.control}
          name="nearest_landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nearest Landmark (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Opposite the big mosque" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address_nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Nickname (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Home, Work" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
