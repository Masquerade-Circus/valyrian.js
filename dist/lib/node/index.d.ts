import { Document, DocumentFragment, Element, Event, HTMLFormElement, MouseEvent, Node, PopStateEvent, SubmitEvent, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript } from "./utils/tree-adapter";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";
import { NodeRuntime } from "./runtime";
import { ServerStorage } from "./utils/server-storage";
export type { InlineInput, InlineOptions, InlineResult, InlineUncssOptions } from "./utils/inline";
declare const document: Document;
declare function render(...args: any[]): string;
export { document, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, inline, sw, icons, render, ServerStorage, NodeRuntime, Event, MouseEvent, SubmitEvent, PopStateEvent, Node, Element, Document, DocumentFragment, HTMLFormElement };
//# sourceMappingURL=index.d.ts.map