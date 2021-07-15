export = plugin;
declare function plugin(v: any): void;
declare namespace plugin {
    export { inline };
    export { sw };
    export { icons };
    export const htmlToDom: (html: any, options?: {}) => any;
    export const domToHtml: (dom: any) => any;
    export const domToHyperscript: (childNodes: any, depth?: number) => any;
    export const htmlToHyperscript: (html: any) => string;
    export function hyperscriptToHtml(...args: any[]): any;
    export { plugin as default };
}
declare function inline(...args: any[]): Promise<void>;
declare namespace inline {
    function extensions(...extensions: any[]): void;
    function css(file: any, options?: {}): any[] | Promise<any[]>;
    function js(file: any, options?: {}): any[] | Promise<any[]>;
    function uncss(renderedHtml: any, options?: {}): string | Promise<string>;
}
declare function sw(file: any, options?: {}): Promise<any>;
declare function icons(source: any, configuration?: {}): Promise<any>;
declare namespace icons {
    namespace options {
        export const iconsPath: null;
        export const linksViewPath: null;
        export const path: string;
        export const appName: null;
        export const appDescription: null;
        export const developerName: null;
        export const developerURL: null;
        export const dir: string;
        export const lang: string;
        export const background: string;
        export const theme_color: string;
        export const display: string;
        export const orientation: string;
        export const start_url: string;
        export const version: string;
        export const logging: boolean;
        export namespace icons_1 {
            const android: boolean;
            const appleIcon: boolean;
            const appleStartup: boolean;
            const coast: boolean;
            const favicons: boolean;
            const firefox: boolean;
            const windows: boolean;
            const yandex: boolean;
        }
        export { icons_1 as icons };
    }
}
