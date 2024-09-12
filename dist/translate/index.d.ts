export declare function t(path: string, params?: Record<string, string>): string;
export declare function setTranslations(defaultTranslation: Record<string, any>, newTranslations: Record<string, Record<string, any>>): void;
export declare function getTranslations(): Record<string, Record<string, any>>;
export declare function setLang(newLang: string): void;
export declare function getLang(): string;
export declare class NumberFormatter {
    #private;
    get value(): number;
    private constructor();
    set(newValue: number | string, shiftDecimal?: boolean): this;
    private clean;
    format(digits?: number, options?: Intl.NumberFormatOptions, customLocale?: Intl.LocalesArgument): string;
    fromDecimalPlaces(decimalPlaces: number): this;
    toDecimalPlaces(decimalPlaces: number): this;
    getDecimalPlaces(): number;
    shiftDecimalPlaces(): this;
    static create(value?: number | string, shiftDecimal?: boolean): NumberFormatter;
}
//# sourceMappingURL=index.d.ts.map