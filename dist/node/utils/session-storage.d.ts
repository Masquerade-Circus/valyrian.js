export declare class SessionStorage {
    private storage;
    private limit;
    private persist;
    private filePath;
    private directory;
    constructor({ persist, filePath }?: {
        persist?: boolean;
        filePath?: string;
    });
    private getStorageSize;
    private checkSizeLimit;
    setItem(key: string | null | undefined, value: string | null | undefined): void;
    getItem(key: string | null | undefined): string | null;
    removeItem(key: string | null | undefined): void;
    clear(): void;
    get length(): number;
    key(index: number): string | null;
    private saveToFile;
    private loadFromFile;
}
//# sourceMappingURL=session-storage.d.ts.map