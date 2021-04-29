import "../lib";

import expect from "expect";
import nodePlugin from "../plugins/node";
v.usePlugin(nodePlugin);

describe("Lifecycle", () => {
  it("Mount and update", () => {
    let s = 1;
    let calls = [];

    let Lifecycle = function () {
      return (
        <div
          {...{
            oncreate() {
              // After dom element is created and attached to the document
              calls.push("component oncreate");
            },

            onbeforeupdate() {
              // before dom element is updated
              // if you return false the update step is skipped
              calls.push("component onbeforeupdate");
            },

            onupdate() {
              // after dom element is updated
              calls.push("component onupdate");
            },

            onremove() {
              // after dom element is removed
              calls.push("component onremove");
            }
          }}
        >
          {s > 0 ? (
            <h1
              {...{
                oncreate() {
                  // After dom element is created and attached to the document
                  calls.push("oncreate");
                },
                onupdate() {
                  // after dom element is updated
                  calls.push("onupdate");
                },
                onremove() {
                  // after dom element is removed
                  calls.push("onremove");
                }
              }}
            >
              {s}
            </h1>
          ) : (
            <small />
          )}
          <ul>
            {(function () {
              let elem = [];
              if (s >= 0) {
                for (let l = s; l--; ) {
                  if (l !== 4) {
                    elem.push(
                      <li>
                        <span
                          onremove={() => {
                            calls.push("onspanremove");
                          }}
                        >
                          {l + 1}
                        </span>
                      </li>
                    );
                  }
                }
              }

              return elem;
            })()}
          </ul>
        </div>
      );
    };
    let result = [];
    let expectedDom = [
      "<div><h1>1</h1><ul><li><span>1</span></li></ul></div>",
      "<div><small></small><ul></ul></div>",
      "<div><h1>1</h1><ul><li><span>1</span></li></ul></div>",
      "<div><h1>2</h1><ul><li><span>2</span></li><li><span>1</span></li></ul></div>",
      "<div><h1>1</h1><ul><li><span>1</span></li></ul></div>",
      "<div><h1>3</h1><ul><li><span>3</span></li><li><span>2</span></li><li><span>1</span></li></ul></div>",
      "<div><small></small><ul></ul></div>"
    ];
    let expectedLifeCycleCalls = [
      "component oncreate",
      "oncreate",
      "component onbeforeupdate",
      "component onupdate",
      "onremove",
      "onspanremove",
      "component onbeforeupdate",
      "component onupdate",
      "oncreate",
      "component onbeforeupdate",
      "component onupdate",
      "onupdate",
      "component onbeforeupdate",
      "component onupdate",
      "onupdate",
      "onspanremove",
      "component onbeforeupdate",
      "component onupdate",
      "onupdate",
      "component onbeforeupdate",
      "component onupdate",
      "onremove",
      "onspanremove",
      "onspanremove",
      "onspanremove"
    ];

    result.push(v.mount("body", Lifecycle));
    s = 0;
    result.push(v.update());
    s = 1;
    result.push(v.update());
    s = 2;
    result.push(v.update());
    s = 1;
    result.push(v.update());
    s = 3;
    result.push(v.update());
    s = 0;
    result.push(v.update());

    expect(result).toEqual(expectedDom);
    expect(calls).toEqual(expectedLifeCycleCalls);
  });
});
