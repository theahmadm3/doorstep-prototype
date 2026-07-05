import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	addPendingPayment,
	getPendingPayments,
	removePendingPayment,
} from "./pending-payments";

const STORAGE_KEY = "doorstep-pending-payments";

const payment = (overrides: Partial<Parameters<typeof addPendingPayment>[0]> = {}) => ({
	localCartOrderId: "local-1",
	backendOrderId: "backend-1",
	reference: "ref-1",
	...overrides,
});

describe("pending-payments", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("adds and retrieves a pending payment", () => {
		addPendingPayment(payment());

		const stored = getPendingPayments();
		expect(stored).toHaveLength(1);
		expect(stored[0]).toMatchObject({
			localCartOrderId: "local-1",
			backendOrderId: "backend-1",
			reference: "ref-1",
		});
		expect(stored[0].createdAt).toBeTypeOf("number");
	});

	it("removes a payment by reference", () => {
		addPendingPayment(payment({ reference: "ref-1" }));
		addPendingPayment(payment({ reference: "ref-2", localCartOrderId: "local-2" }));

		removePendingPayment("ref-1");

		const stored = getPendingPayments();
		expect(stored).toHaveLength(1);
		expect(stored[0].reference).toBe("ref-2");
	});

	it("deduplicates by reference, keeping the newest record", () => {
		addPendingPayment(payment({ backendOrderId: "backend-old" }));
		addPendingPayment(payment({ backendOrderId: "backend-new" }));

		const stored = getPendingPayments();
		expect(stored).toHaveLength(1);
		expect(stored[0].backendOrderId).toBe("backend-new");
	});

	it("prunes records older than 24 hours", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-05T00:00:00Z"));
		addPendingPayment(payment({ reference: "old" }));

		vi.setSystemTime(new Date("2026-07-06T00:00:01Z"));
		addPendingPayment(payment({ reference: "fresh" }));

		const stored = getPendingPayments();
		expect(stored).toHaveLength(1);
		expect(stored[0].reference).toBe("fresh");
	});

	it("caps stored records at 5, dropping the oldest", () => {
		for (let i = 1; i <= 6; i++) {
			addPendingPayment(payment({ reference: `ref-${i}` }));
		}

		const stored = getPendingPayments();
		expect(stored).toHaveLength(5);
		expect(stored.map((p) => p.reference)).toEqual([
			"ref-2",
			"ref-3",
			"ref-4",
			"ref-5",
			"ref-6",
		]);
	});

	it("returns an empty list for corrupted storage", () => {
		localStorage.setItem(STORAGE_KEY, "not-json{{");
		expect(getPendingPayments()).toEqual([]);

		localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
		expect(getPendingPayments()).toEqual([]);

		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify([{ reference: "missing-fields" }]),
		);
		expect(getPendingPayments()).toEqual([]);
	});
});
