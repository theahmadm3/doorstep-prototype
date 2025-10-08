
"use client";

import { useQuery } from '@tanstack/react-query';
import { getAddresses } from '@/lib/api';
import { useUIStore } from '@/stores/useUIStore';
import { useEffect } from 'react';

export const useAddresses = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['addresses'],
        queryFn: getAddresses,
        enabled: typeof window !== 'undefined' && !!localStorage.getItem('user'),
    });

    const setSelectedAddress = useUIStore(state => state.setSelectedAddress);
    const selectedAddress = useUIStore(state => state.selectedAddress);

    useEffect(() => {
        if (data && (!selectedAddress || !data.some(a => a.id === selectedAddress.id))) {
            const defaultAddress = data.find(a => a.is_default) || data[0];
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            } else {
                setSelectedAddress(null);
            }
        }
    }, [data, selectedAddress, setSelectedAddress]);
    

    return { 
        addresses: data ?? [], 
        isAddressesLoading: isLoading, 
        isError, 
        refetchAddresses: refetch,
        selectedAddress,
        setSelectedAddress
    };
};
