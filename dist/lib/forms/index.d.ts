import { SchemaShield } from "schema-shield";
type JsonSchema = Record<string, unknown>;
export type FormState = Record<string, unknown>;
export type FormTransform<TState extends FormState> = (value: unknown, state: TState) => unknown;
export type FormTransformMap<TState extends FormState> = Partial<Record<keyof TState | string, FormTransform<TState>>>;
export type FormOptions<TState extends FormState> = {
    state: TState;
    schema: JsonSchema;
    clean?: FormTransformMap<TState>;
    format?: FormTransformMap<TState>;
    onSubmit?: (values: TState) => Promise<void> | void;
};
export declare const formSchemaShield: SchemaShield;
export declare class FormStore<TState extends FormState> {
    private validator;
    private onSubmit;
    private clean;
    private format;
    private pulseStore;
    private metaState;
    static get schemaShield(): SchemaShield;
    constructor(options: FormOptions<TState>);
    get state(): TState;
    get validationErrors(): Record<string, string>;
    get submitError(): unknown;
    get success(): boolean;
    get isInflight(): boolean;
    get isDirty(): boolean;
    get hasValidationErrors(): boolean;
    get hasSubmitError(): boolean;
    private isDelegatedSubmitEvent;
    private setValidationErrors;
    private setInflight;
    private setSubmitError;
    formatValue(name: string, value: unknown): unknown;
    setField(name: string, rawValue: unknown): void;
    setSuccess(success: boolean, event?: Event): void;
    validate(): boolean;
    submit(event?: Event): Promise<boolean>;
    reset(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map