interface StoreOptions {
    state?: Record<string, unknown> | (() => Record<string, unknown>);
    getters?: Record<string, Function>;
    mutations?: Record<string, Function>;
    actions?: Record<string, Function>;
}
interface StoreInstance {
    new (options: StoreOptions): StoreInstance;
    state: Record<string, any>;
    getters?: Record<string, any>;
    commit: (type: string, ...payload: any[]) => void;
    dispatch: (type: string, ...payload: any[]) => void;
}
export declare const Store: StoreInstance;
export {};
//# sourceMappingURL=index.d.ts.map