interface IconsOptions {
    iconsPath: string | null;
    linksViewPath: string | null;
    logging: boolean;
    path: string;
    appName?: string;
    appDescription?: string;
    developerName?: string;
    developerURL?: string;
    dir?: "auto" | "ltr" | "rtl";
    lang?: string;
    background?: string;
    theme_color?: string;
    display?: "browser" | "standalone";
    orientation?: "any" | "portrait" | "landscape";
    start_url?: string;
    version?: string;
    icons: {
        android: boolean;
        appleIcon: boolean;
        appleStartup: boolean;
        coast: boolean;
        favicons: boolean;
        firefox: boolean;
        windows: boolean;
        yandex: boolean;
    };
}
export declare function icons(source: string, configuration?: IconsOptions): Promise<void>;
export declare namespace icons {
    var options: IconsOptions;
}
export {};
//# sourceMappingURL=icons.d.ts.map