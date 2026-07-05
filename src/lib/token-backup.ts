export interface AuthSnapshot {
	access: string;
	refresh: string;
	user: string;
	currentUserRole: string | null;
}

const DB_NAME = "doorstep-auth-backup";
const STORE = "auth";
const SNAPSHOT_KEY = "snapshot";

function isAuthSnapshot(value: unknown): value is AuthSnapshot {
	if (typeof value !== "object" || value === null) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.access === "string" &&
		typeof record.refresh === "string" &&
		typeof record.user === "string" &&
		(typeof record.currentUserRole === "string" ||
			record.currentUserRole === null)
	);
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE)) {
				request.result.createObjectStore(STORE);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function runTransaction<T>(
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	return openDb().then(
		(db) =>
			new Promise<T>((resolve, reject) => {
				const tx = db.transaction(STORE, mode);
				const request = operation(tx.objectStore(STORE));
				tx.oncomplete = () => {
					db.close();
					resolve(request.result);
				};
				tx.onerror = () => {
					db.close();
					reject(tx.error);
				};
				tx.onabort = () => {
					db.close();
					reject(tx.error);
				};
			}),
	);
}

export async function writeAuthBackup(snapshot: AuthSnapshot): Promise<void> {
	await runTransaction("readwrite", (store) =>
		store.put(snapshot, SNAPSHOT_KEY),
	);
}

export async function readAuthBackup(): Promise<AuthSnapshot | null> {
	const value = await runTransaction<unknown>("readonly", (store) =>
		store.get(SNAPSHOT_KEY),
	);
	return isAuthSnapshot(value) ? value : null;
}

export async function clearAuthBackup(): Promise<void> {
	await runTransaction("readwrite", (store) => store.delete(SNAPSHOT_KEY));
}
