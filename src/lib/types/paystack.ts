
// Paystack API - Initialize Transaction
export interface InitializePaymentPayload {
  amount: number; // Amount in kobo
}

export interface InitializePaymentResponse {
  public_key: string;
  reference: string;
}

// Paystack Widget - onSuccess Callback
export interface PaystackTransaction {
  message: string;
  reference: string;
  status: 'success' | 'failed';
  trans: string;
  transaction: string;
  trxref: string;
}

// react-paystack Hook Configuration
export interface PaystackConfig {
  reference: string;
  email: string;
  amount: number; // Amount in kobo
  publicKey: string;
}
