interface ChildNodes extends Array<Node | Element | Text | DocumentFragment> {
}
export declare class Node implements Node {
    childNodes: ChildNodes;
    baseURI: string;
    tag_name: string;
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
    get parentNode(): Node;
    set parentNode(node: Node);
    constructor();
    appendChild<T extends Node>(node: T): T;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    replaceChild<T extends Node>(node: Node, child: T): T;
    removeChild<T extends Node>(child: T): T;
    cloneNode(deep?: boolean | undefined): Node;
    setAttribute(name: string, value: any): void;
    getAttribute(name: string): string;
    removeAttribute(name: string): void;
    getElementById(id: string): Node | null;
    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions | undefined): void;
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions | undefined): void;
}
export declare class Text extends Node {
    constructor(text: any);
}
export declare class Element extends Node {
    constructor();
    style: Record<string, any>;
    classList: {
        toggle: (item: any, force: any) => void;
    };
    set textContent(text: string);
    get textContent(): string;
    set innerText(text: string);
    get innerText(): string;
    get innerHTML(): string;
    set innerHTML(html: string);
    get outerHTML(): string;
}
export declare class DocumentFragment extends Element {
    constructor();
}
export declare class Document extends Element {
    constructor();
    createDocumentFragment(): DocumentFragment;
    createElement(type: string): Element;
    createElementNS(ns: string, type: string): Element;
    createTextNode(text: any): Text;
}
export declare function domToHtml(dom: Element): string;
export declare function domToHyperscript(childNodes: ChildNodes, depth?: number): string;
export declare function htmlToDom(html: string): Element | Text | DocumentFragment;
export declare function htmlToHyperscript(html: string): string;
export declare const document: Document;
export {};
//# sourceMappingURL=tree-adapter.d.ts.map