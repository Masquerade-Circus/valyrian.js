interface ChildNodes extends Array<Node | Element | Text | DocumentFragment> {
}
type EventPath = globalThis.EventTarget[] & [(globalThis.EventTarget | undefined)?];
export declare class Event implements globalThis.Event {
    type: string;
    options: EventInit;
    private propagationPath;
    constructor(type: string, options?: EventInit);
    bubbles: boolean;
    readonly NONE: 0;
    readonly CAPTURING_PHASE: 1;
    readonly AT_TARGET: 2;
    readonly BUBBLING_PHASE: 3;
    cancelBubble: boolean;
    cancelable: boolean;
    composed: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    propagationStopped: boolean;
    returnValue: boolean;
    srcElement: globalThis.EventTarget | null;
    target: any;
    currentTarget: any;
    timeStamp: number;
    composedPath(): EventPath;
    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
export declare class MouseEvent extends Event {
    button: number;
    buttons: number;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    constructor(type: string, options?: MouseEventInit);
}
export declare class SubmitEvent extends Event {
    submitter: Element | null;
    constructor(type: string, options?: SubmitEventInit);
}
export declare class PopStateEvent extends Event {
    state: unknown;
    constructor(type: string, options?: PopStateEventInit);
}
type LocalEventListener<TEvent extends Event = Event> = ((event: TEvent) => unknown) | {
    handleEvent(event: TEvent): void;
};
export declare class Node {
    #private;
    childNodes: ChildNodes;
    baseURI: string;
    tag_name: string;
    dispatchEvent(event: Event | globalThis.Event): boolean;
    _dispatchEvent(event: Event | globalThis.Event): boolean;
    get nodeName(): string;
    set nodeName(name: string);
    get tagName(): string;
    set tagName(name: string);
    node_type: number;
    get nodeType(): number;
    set nodeType(type: number);
    node_value: string;
    attributes: Attr[];
    set textContent(text: string);
    get textContent(): string;
    set nodeValue(text: string);
    get nodeValue(): string;
    parent_node: Node | null;
    get parentNode(): Node | null;
    set parentNode(node: Node | null);
    get parentElement(): Element | null;
    set parentElement(node: Element | null);
    get dataset(): Record<string | number, any>;
    set dataset(value: Record<string | number, any>);
    constructor();
    appendChild<T extends Node>(node: T): T;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    replaceChild<T extends Node>(node: Node, child: T): T;
    removeChild<T extends Node>(child: T): T;
    remove(): Node;
    cloneNode(deep?: boolean | undefined): Node;
    setAttribute(name: string, value: any): void;
    getAttribute(name: string): string | null;
    hasAttribute(name: string): boolean;
    removeAttribute(name: string): void;
    addEventListener(type: string, callback: LocalEventListener<any> | null, options?: boolean | AddEventListenerOptions | undefined): void;
    removeEventListener(type: string, callback: LocalEventListener | null, options?: boolean | EventListenerOptions | undefined): void;
}
export declare class Text extends Node {
    constructor(text: any);
}
export declare class Element extends Node {
    #private;
    protected get _listeners(): Map<string, Set<Function>>;
    constructor();
    get value(): string;
    set value(val: string);
    get checked(): boolean;
    set checked(val: boolean);
    addEventListener(type: "click", callback: LocalEventListener<MouseEvent> | null, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: "submit", callback: LocalEventListener<SubmitEvent> | null, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, callback: LocalEventListener | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, callback: LocalEventListener | null, _options?: boolean | EventListenerOptions | undefined): void;
    _style: Record<string, any>;
    get style(): string;
    set style(value: string);
    get className(): string;
    set className(value: string | boolean);
    classList: {
        toggle: (item: any, force: any) => void;
    };
    get id(): string;
    set id(value: string | boolean);
    set textContent(text: string);
    get textContent(): string;
    set innerText(text: string);
    get innerText(): string;
    get innerHTML(): string;
    set innerHTML(html: string);
    get outerHTML(): string;
    querySelector(selector: string): Element | null;
    querySelectorAll(selector: string): Element[];
    click(): void;
}
export declare class HTMLFormElement extends Element {
    requestSubmit(submitter?: Element | null): void;
}
export declare class DocumentFragment extends Element {
    constructor();
}
export declare class Document extends Element {
    constructor();
    documentElement: Element;
    head: Element;
    body: Element;
    location?: Location;
    getElementById(id: string): Element | null;
    createDocumentFragment(): DocumentFragment;
    createElement(type: "form"): HTMLFormElement;
    createElement(type: string): Element;
    createElementNS(ns: string, type: string): Element;
    createTextNode(text: any): Text;
}
export declare function domToHtml(dom: Element | Text | DocumentFragment, rawText?: boolean): string;
export declare function domToHyperscript(childNodes: ChildNodes, depth?: number): string;
export declare function htmlToDom(html: string): Element | Text | DocumentFragment;
export declare function htmlToHyperscript(html: string): string;
export declare const document: Document;
export {};
//# sourceMappingURL=tree-adapter.d.ts.map