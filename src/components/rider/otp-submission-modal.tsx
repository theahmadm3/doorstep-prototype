
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { OTPPayload, OTPSchema } from "@/lib/types";

interface OTPSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function OTPSubmissionModal({ isOpen, onClose, onSubmit, isSubmitting }: OTPSubmissionModalProps) {
  const form = useForm<OTPPayload>({
    resolver: zodResolver(OTPSchema),
    defaultValues: { otp: "" },
  });

  const { formState: { isValid } } = form;

  const handleFormSubmit = async (data: OTPPayload) => {
    await onSubmit(data.otp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from the customer to complete the delivery.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer's Order Code</FormLabel>
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
                {isSubmitting ? "Confirming..." : "Confirm Delivery"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
