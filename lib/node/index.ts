import {
  Document,
  DocumentFragment,
  Element,
  Event,
  HTMLFormElement,
  MouseEvent,
  Node,
  PopStateEvent,
  SubmitEvent,
  document as fallbackDocument,
  domToHtml,
  domToHyperscript,
  htmlToDom,
  htmlToHyperscript
} from "./utils/tree-adapter";
import { mount, unmount } from "valyrian.js";

import FormData from "form-data";
import { icons } from "./utils/icons";
import { inline } from "./utils/inline";
import { sw } from "./utils/sw";
import { getActiveDocument, installRuntimeGlobals, NodeRuntime } from "./runtime";
import { ServerStorage } from "./utils/server-storage";
export type { InlineInput, InlineOptions, InlineResult, InlineUncssOptions } from "./utils/inline";

const document = new Proxy(fallbackDocument, {
  get(_target, property) {
    const activeDocument = getActiveDocument(fallbackDocument) as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(activeDocument, property, activeDocument);
    if (property === "documentElement" && value instanceof Element) {
      if (value.parentNode !== document) {
        value.parentNode = document;
      }
      return value;
    }
    return typeof value === "function" ? value.bind(activeDocument) : value;
  },
  set(_target, property, value) {
    return Reflect.set(getActiveDocument(fallbackDocument), property, value);
  }
});

installRuntimeGlobals(document);

global.FormData = FormData as any;
global.Event = Event as any;
global.MouseEvent = MouseEvent as any;
global.SubmitEvent = SubmitEvent as any;
global.PopStateEvent = PopStateEvent as any;
global.sessionStorage = new ServerStorage();
global.localStorage = new ServerStorage();

function render(...args: any[]) {
  const Component = () => args;
  const result = mount(document.createElement("div") as any, Component);
  unmount();
  return result;
}

export {
  document,
  domToHtml,
  domToHyperscript,
  htmlToDom,
  htmlToHyperscript,
  inline,
  sw,
  icons,
  render,
  ServerStorage,
  NodeRuntime,
  Event,
  MouseEvent,
  SubmitEvent,
  PopStateEvent,
  Node,
  Element,
  Document,
  DocumentFragment,
  HTMLFormElement
};
