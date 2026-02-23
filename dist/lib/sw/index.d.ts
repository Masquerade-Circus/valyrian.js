export type SwRuntimeEvent = "registered" | "updateavailable" | "updated" | "error";
export type SwRuntimeState = {
    updateAvailable: boolean;
    installing: boolean;
    registration: ServiceWorkerRegistration | null;
    waiting: ServiceWorker | null;
};
export type SwRuntimeEnvironment = {
    isNodeJs?: boolean;
    navigator?: Navigator | null;
    window?: Window | null;
};
export type CreateSwRuntimeOptions = {
    swUrl?: string;
    scope?: string;
    strategy?: "prompt-user" | "auto" | "manual";
    runtime?: SwRuntimeEnvironment;
};
export interface SwRuntime {
    state: Readonly<SwRuntimeState>;
    on: (event: SwRuntimeEvent, callback: (payload?: unknown) => void) => () => void;
    off: (event: SwRuntimeEvent, callback: (payload?: unknown) => void) => void;
    applyUpdate: () => void;
    checkForUpdate: () => Promise<void>;
    unregister: () => Promise<boolean>;
}
export declare function registerSw(file?: string, options?: RegistrationOptions, navigatorRef?: Navigator | null): Promise<ServiceWorkerRegistration | undefined>;
export declare class SwRuntimeManager implements SwRuntime {
    #private;
    constructor(options?: CreateSwRuntimeOptions);
    get state(): Readonly<SwRuntimeState>;
    on(event: SwRuntimeEvent, callback: (payload?: unknown) => void): () => void;
    off(event: SwRuntimeEvent, callback: (payload?: unknown) => void): void;
    init(): Promise<this>;
    applyUpdate(): void;
    checkForUpdate(): Promise<void>;
    unregister(): Promise<boolean>;
}
//# sourceMappingURL=index.d.ts.map