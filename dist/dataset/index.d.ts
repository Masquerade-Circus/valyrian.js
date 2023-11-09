import { VnodeWithDom } from "valyrian.js";
interface DataSetInterface<T> {
    data: T[];
    reset: (data: T[]) => void;
    add: (...data: T[]) => void;
    update: (index: number, data: T) => void;
    delete: (index: number) => void;
}
interface DataSetHandler<T> {
    (data: T, index: number): VnodeWithDom;
}
export declare class DataSet<T> implements DataSetInterface<T> {
    #private;
    get data(): T[];
    set data(data: T[]);
    constructor(data?: T[], shouldFreeze?: boolean);
    setVnodeAndHandler(vnode: VnodeWithDom, handler: DataSetHandler<T>): void;
    reset(data: T[]): void;
    add(...data: T[]): void;
    delete(index: number): void;
    update(index: number, item: Partial<T>): void;
}
export {};
//# sourceMappingURL=index.d.ts.map