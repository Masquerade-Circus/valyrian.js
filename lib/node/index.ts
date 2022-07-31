import { document, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript } from "./utils/tree-adapter";

import FormData from "form-data";
import { Valyrian } from "Valyrian";
import fetch from "node-fetch";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";

let localValyrian: Valyrian;

function plugin(v: Valyrian) {
  localValyrian = v;
  global.fetch = fetch as any;
  global.FormData = FormData as any;
  global.document = document as any;
}

function render(...args: any[]) {
  if (!localValyrian) {
    throw new Error("This plugin is not in use. Please invoke `v.use(nodePlugin)`");
  }

  let Component = () => args;
  let result = localValyrian.mount("div", Component);
  localValyrian.unmount();
  return result;
}

export { domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, inline, sw, icons, render, plugin as default };
