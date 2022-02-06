export = Sw;
declare class Sw {
    constructor(file: any, options: any);
    file: string;
    options: {
        scope: string;
    };
    ready: boolean;
    sw: null;
    register(): Promise<null>;
}
declare namespace Sw {
    export { Sw as default };
}
