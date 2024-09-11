interface TInterface {
    (path: string, params?: Record<string, string>): string;
}
export declare function setTranslations(defaultTranslation: Record<string, any>, newTranslations: Record<string, Record<string, any>>): TInterface;
export declare function setLang(newLang: string): void;
export declare class NumberFormatter {
    #private;
    get value(): number;
    set(newValue: number | string, shiftDecimal?: boolean): this;
    private clean;
    format(digits?: number): string;
    fromDecimalPlaces(decimalPlaces: number): this;
    toDecimalPlaces(decimalPlaces: number): this;
    getDecimalPlaces(): number;
    shiftDecimal(): this;
    static create(value?: number | string, shiftDecimal?: boolean): NumberFormatter;
}
export {};
//# sourceMappingURL=index.d.ts.map