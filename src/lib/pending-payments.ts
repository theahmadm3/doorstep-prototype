export interface PendingPayment {
	localCartOrderId: string;
	backendOrderId: string;
	reference: string;
	createdAt: number;
}

const STORAGE_KEY = "doorstep-pending-payments";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_RECORDS = 5;

function isPendingPayment(value: unknown): value is PendingPayment {
	if (typeof value !== "object" || value === null) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.localCartOrderId === "string" &&
		typeof record.backendOrderId === "string" &&
		typeof record.reference === "string" &&
		typeof record.createdAt === "number"
	);
}

function readAll(): PendingPayment[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const now = Date.now();
		return parsed
			.filter(isPendingPayment)
			.filter((p) => now - p.createdAt < MAX_AGE_MS);
	} catch {
		return [];
	}
}

function writeAll(payments: PendingPayment[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
	} catch {
		/* storage full or unavailable — reconciliation degrades gracefully */
	}
}

export function getPendingPayments(): PendingPayment[] {
	return readAll();
}

export function addPendingPayment(
	payment: Omit<PendingPayment, "createdAt">,
): void {
	const others = readAll().filter((p) => p.reference !== payment.reference);
	writeAll(
		[...others, { ...payment, createdAt: Date.now() }].slice(-MAX_RECORDS),
	);
}

export function removePendingPayment(reference: string): void {
	writeAll(readAll().filter((p) => p.reference !== reference));
}
