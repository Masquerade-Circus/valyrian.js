import { Document } from "./utils/tree-adapter";
export declare function installRuntimeGlobals(publicDocument: Document): void;
export declare function getActiveDocument(fallback: Document): Document;
export declare function getRuntimeStorage(storeKey: symbol): Record<string | symbol, unknown> | null;
export declare function isRuntimeContextActive(): boolean;
export declare class NodeRuntime {
    static run<T>(callback: () => T): T;
    static runBrowser<T>(options: {
        url: string | URL;
    }, callback: () => T): T;
    static resetHistory(): void;
}
//# sourceMappingURL=runtime.d.ts.map