
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addressSchema, type AddressFormData } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Checkbox } from "../ui/checkbox";

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  defaultValues?: Partial<AddressFormData>;
  isEditing?: boolean;
}

export default function AddressForm({ onSubmit, defaultValues, isEditing = false }: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street_address: defaultValues?.street_address || "",
      city: defaultValues?.city || "",
      nearest_landmark: defaultValues?.nearest_landmark || "",
      address_nickname: defaultValues?.address_nickname || "",
      is_default: defaultValues?.is_default || false,
      latitude: defaultValues?.latitude,
      longitude: defaultValues?.longitude,
    },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form id="address-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="street_address"
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
            name="city"
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
        {isEditing && (
            <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Set as default address
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
}
