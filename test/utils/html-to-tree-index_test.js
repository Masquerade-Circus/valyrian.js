import "valyrian.js/node";

import { describe } from "mocha";
import expect from "expect";
import { htmlToDom } from "valyrian.js/node";

describe("Html to Tree index", () => {
  it("should create a document fragment with multiple children and attributes for a complex tree", () => {
    const html = `<div id="test" class="test">Hello <span id="test" class="test">World</span> <span id="test" class="test">How are you</span></div><span id="test" class="test">I'm fine</span>`;

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "#document-fragment");
    expect(result).toHaveProperty("nodeType", 11);
    expect(result).toHaveProperty("attributes", []);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result.childNodes).toHaveLength(2);

    expect(result).toHaveProperty("childNodes.0.tagName", "DIV");
    expect(result).toHaveProperty("childNodes.0.nodeType", 1);
    expect(result).toHaveProperty("childNodes.0.attributes", [
      {
        nodeName: "id",
        nodeValue: "test"
      },
      {
        nodeName: "class",
        nodeValue: "test"
      }
    ]);
    expect(result).toHaveProperty("childNodes.0.childNodes", expect.any(Array));
    expect(result.childNodes[0].childNodes).toHaveLength(4);
    expect(result).toHaveProperty("childNodes.0.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.0.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.0.childNodes.0.nodeValue", "Hello ");
    expect(result).toHaveProperty("childNodes.0.childNodes.1.tagName", "SPAN");
    expect(result).toHaveProperty("childNodes.0.childNodes.1.nodeType", 1);
    expect(result).toHaveProperty("childNodes.0.childNodes.1.attributes", [
      {
        nodeName: "id",
        nodeValue: "test"
      },
      {
        nodeName: "class",
        nodeValue: "test"
      }
    ]);
    expect(result).toHaveProperty("childNodes.0.childNodes.1.childNodes", expect.any(Array));
    expect(result.childNodes[0].childNodes[1].childNodes).toHaveLength(1);
    expect(result).toHaveProperty("childNodes.0.childNodes.1.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.0.childNodes.1.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.0.childNodes.1.childNodes.0.nodeValue", "World");
    expect(result).toHaveProperty("childNodes.0.childNodes.2.tagName", "#text");
    expect(result).toHaveProperty("childNodes.0.childNodes.2.nodeType", 3);
    expect(result).toHaveProperty("childNodes.0.childNodes.2.nodeValue", " ");
    expect(result).toHaveProperty("childNodes.0.childNodes.3.tagName", "SPAN");
    expect(result).toHaveProperty("childNodes.0.childNodes.3.nodeType", 1);
    expect(result).toHaveProperty("childNodes.0.childNodes.3.attributes", [
      {
        nodeName: "id",
        nodeValue: "test"
      },
      {
        nodeName: "class",
        nodeValue: "test"
      }
    ]);
    expect(result).toHaveProperty("childNodes.0.childNodes.3.childNodes", expect.any(Array));
    expect(result.childNodes[0].childNodes[3].childNodes).toHaveLength(1);
    expect(result).toHaveProperty("childNodes.0.childNodes.3.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.0.childNodes.3.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.0.childNodes.3.childNodes.0.nodeValue", "How are you");
    expect(result).toHaveProperty("childNodes.1.tagName", "SPAN");
    expect(result).toHaveProperty("childNodes.1.nodeType", 1);
    expect(result).toHaveProperty("childNodes.1.attributes", [
      {
        nodeName: "id",
        nodeValue: "test"
      },
      {
        nodeName: "class",
        nodeValue: "test"
      }
    ]);
    expect(result).toHaveProperty("childNodes.1.childNodes", expect.any(Array));
    expect(result.childNodes[1].childNodes).toHaveLength(1);
    expect(result).toHaveProperty("childNodes.1.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.1.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.1.childNodes.0.nodeValue", "I'm fine");
  });

  it("should create correctly self closing elements", () => {
    const html = `<div><img src="test.png" /></div>`;

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "DIV");
    expect(result).toHaveProperty("nodeType", 1);
    expect(result).toHaveProperty("attributes", []);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result.childNodes).toHaveLength(1);
    expect(result).toHaveProperty("childNodes.0.tagName", "IMG");
    expect(result).toHaveProperty("childNodes.0.nodeType", 1);
    expect(result).toHaveProperty("childNodes.0.attributes", [
      {
        nodeName: "src",
        nodeValue: "test.png"
      }
    ]);
  });

  it("should create correctly an element with an attribute whose content is a space separated list of values", () => {
    const html = `<div class="test test2 test3"></div>`;

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "DIV");
    expect(result).toHaveProperty("nodeType", 1);
    expect(result).toHaveProperty("attributes", [
      {
        nodeName: "class",
        nodeValue: "test test2 test3"
      }
    ]);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result.childNodes).toHaveLength(0);
  });

  it("should work with a last children as text", () => {
    const html = '<body><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</body>';

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "BODY");
    expect(result).toHaveProperty("nodeType", 1);
    expect(result).toHaveProperty("attributes", []);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result.childNodes).toHaveLength(2);
    expect(result).toHaveProperty("childNodes.0.tagName", "LINK");
    expect(result).toHaveProperty("childNodes.0.nodeType", 1);
    expect(result).toHaveProperty("childNodes.0.attributes", [
      {
        nodeName: "rel",
        nodeValue: "shortcult icon"
      },
      {
        nodeName: "href",
        nodeValue: "/icons/favicon.ico"
      }
    ]);
    expect(result).toHaveProperty("childNodes.1.tagName", "#text");
    expect(result).toHaveProperty("childNodes.1.nodeType", 3);
    expect(result).toHaveProperty("childNodes.1.nodeValue", "Hello world");
  });

  it("should work with a mix of start, middle and last children", () => {
    const html = "Hello <div>World, <span>How are</span> you?</div> <span>I'm fine</span> today.";

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "#document-fragment");
    expect(result).toHaveProperty("nodeType", 11);
    expect(result).toHaveProperty("attributes", []);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result).toHaveProperty("childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.0.nodeValue", "Hello ");
    expect(result).toHaveProperty("childNodes.1.tagName", "DIV");
    expect(result).toHaveProperty("childNodes.1.nodeType", 1);
    expect(result).toHaveProperty("childNodes.1.attributes", []);
    expect(result).toHaveProperty("childNodes.1.childNodes", expect.any(Array));
    expect(result).toHaveProperty("childNodes.1.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.1.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.1.childNodes.0.nodeValue", "World, ");
    expect(result).toHaveProperty("childNodes.1.childNodes.1.tagName", "SPAN");
    expect(result).toHaveProperty("childNodes.1.childNodes.1.nodeType", 1);
    expect(result).toHaveProperty("childNodes.1.childNodes.1.attributes", []);
    expect(result).toHaveProperty("childNodes.1.childNodes.1.childNodes", expect.any(Array));
    expect(result).toHaveProperty("childNodes.1.childNodes.1.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.1.childNodes.1.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.1.childNodes.1.childNodes.0.nodeValue", "How are");
    expect(result).toHaveProperty("childNodes.1.childNodes.2.tagName", "#text");
    expect(result).toHaveProperty("childNodes.1.childNodes.2.nodeType", 3);
    expect(result).toHaveProperty("childNodes.1.childNodes.2.nodeValue", " you?");
    expect(result).toHaveProperty("childNodes.2.tagName", "#text");
    expect(result).toHaveProperty("childNodes.2.nodeType", 3);
    expect(result).toHaveProperty("childNodes.2.nodeValue", " ");
    expect(result).toHaveProperty("childNodes.3.tagName", "SPAN");
    expect(result).toHaveProperty("childNodes.3.nodeType", 1);
    expect(result).toHaveProperty("childNodes.3.attributes", []);
    expect(result).toHaveProperty("childNodes.3.childNodes", expect.any(Array));
    expect(result).toHaveProperty("childNodes.3.childNodes.0.tagName", "#text");
    expect(result).toHaveProperty("childNodes.3.childNodes.0.nodeType", 3);
    expect(result).toHaveProperty("childNodes.3.childNodes.0.nodeValue", "I'm fine");
    expect(result).toHaveProperty("childNodes.4.tagName", "#text");
    expect(result).toHaveProperty("childNodes.4.nodeType", 3);
    expect(result).toHaveProperty("childNodes.4.nodeValue", " today.");
  });

  it("should work with flat attributes and boolean attributes", () => {
    const html = "<div opened selected=false></div>";

    const result = htmlToDom(html);

    expect(result).toHaveProperty("tagName", "DIV");
    expect(result).toHaveProperty("nodeType", 1);
    expect(result).toHaveProperty("attributes", [
      {
        nodeName: "selected",
        nodeValue: "false"
      },
      {
        nodeName: "opened",
        nodeValue: true
      }
    ]);
    expect(result).toHaveProperty("childNodes", expect.any(Array));
    expect(result.childNodes).toHaveLength(0);
  });
});
