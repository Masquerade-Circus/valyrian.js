import { document, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, Event } from "./utils/tree-adapter";
import { mount, unmount } from "valyrian.js";

import FormData from "form-data";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";
import { ServerStorage } from "./utils/server-storage";

global.FormData = FormData as any;
global.document = document as any;
global.Event = Event as any;
global.sessionStorage = new ServerStorage();
global.localStorage = new ServerStorage();

function render(...args: any[]) {
  const Component = () => args;
  const result = mount("div", Component);
  unmount();
  return result;
}

export { document, domToHtml, domToHyperscript, htmlToDom, htmlToHyperscript, inline, sw, icons, render, ServerStorage, Event };
