import { domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript } from "./utils/tree-adapter";
import { Valyrian } from "Valyrian";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";
declare function plugin(v: Valyrian): void;
declare function render(...args: any[]): string | void;
export { domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, inline, sw, icons, render, plugin as default };
//# sourceMappingURL=index.d.ts.map