import { describe, expect, test as it } from "bun:test";
import fs from "fs";
import path from "path";
import { Vnode, fragment, v } from "valyrian.js";
import { Fragment, jsx, jsxs } from "valyrian.js/jsx-runtime";
import { jsxDEV } from "valyrian.js/jsx-dev-runtime";

describe("JSX runtime", () => {
  it("creates Vnode with structural key field", () => {
    const vnode = new Vnode("div", { id: "x" }, [], "row-1");

    expect(vnode.key).toBe("row-1");
    expect(vnode.tag).toBe("div");
    expect(vnode.props).toEqual({ id: "x" });
    expect(vnode.children).toEqual([]);
  });

  it("uses the structural constructor order after key", () => {
    const dom = { nodeType: 1 } as any;
    const vnode = new Vnode("div", { id: "x" }, [], "row-1", dom, true);

    expect(vnode.key).toBe("row-1");
    expect(vnode.dom).toBe(dom);
    expect(vnode.isSVG).toBeTrue();
  });

  it("rejects the legacy constructor positional layout at type level", () => {
    const fixtureRoot = path.join(process.cwd(), ".tmp/vnode-constructor-signature");

    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fs.mkdirSync(fixtureRoot, { recursive: true });

    fs.writeFileSync(
      path.join(fixtureRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ESNext",
            paths: {
              "valyrian.js": ["../../lib/index.ts"],
              "valyrian.js/*": ["../../lib/*/index.ts"]
            },
            strict: true,
            noEmit: true,
            types: ["node"]
          },
          include: ["./index.ts"]
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(fixtureRoot, "index.ts"),
      [
        'import { Vnode } from "valyrian.js";',
        "const dom = { nodeType: 1 } as any;",
        'const vnode = new Vnode("div", { id: "x" }, [], dom, true);',
        "void vnode;"
      ].join("\n")
    );

    const result = Bun.spawnSync(["bunx", "tsc", "-p", fixtureRoot], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe"
    });

    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).not.toBe(0);
    expect(output).toContain("error TS2345");
    expect(output).toContain("Argument of type 'boolean' is not assignable to parameter of type 'DomElement'");
  }, 20000);

  it("exports Fragment as the shared fragment sentinel", () => {
    const runtimeFragment = Fragment as unknown;
    const sharedFragment = fragment as unknown;

    expect(runtimeFragment).toBe(sharedFragment);
    expect(typeof runtimeFragment).toBe("symbol");
    expect(runtimeFragment).toBe(Symbol.for("valyrian.fragment"));
  });

  it("creates vnodes with jsx/jsxs automatic runtime semantics", () => {
    const singleChild = jsx("button", { class: "primary", children: "Hello" }, "cta");
    const multipleChildren = jsxs(Fragment, {
      children: [new Vnode("span", null, ["one"]), new Vnode("span", null, ["two"])]
    });

    expect(singleChild).toBeInstanceOf(Vnode);
    expect(singleChild.tag).toBe("button");
    expect(singleChild.key).toBe("cta");
    expect(singleChild.props).toEqual({ class: "primary" });
    expect("key" in (singleChild.props || {})).toBeFalse();
    expect(singleChild.children).toEqual(["Hello"]);

    expect(multipleChildren).toBeInstanceOf(Vnode);
    expect(multipleChildren.tag).toBe(fragment);
    expect(multipleChildren.props).toEqual({});
    expect(multipleChildren.children).toHaveLength(2);
  });

  it("does not leak children into props when children is undefined", () => {
    const vnode = jsx("div", { id: "sample", children: undefined });

    expect(vnode).toBeInstanceOf(Vnode);
    expect(vnode.props).toEqual({ id: "sample" });
    expect("children" in (vnode.props || {})).toBeFalse();
    expect(vnode.children).toEqual([]);
  });

  it("keeps nested child arrays for flatTree instead of flattening in constructors", () => {
    const child = jsx("span", { children: "A" });
    const vnode = jsxs("div", { children: [[child], "tail"] });

    expect(vnode.children).toEqual([[child], "tail"]);
  });

  it("stores key on vnode.key for jsx runtime", () => {
    const vnode = jsx("li", { class: "row", children: "A" }, 7);

    expect(vnode.key).toBe(7);
    expect(vnode.props).toEqual({ class: "row" });
    expect("key" in (vnode.props || {})).toBeFalse();
    expect(vnode.children).toEqual(["A"]);
  });

  it("builds automatic runtime vnodes without delegating to v()", () => {
    const jsxRuntimeSource = fs.readFileSync(path.join(process.cwd(), "lib/jsx-runtime/index.ts"), "utf8");
    const jsxDevRuntimeSource = fs.readFileSync(path.join(process.cwd(), "lib/jsx-dev-runtime/index.ts"), "utf8");

    expect(jsxRuntimeSource).not.toMatch(/\bv\s*\(/);
    expect(jsxDevRuntimeSource).not.toMatch(/\bjsx\s*\(/);
    expect(jsxDevRuntimeSource).not.toMatch(/\bv\s*\(/);
  });

  it("keeps jsx hot path inline without structural key fallback helpers", () => {
    const jsxRuntimeSource = fs.readFileSync(path.join(process.cwd(), "lib/jsx-runtime/index.ts"), "utf8");
    const jsxDevRuntimeSource = fs.readFileSync(path.join(process.cwd(), "lib/jsx-dev-runtime/index.ts"), "utf8");
    const runtimeSource = fs.readFileSync(path.join(process.cwd(), "lib/index.ts"), "utf8");

    expect(jsxRuntimeSource).not.toMatch(/\bcreateAutomaticVNode\b/);
    expect(jsxRuntimeSource).not.toMatch(/\.key\b/);
    expect(jsxRuntimeSource).toMatch(/export function jsxs\(/);
    expect(jsxRuntimeSource).not.toMatch(/export const jsxs = jsx/);
    expect(jsxDevRuntimeSource).not.toMatch(/createAutomaticVNode/);
    expect(runtimeSource).not.toMatch(/\bforwardStructuralKey\b/);
  });

  it("jsxDEV keeps toolchain signature and structural key semantics", () => {
    const vnode = jsxDEV("button", { class: "primary", children: "Hello" }, "k", false, undefined, undefined);

    expect(vnode).toBeInstanceOf(Vnode);
    expect(vnode.tag).toBe("button");
    expect(vnode.key).toBe("k");
    expect(vnode.props).toEqual({ class: "primary" });
    expect("key" in (vnode.props || {})).toBeFalse();
    expect("children" in (vnode.props || {})).toBeFalse();
    expect(vnode.children).toEqual(["Hello"]);
  });

  it("keeps Fragment as sentinel and does not create a fragment kind", () => {
    const vnode = jsxs(Fragment, {
      children: [jsx("span", { children: "A" }), jsx("span", { children: "B" })]
    });

    expect(vnode.tag).toBe(fragment);
    expect(vnode).not.toHaveProperty("kind");
  });

  it("accepts jsxDEV automatic-runtime signature", () => {
    const fixtureRoot = path.join(process.cwd(), ".tmp/jsx-dev-runtime-signature");

    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fs.mkdirSync(fixtureRoot, { recursive: true });

    fs.writeFileSync(
      path.join(fixtureRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ESNext",
            paths: {
              "valyrian.js": ["../../lib/index.ts"],
              "valyrian.js/*": ["../../lib/*/index.ts"]
            },
            strict: true,
            noEmit: true,
            types: ["node"]
          },
          include: ["./index.ts"]
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(fixtureRoot, "index.ts"),
      [
        'import { jsxDEV } from "valyrian.js/jsx-dev-runtime";',
        'const vnode = jsxDEV("button", { children: "Hello" }, "k", false, undefined, undefined);',
        "void vnode;"
      ].join("\n")
    );

    const result = Bun.spawnSync(["bunx", "tsc", "-p", fixtureRoot], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe"
    });

    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(0);
    expect(output).toBe("");
  }, 20000);
});

describe("v/jsx runtime conformance", () => {
  it("keeps v and jsx semantically aligned for tag, props, children and explicit key", () => {
    const byV = v("button", { key: "cta", class: "primary" }, "Hello");
    const byJsx = jsx("button", { class: "primary", children: "Hello" }, "cta");

    expect(byV.key).toBe("cta");
    expect(byJsx.key).toBe("cta");
    expect("key" in (byV.props || {})).toBeFalse();
    expect("key" in (byJsx.props || {})).toBeFalse();

    expect({
      tag: byJsx.tag,
      props: byJsx.props,
      children: byJsx.children,
      key: byJsx.key
    }).toEqual({
      tag: byV.tag,
      props: byV.props,
      children: byV.children,
      key: byV.key
    });
  });

  it("keeps Fragment as the shared sentinel without introducing kind metadata", () => {
    const vnode = jsx(Fragment, { children: "content" });

    expect(vnode.tag).toBe(fragment);
    expect(vnode).not.toHaveProperty("kind");
  });
});
