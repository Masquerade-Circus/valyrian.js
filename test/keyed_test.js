import expect from "expect";
import { v } from "../lib/index";

require("../plugins/node");

describe("Keyed lists", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4] }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5] }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5] }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6] }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5] }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5] }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1] }, // Reversed
    { name: "Switch positions", set: [1, 4, 3, 2, 5] }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4] },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4] },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, , 10]
    }
  ];

  function getString(set) {
    let str = "<ul>";
    for (let key of set) {
      str += key ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  let beforeString = getString(set);

  tests.forEach((test) => {
    it("Keyed list: " + test.name, () => {
      let keys = [...set];
      let component = () => (
        <ul>
          {keys.map((key) => {
            if (key) {
              return <li key={key}>{key}</li>;
            }
          })}
        </ul>
      );

      let before = v.mount("body", component);
      keys = [...test.set];
      let after = v.update(component);

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  it("Keyed list: Replace with string and update with list", () => {
    let keys = [1, 2, 3, 4, 5];
    let useStrings = true;
    let component = () => (
      <ul>
        {keys.map((key) => {
          if (useStrings) {
            return String(key);
          }
          return <li key={key}>{key}</li>;
        })}
      </ul>
    );

    let before = v.mount("body", component);

    useStrings = false;
    let after = v.update(component);

    let afterString = getString(keys);

    useStrings = true;
    let afterUpdate = v.update(component);

    expect(before).toEqual("<ul>12345</ul>");
    expect(after).toEqual(afterString);
    expect(afterUpdate).toEqual("<ul>12345</ul>");
  });

  it("Keyed list: Replace with undefined and update with defined", () => {
    let keys = [1, 2, 3, 4, 5];
    let component = () => (
      <ul>
        {keys.map((key) => {
          if (key) {
            return <li key={key}>{key}</li>;
          }
          return "Hello";
        })}
      </ul>
    );

    let before = v.mount("body", component);

    keys = [6, 7, 8, 9, , 10];
    let after = v.update(component);

    let afterString = getString(keys);

    keys = [1, 2, 3, 4, 5];
    let afterUpdate = v.update(component);

    let afterUpdateString = getString(keys);

    expect(before).toEqual(beforeString);
    expect(after).toEqual(afterString);
    expect(afterUpdate).toEqual(afterUpdateString);
  });
});
