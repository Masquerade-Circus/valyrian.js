/** @jsxRuntime automatic */
/** @jsxImportSource valyrian.js */

import { mount } from "valyrian.js";

export default function ButtonDev() {
  return (
    <>
      <button>Hello</button>
      <span>Automatic dev runtime</span>
    </>
  );
}

mount("div", ButtonDev);
