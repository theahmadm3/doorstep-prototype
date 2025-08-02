
"use client";

import { useContext } from 'react';
import { OrderContext } from '@/components/order-provider';

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
