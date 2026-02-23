export type MoneyFormatOptions = {
    locale?: Intl.LocalesArgument;
    currency?: string;
    digits?: number;
    style?: Intl.NumberFormatOptions["style"];
};
export declare class NumberFormatter {
    #private;
    get value(): number;
    private constructor();
    set(newValue: number | string, shiftDecimal?: boolean): this;
    private clean;
    format(digits?: number, options?: Intl.NumberFormatOptions, locale?: Intl.LocalesArgument): string;
    fromDecimalPlaces(decimalPlaces: number): this;
    toDecimalPlaces(decimalPlaces: number): this;
    getDecimalPlaces(): number;
    shiftDecimalPlaces(): this;
    static create(value?: number | string, shiftDecimal?: boolean): NumberFormatter;
}
export declare class Money {
    private cents;
    private constructor();
    static fromCents(cents: number): Money;
    static fromDecimal(value: number, decimalPlaces?: number): Money;
    toCents(): number;
    toDecimal(decimalPlaces?: number): number;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(multiplier: number): Money;
    divide(divider: number): Money;
}
export declare function parseMoneyInput(value: string, options?: {
    locale?: Intl.LocalesArgument;
    decimalPlaces?: number;
}): Money;
export declare function formatMoney(value: Money | number, options?: MoneyFormatOptions): string;
//# sourceMappingURL=index.d.ts.map