/** @jsxRuntime automatic */
/** @jsxImportSource valyrian.js */

import { mount } from "valyrian.js";
import type { Children, Properties, Vnode } from "valyrian.js";

export { unmount, update } from "valyrian.js";

export function mountChildren(host: Element) {
  const state = { count: 0 };
  const effects: string[] = [];
  const views: { tracked: Vnode; literal: Vnode }[] = [];
  const receivedProps: Properties[] = [];
  const receivedArrays: Children[] = [];
  const sharedChildren = ["E", ["F"]];

  function mark<T>(effect: string, value: T): T {
    effects.push(effect);
    return value;
  }

  function Tracked(props: Properties, children: Children) {
    receivedProps.push(props);
    return (
      <output id="tracked">
        {props.label}
        {children}
      </output>
    );
  }

  function ArrayConsumer(props: Properties, children: Children) {
    receivedArrays.push(children);
    return <output id={props.id}>{children}</output>;
  }

  function GroupedChildren(_props: Properties, children: Children) {
    return (
      <div id="mixed">
        {children.map((child) => (
          <span>{child}</span>
        ))}
      </div>
    );
  }

  const tags = {
    get Tracked() {
      return mark("tag", Tracked);
    }
  };
  const spread = {
    get children() {
      return mark("spread", sharedChildren);
    }
  };

  mount(host, () => {
    const tracked = (
      <tags.Tracked label={mark("prop", "count:")} key={mark("key", 0)}>
        <strong>{mark("child", state.count)}</strong>
      </tags.Tracked>
    ) as Vnode;
    const literal = (<span id="literal">A&amp;B</span>) as Vnode;
    views.push({ tracked, literal });

    return (
      <>
        {tracked}
        <span id="empty" />
        <span id="nullish">
          {null}
          {void 0}
        </span>
        {literal}
        <GroupedChildren>
          {"A"}
          <b>B</b>
          {["C", ["D"]]}
        </GroupedChildren>
        <ArrayConsumer id="array">{sharedChildren}</ArrayConsumer>
        <ArrayConsumer id="spread" {...spread} />
        <span id="override" {...{ children: "ignored" }}>
          G
        </span>
        <ul id="callback" v-for={["H"]}>
          {(item: string) => <li>{item}</li>}
        </ul>
      </>
    );
  });

  return { state, effects, views, receivedProps, receivedArrays, sharedChildren };
}
