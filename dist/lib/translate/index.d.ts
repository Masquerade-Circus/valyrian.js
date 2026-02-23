export declare function setLog(value: boolean): void;
export declare function setStoreStrategy(strategy: {
    get: () => string;
    set: (lang: string) => void;
}): void;
export declare function getLang(): string;
export declare function setLang(newLang: string): void;
export declare function t(path: string, params?: Record<string, string>): string;
export declare function setTranslations(defaultTranslation: Record<string, any>, newTranslations?: Record<string, Record<string, any>>): void;
export declare function getTranslations(): Record<string, Record<string, any>>;
//# sourceMappingURL=index.d.ts.map