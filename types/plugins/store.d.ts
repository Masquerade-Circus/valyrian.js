export = Store;
declare function Store({ state, getters, actions, mutations }?: {
    state?: {} | undefined;
    getters?: {} | undefined;
    actions?: {} | undefined;
    mutations?: {} | undefined;
}): void;
declare class Store {
    constructor({ state, getters, actions, mutations }?: {
        state?: {} | undefined;
        getters?: {} | undefined;
        actions?: {} | undefined;
        mutations?: {} | undefined;
    });
    state: any;
    getters: any;
    commit: (mutation: any, ...args: any[]) => void;
    dispatch: (action: any, ...args: any[]) => Promise<any>;
}
declare namespace Store {
    export { Store as default };
}
