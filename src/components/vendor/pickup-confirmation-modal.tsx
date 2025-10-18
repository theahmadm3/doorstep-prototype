
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { confirmPickupByCustomer } from "@/lib/api";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits.").max(6, "OTP must be 6 digits."),
});

type OtpFormData = z.infer<typeof otpSchema>;

interface PickupConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onSuccess: () => void;
}

export default function PickupConfirmationModal({ isOpen, onClose, orderId, onSuccess }: PickupConfirmationModalProps) {
  const { toast } = useToast();
  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const { formState: { isSubmitting, isValid } } = form;

  const handleSubmit = async (data: OtpFormData) => {
    if (!orderId) return;

    try {
      await confirmPickupByCustomer(orderId, data.otp);
      toast({
        title: "Pickup Confirmed",
        description: "The order has been successfully marked as picked up by the customer.",
      });
      onSuccess();
      onClose();
    } catch (error) {
      const message = "Unable to confirm pickup. Please check the OTP and try again.";
      toast({
        title: "Confirmation Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Customer Pickup</DialogTitle>
          <DialogDescription>
            Enter the 6-digit OTP from the customer to confirm they have picked up their order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer OTP</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123456" 
                      {...field}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '');
                        field.onChange(numericValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Confirming..." : "Confirm Pickup"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
