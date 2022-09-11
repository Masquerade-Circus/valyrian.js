import { Valyrian } from "Valyrian";
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
declare module "Valyrian" {
    interface Valyrian {
        store?: StoreInstance;
        commit?: StoreInstance["commit"];
        dispatch?: StoreInstance["dispatch"];
        state?: StoreInstance["state"];
        getters?: StoreInstance["getters"];
    }
}
export declare const Store: StoreInstance;
export declare function plugin(v: Valyrian, optionsOrStore?: StoreOptions | StoreInstance): StoreInstance;
export {};
//# sourceMappingURL=index.d.ts.map