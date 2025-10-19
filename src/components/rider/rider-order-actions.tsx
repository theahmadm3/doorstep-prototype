
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { performRiderAction } from '@/lib/api';
import type { RiderOrder } from '@/lib/types';
import { UtensilsCrossed, Check, Map, Truck } from 'lucide-react';
import OTPSubmissionModal from './otp-submission-modal';

interface RiderOrderActionsProps {
  order: RiderOrder;
  onSuccess: () => void;
}

export default function RiderOrderActions({ order, onSuccess }: RiderOrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAction = async (action: string, otp?: string) => {
    setIsLoading(true);
    try {
      const payload = otp ? { otp } : undefined;
      await performRiderAction(order.id, action, payload);
      toast({
        title: 'Status Updated',
        description: `Order #${order.id.slice(0, 6)} has been updated.`,
      });
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: 'Action Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    await handleAction('deliver', otp);
  };
  
  const renderButton = () => {
    switch (order.status) {
      case 'Driver Assigned':
        return (
          <Button className="w-full" onClick={() => handleAction('arrived_restaurant')} disabled={isLoading}>
            <UtensilsCrossed className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating...' : 'Arrived at Restaurant'}
          </Button>
        );
      case 'arrived_restaurant':
        return (
          <Button className="w-full" onClick={() => handleAction('pickedup')} disabled={isLoading}>
             <Truck className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating...' : 'Mark as Picked Up'}
          </Button>
        );
      case 'pickedup':
         return (
          <Button className="w-full" onClick={() => handleAction('arrived_destination')} disabled={isLoading}>
            <Map className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating...' : 'Arrived at Destination'}
          </Button>
        );
      case 'arrived_destination':
        return (
          <Button className="w-full" onClick={() => setIsModalOpen(true)} disabled={isLoading}>
            <Check className="mr-2 h-4 w-4" />
            {isLoading ? 'Updating...' : 'Deliver (Confirm OTP)'}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <OTPSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleOtpSubmit}
        isSubmitting={isLoading}
      />
      <div className="pt-4 border-t">
        {renderButton()}
      </div>
    </>
  );
}
