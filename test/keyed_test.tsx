import "valyrian.js/node";

import { mount, update, v } from "valyrian.js";

import { expect, describe, test as it } from "bun:test";

describe("Keyed lists", () => {
  const set = [1, 2, 3, 4, 5];
  const tests = [
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

  function getString(set: (number | undefined)[]) {
    let str = "<ul>";
    for (const key of set) {
      str += key ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  const beforeString = getString(set);

  tests.forEach((test) => {
    it("Keyed list: " + test.name, () => {
      let keys: (number | undefined)[] = [...set];
      const component = () => (
        <ul>
          {keys.map((key) => {
            if (key) {
              return <li key={key}>{key}</li>;
            }
          })}
        </ul>
      );

      const before = mount("body", component);
      keys = [...test.set];
      const after = update();
      const afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);

      for (let i = 0; i < 10000; i++) {
        keys = [...set];
        update();
        keys = [...test.set];
        update();
      }
    });
  });

  it("Keyed list: Replace with string and update with list", () => {
    const keys = [1, 2, 3, 4, 5];
    let useStrings = true;
    const component = () => (
      <ul>
        {keys.map((key) => {
          if (useStrings) {
            return String(key);
          }
          return <li key={key}>{key}</li>;
        })}
      </ul>
    );

    const before = mount("body", component);

    useStrings = false;
    const after = update();

    const afterString = getString(keys);

    useStrings = true;
    const afterUpdate = update();

    expect(before).toEqual("<ul>12345</ul>");
    expect(after).toEqual(afterString);
    expect(afterUpdate).toEqual("<ul>12345</ul>");
  });

  it("Keyed list: Replace with undefined and update with defined", () => {
    let keys: (number | undefined)[] = [1, 2, 3, 4, 5];
    const component = () => (
      <ul>
        {keys.map((key) => {
          if (key) {
            return <li key={key}>{key}</li>;
          }
          return "Hello";
        })}
      </ul>
    );

    const before = mount("body", component);

    keys = [6, 7, 8, 9, , 10];
    const after = update();

    const afterString = getString(keys);

    keys = [1, 2, 3, 4, 5];
    const afterUpdate = update();

    const afterUpdateString = getString(keys);

    expect(before).toEqual(beforeString);
    expect(after).toEqual(afterString);
    expect(afterUpdate).toEqual(afterUpdateString);
  });
});
