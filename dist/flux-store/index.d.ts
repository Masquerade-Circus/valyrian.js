interface StoreOptions {
    state?: Record<string, any> | (() => Record<string, any>);
    mutations?: Record<string, (state: Record<string, any>, ...args: any[]) => void>;
    actions?: Record<string, (store: FluxStore, ...args: any[]) => any>;
    getters?: Record<string, (state: Record<string, any>, getters: Record<string, any>, globalState?: any, globalGetters?: any) => any>;
    modules?: Record<string, StoreOptions>;
    shouldFreeze?: boolean;
    namespace?: string;
    rootStore?: FluxStore;
}
export declare class FluxStore {
    state: Record<string, any>;
    getters: Record<string, any>;
    private init;
    rootStore: FluxStore | null;
    namespace: string | null;
    constructor({ state, mutations, actions, getters, modules, shouldFreeze, namespace, rootStore }?: StoreOptions);
    private keyExists;
    private isFunction;
    private getStore;
    private isUnfrozen;
    commit(mutation: string, ...args: any[]): void;
    dispatch(action: string, ...args: any[]): Promise<any>;
    trigger(event: string, ...args: any[]): void;
    on(event: string, listener: Function): () => void;
    off(event: string, listener: Function): void;
    use(plugin: Function, ...options: any[]): void;
    registerModule(namespace: string, module: StoreOptions): void;
    unregisterModule(namespace: string): void;
}
export {};
//# sourceMappingURL=index.d.ts.map