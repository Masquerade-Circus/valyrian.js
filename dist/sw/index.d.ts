import { Valyrian } from "Valyrian";
declare module "Valyrian" {
    interface Valyrian {
        registerSw?: typeof registerSw;
    }
}
export declare function registerSw(file?: string, options?: RegistrationOptions): Promise<ServiceWorkerContainer | undefined>;
export declare const plugin: (v: Valyrian) => typeof registerSw;
//# sourceMappingURL=index.d.ts.map