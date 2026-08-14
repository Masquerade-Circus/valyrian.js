export declare class ServerStorage implements Storage {
    private readonly storeKey;
    private readonly globalStore;
    isContextActive(): boolean;
    get store(): Record<string | symbol, any>;
    get length(): number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    /**
     * @deprecated Use `NodeRuntime.run()` instead. This method may be removed in v10.
     */
    static run<T>(callback: () => T): T;
    static isContextActive(): boolean;
    toJSON(): Record<string, string>;
}
//# sourceMappingURL=server-storage.d.ts.map