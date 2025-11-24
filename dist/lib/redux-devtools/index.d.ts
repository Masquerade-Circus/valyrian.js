import { FluxStore } from "valyrian.js/flux-store";
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION__: any;
    }
}
interface DevToolsOptions {
    name?: string;
    [key: string]: any;
}
export declare function connectFluxStore(store: FluxStore, options?: DevToolsOptions): void;
export declare function connectPulseStore(store: any, options?: DevToolsOptions): void;
export declare function connectPulse(pulse: any, options?: DevToolsOptions): any;
export {};
//# sourceMappingURL=index.d.ts.map