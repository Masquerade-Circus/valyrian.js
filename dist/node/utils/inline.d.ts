export declare function inline(file: string | {
    raw: string;
    map?: string | null;
    file: string;
}, options?: Record<string, any>): Promise<{
    raw: string | undefined;
    map: string;
    file: string;
} | {
    raw: string;
    map: string | null;
    file: string;
} | undefined>;
export declare namespace inline {
    var uncss: (renderedHtml: (string | Promise<string>)[], css: string, options?: Record<string, any>) => Promise<string>;
}
//# sourceMappingURL=inline.d.ts.map