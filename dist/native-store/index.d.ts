export interface NativeStorageInterface {
    state: Record<string, any>;
    set(key: string, value: any): void;
    get(key: string): any;
    delete(key: string): void;
    load(): void;
    clear(): void;
}
export declare function createNativeStore<T>(key: string, definition?: Record<string, any>, reuseIfExist?: boolean): NativeStorageInterface & T;
//# sourceMappingURL=index.d.ts.map