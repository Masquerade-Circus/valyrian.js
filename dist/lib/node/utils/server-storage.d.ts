export declare class ServerStorage implements Storage {
    isContextActive(): boolean;
    get store(): Record<string, string>;
    get length(): number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    static run<T>(callback: () => T): T;
    static isContextActive(): boolean;
    toJSON(): Record<string, string>;
}
//# sourceMappingURL=server-storage.d.ts.map