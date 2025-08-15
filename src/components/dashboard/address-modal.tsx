
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addressSchema, type AddressFormData } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData) => void;
}

export default function AddressModal({ isOpen, onClose, onSave }: AddressModalProps) {
  const { toast } = useToast();
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      district_town: "",
      nearest_landmark: "",
      address_nickname: "",
    },
    mode: "onChange",
  });

  const { formState: { isValid, isSubmitting } } = form;

  const handleFormSubmit = async (data: AddressFormData) => {
    // Here you would make an API call to save the address
    console.log("Address submitted:", data);
    onSave(data);
    toast({
      title: "Address Saved!",
      description: "Your delivery address has been successfully saved.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to Doorstep!</DialogTitle>
          <DialogDescription>
            Let's get your delivery address set up so you can start ordering.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
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
            <DialogFooter className="grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Skip for now
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Address"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
