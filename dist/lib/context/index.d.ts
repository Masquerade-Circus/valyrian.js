export type ContextScope<T> = {
    key: symbol;
    name: string;
    __type?: T;
};
export declare function createContextScope<T>(name: string): ContextScope<T>;
export declare function isServerContextActive(): boolean;
export declare function getContext<T>(scope: ContextScope<T>): T | undefined;
export declare function hasContext<T>(scope: ContextScope<T>): boolean;
export declare function setContext<T>(scope: ContextScope<T>, value: T): () => void;
export declare function runWithContext<T, TResult>(scope: ContextScope<T>, value: T, callback: () => TResult): TResult;
export declare function runWithContext<T, TResult>(scope: ContextScope<T>, value: T, callback: () => Promise<TResult>): Promise<TResult>;
//# sourceMappingURL=index.d.ts.map