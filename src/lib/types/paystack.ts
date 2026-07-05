
// POST /payments/initialize/ response
export interface InitializePaymentPayload {
  amount: number; // Amount in kobo (integer) — always multiply Naira by 100 and Math.round
}

export interface InitializePaymentResponse {
  status: string;
  authorization_url: string;
  access_code: string;
  reference: string;
}

// Paystack onSuccess callback shape (kept for potential future use)
export interface PaystackTransaction {
  message: string;
  reference: string;
  status: 'success' | 'failed';
  trans: string;
  transaction: string;
  trxref: string;
}
