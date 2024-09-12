import { document, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript } from "./utils/tree-adapter";
import { mount, unmount } from "valyrian.js";

import FormData from "form-data";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";
import { SessionStorage } from "./utils/session-storage";

global.FormData = FormData as any;
global.document = document as any;
global.sessionStorage = new SessionStorage();
global.localStorage = new SessionStorage();

function render(...args: any[]) {
  const Component = () => args;
  const result = mount("div", Component);
  unmount();
  return result;
}

export { domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, inline, sw, icons, render };
