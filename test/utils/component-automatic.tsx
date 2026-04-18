/** @jsxRuntime automatic */
/** @jsxImportSource valyrian.js */

import { mount } from "valyrian.js";

export default function Button() {
  return (
    <>
      <button>Hello</button>
      <span>Automatic runtime</span>
    </>
  );
}

mount("div", Button);
