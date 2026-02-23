import { NetworkManager } from "valyrian.js/network";
export type RetryStrategy = "exponential" | "linear";
export type BackoffConfig = {
    strategy?: RetryStrategy;
    baseMs?: number;
    maxMs?: number;
};
export type OfflineOperation = {
    id: string;
    type: string;
    payload?: unknown;
    retries: number;
    createdAt: number;
    lastError?: string;
};
export type QueueState = {
    pending: number;
    failed: number;
    syncing: boolean;
    lastSyncAt: number | null;
    lastError: string | null;
};
export type OfflineQueueOptions = {
    id: string;
    network: NetworkManager;
    storage?: "local" | "session";
    handler: (operation: OfflineOperation) => Promise<unknown>;
    isRetryable?: (error: unknown) => boolean;
    backoff?: BackoffConfig;
    maxRetries?: number;
};
type OfflineQueueEventMap = {
    change: Readonly<QueueState>;
    "sync:success": OfflineOperation;
    "sync:error": {
        operation: OfflineOperation;
        error: unknown;
    };
};
export declare class OfflineQueue {
    #private;
    constructor(options: OfflineQueueOptions);
    state(): Readonly<{
        pending: number;
        failed: number;
        syncing: boolean;
        lastSyncAt: number | null;
        lastError: string | null;
    }>;
    pending(): {
        id: string;
        type: string;
        payload?: unknown;
        retries: number;
        createdAt: number;
        lastError?: string;
    }[];
    failed(): {
        id: string;
        type: string;
        payload?: unknown;
        retries: number;
        createdAt: number;
        lastError?: string;
    }[];
    enqueue(operation: Omit<OfflineOperation, "id" | "createdAt" | "retries">): void;
    sync(): Promise<void>;
    retryOne(id: string): void;
    retryAll(): void;
    discardFailed(): void;
    on<K extends keyof OfflineQueueEventMap>(event: K, callback: (payload: OfflineQueueEventMap[K]) => void): () => void;
    off<K extends keyof OfflineQueueEventMap>(event: K, callback: (payload: OfflineQueueEventMap[K]) => void): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map