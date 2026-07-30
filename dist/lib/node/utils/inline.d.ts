import CleanCSS from "clean-css";
import type { BuildOptions } from "esbuild";
import type { UserDefinedOptions } from "purgecss";
import type { MinifyOptions } from "terser";
export type InlineInput = string | {
    raw: string;
    map?: string | null;
    file: string;
};
type InlineOwnedEsbuildOptions = "write" | "sourcemap" | "entryPoints" | "stdin" | "outfile" | "outdir" | "bundle" | "minify" | "loader" | "jsx" | "jsxImportSource";
export type InlineEsbuildOptions = Omit<BuildOptions, InlineOwnedEsbuildOptions>;
export interface InlineOptions {
    compact?: boolean;
    bundle?: boolean;
    noValidate?: boolean;
    declarationDir?: string;
    tsc?: Record<string, any>;
    esbuild?: InlineEsbuildOptions;
    terser?: MinifyOptions;
    cleanCss?: CleanCSS.OptionsOutput;
    [key: string]: unknown;
}
export interface InlineUncssOptions extends Omit<UserDefinedOptions, "content" | "css"> {
    cleanCss?: CleanCSS.OptionsOutput;
}
export interface InlineResult {
    raw: string;
    map: string | null;
    file: string;
}
export declare function inline(file: InlineInput, options?: InlineOptions): Promise<InlineResult>;
export declare namespace inline {
    var uncss: (renderedHtml: (string | Promise<string>)[], css: string, options?: InlineUncssOptions) => Promise<string>;
}
export {};
//# sourceMappingURL=inline.d.ts.map