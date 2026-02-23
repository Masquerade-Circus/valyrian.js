export declare function isEmpty(value: any): boolean;
export declare function is<T>(value: any, type: string | any): value is T;
export declare function isFunction(value: any): value is Function;
export declare function isString(value: any): value is string;
export declare function isNumber(value: any): value is number;
export declare function isFiniteNumber(value: any): value is number;
export declare function isBoolean(value: any): value is boolean;
export declare function isObject(value: any): value is object;
export declare function hasLength(value: any, length: number): boolean;
export declare function hasMinLength(value: any, length: number): boolean;
export declare function hasMaxLength(value: any, length: number): boolean;
export declare function hasLengthBetween(value: any, min: number, max: number): boolean;
export declare function isLessThan(value: any, limit: number): boolean;
export declare function isGreaterThan(value: any, limit: number): boolean;
export declare function isBetween(value: any, min: number, max: number): boolean;
export declare function pick<T extends object, K extends keyof T>(source: any, keys: K[]): Pick<T, K>;
export declare function ensureIn<T>(value: T, allowed: readonly T[]): boolean;
//# sourceMappingURL=validators.d.ts.map