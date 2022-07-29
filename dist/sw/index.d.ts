import { Valyrian } from "Valyrian";
declare module "Valyrian" {
    interface Valyrian {
        registerSw?: typeof registerSw;
    }
}
export declare function registerSw(file?: string, options?: RegistrationOptions): Promise<ServiceWorkerContainer | undefined>;
declare const plugin: (v: Valyrian) => typeof registerSw;
export default plugin;
//# sourceMappingURL=index.d.ts.map