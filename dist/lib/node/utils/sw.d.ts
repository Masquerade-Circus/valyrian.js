interface SwOptions {
    version?: string;
    name?: string;
    /** @deprecated Use criticalUrls instead */
    urls?: string[];
    /** Critical URLs that block installation (required for app to work) */
    criticalUrls?: string[];
    /** Optional URLs cached in background (non-blocking, won't fail install) */
    optionalUrls?: string[];
    debug?: boolean;
    logFetch?: boolean;
    offlinePage?: string;
}
export declare function sw(file: string, options?: SwOptions): void;
export {};
//# sourceMappingURL=sw.d.ts.map