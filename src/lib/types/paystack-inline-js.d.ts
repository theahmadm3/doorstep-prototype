declare module "@paystack/inline-js" {
	export interface PaystackPopupTransaction {
		id?: string;
		reference: string;
		message?: string;
		status?: string;
		trans?: string;
		transaction?: string;
		trxref?: string;
	}

	export interface PaystackPopupCallbacks {
		onSuccess?: (transaction: PaystackPopupTransaction) => void;
		onCancel?: () => void;
		onLoad?: (response: unknown) => void;
		onError?: (error: { message?: string }) => void;
	}

	export default class PaystackPop {
		newTransaction(
			options: Record<string, unknown> & PaystackPopupCallbacks,
		): unknown;
		resumeTransaction(
			accessCode: string,
			callbacks?: PaystackPopupCallbacks,
		): unknown;
		cancelTransaction(id?: string): void;
	}
}
