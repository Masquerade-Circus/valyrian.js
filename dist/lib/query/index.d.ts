export type QueryKey = Array<string | number | boolean | Record<string, unknown>>;
export type QueryStatus = "idle" | "loading" | "success" | "error";
export type QueryState<TData> = {
    status: QueryStatus;
    loading: boolean;
    success: boolean;
    error: unknown;
    data: TData | null;
    updatedAt: number;
};
export type QueryConfig<TData> = {
    key: QueryKey;
    fetcher: () => Promise<TData> | TData;
    staleTime?: number;
};
export type MutationConfig<TPayload, TResult> = {
    execute: (payload: TPayload) => Promise<TResult> | TResult;
    onSuccess?: (result: TResult) => void;
    onError?: (error: unknown) => void;
};
export type QueryClientOptions = {
    staleTime?: number;
    cacheTime?: number;
    persist?: boolean;
    persistId?: string;
};
export type QueryChangeEvent = {
    type: string;
    key?: QueryKey;
    payload?: unknown;
    state?: QueryState<unknown>;
};
type CacheEntry<TData> = {
    key: QueryKey;
    hash: string;
    state: QueryState<TData>;
    fetcher: () => Promise<TData> | TData;
    staleTime: number;
    promise: Promise<TData | null> | null;
    gcTimer: ReturnType<typeof setTimeout> | null;
};
export declare class QueryHandle<TData> {
    #private;
    constructor(entry: CacheEntry<TData>, fetch: () => Promise<TData | null>, invalidate: () => void);
    get key(): QueryKey;
    get state(): Readonly<QueryState<TData>>;
    get data(): TData | null;
    fetch(): Promise<TData | null>;
    invalidate(): void;
}
export declare class MutationHandle<TPayload, TResult> {
    #private;
    constructor(state: QueryState<TResult>, execute: (payload: TPayload) => Promise<TResult>, reset: () => void);
    get state(): Readonly<QueryState<TResult>>;
    execute(payload: TPayload): Promise<TResult>;
    reset(): void;
}
export declare class QueryClient {
    #private;
    constructor(options?: QueryClientOptions);
    query<TData>(config: QueryConfig<TData>): QueryHandle<TData>;
    mutation<TPayload, TResult>(config: MutationConfig<TPayload, TResult>): MutationHandle<TPayload, TResult>;
    invalidate(partialKey: QueryKey): void;
    clear(): void;
    on(event: "change", callback: (event: QueryChangeEvent) => void): (() => undefined) | (() => boolean);
    off(event: "change", callback: (event: QueryChangeEvent) => void): void;
}
export {};
//# sourceMappingURL=index.d.ts.map