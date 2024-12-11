export declare function inline(file: string | {
    raw: string;
    map?: string | null;
    file: string;
}, options?: Record<string, any>): Promise<{
    raw: string;
    map: string | null;
    file: string;
}>;
export declare namespace inline {
    var uncss: (renderedHtml: (string | Promise<string>)[], css: string, options?: Record<string, any>) => Promise<string>;
}
//# sourceMappingURL=inline.d.ts.map