export declare enum StorageType {
    Session = "session",
    Local = "local"
}
export interface NativeStorageInterface {
    state: Record<string, any>;
    set(key: string, value: any): void;
    get(key: string): any;
    delete(key: string): void;
    load(): void;
    clear(): void;
}
export declare function createNativeStore<T>(id: string, definition?: Record<string, any>, storageType?: StorageType, reuseIfExist?: boolean): NativeStorageInterface & T;
//# sourceMappingURL=index.d.ts.map