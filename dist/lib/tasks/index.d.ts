export type TaskStatus = "idle" | "running" | "success" | "error" | "cancelled";
export type TaskStrategy = "takeLatest" | "enqueue" | "drop" | "restartable";
export type TaskState<TResult> = {
    status: TaskStatus;
    running: boolean;
    result: TResult | null;
    error: unknown;
};
export type TaskContext = {
    signal: AbortSignal;
};
export type TaskOptions<TArgs, TResult> = {
    strategy?: TaskStrategy;
    onSuccess?: (result: TResult, args: TArgs) => void;
    onError?: (error: unknown, args: TArgs) => void;
};
export type TaskHandler<TArgs, TResult> = (args: TArgs, ctx: TaskContext) => Promise<TResult> | TResult;
type TaskEventMap<TArgs, TResult> = {
    state: Readonly<TaskState<TResult>>;
    success: TResult;
    error: unknown;
    cancel: TArgs;
};
export declare class Task<TArgs = void, TResult = unknown> {
    #private;
    constructor(handler: TaskHandler<TArgs, TResult>, options?: TaskOptions<TArgs, TResult>);
    get state(): Readonly<TaskState<TResult>>;
    data(): TResult | null;
    error(): unknown;
    on<K extends keyof TaskEventMap<TArgs, TResult>>(event: K, callback: (payload: TaskEventMap<TArgs, TResult>[K]) => void): () => void;
    off<K extends keyof TaskEventMap<TArgs, TResult>>(event: K, callback: (payload: TaskEventMap<TArgs, TResult>[K]) => void): void;
    run(args: TArgs): Promise<TResult | null>;
    cancel(): void;
    reset(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map