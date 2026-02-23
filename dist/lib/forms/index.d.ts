import { SchemaShield } from "schema-shield";
type JsonSchema = Record<string, unknown>;
export type FormState = Record<string, unknown>;
type EventHandler = ((event: Event) => void) | null;
type FormControl = {
    name?: string;
    type?: string;
    tagName?: string;
    value?: unknown;
    checked?: boolean;
    disabled?: boolean;
    oninput?: EventHandler;
    onchange?: EventHandler;
    getAttribute?: (name: string) => string | null;
    vnode?: {
        props?: Record<string, unknown>;
    };
};
export type FormTransformContext<TState extends FormState> = {
    name: keyof TState | string;
    state: TState;
    control: FormControl | null;
    event?: Event;
};
export type FormTransform<TState extends FormState> = (value: unknown, context: FormTransformContext<TState>) => unknown;
export type FormTransformMap<TState extends FormState> = Partial<Record<keyof TState | string, FormTransform<TState>>>;
export type FormOptions<TState extends FormState> = {
    state: TState;
    schema: JsonSchema;
    clean?: FormTransformMap<TState>;
    format?: FormTransformMap<TState>;
    onSubmit?: (values: TState) => Promise<void> | void;
};
export declare class FormStore<TState extends FormState> {
    #private;
    static createSchemaShield(): SchemaShield;
    constructor(options: FormOptions<TState>);
    get state(): TState;
    get errors(): Record<string, string>;
    get isInflight(): boolean;
    get isDirty(): boolean;
    formatValue(name: string, value: unknown, control?: FormControl | null): unknown;
    setField(name: string, rawValue: unknown, control?: FormControl | null, event?: Event): void;
    validate(): boolean;
    submit(event?: Event): Promise<boolean>;
    reset(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map