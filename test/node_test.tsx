import { htmlToHyperscript, icons, inline, render, sw, htmlToDom, domToHtml, ServerStorage } from "valyrian.js/node";
import { SwRuntimeManager } from "valyrian.js/sw";

import { expect, describe, test as it } from "bun:test";
import fs from "fs";
import path from "path";
import packageJson from "../package.json";
import { trust, v } from "valyrian.js";

describe("Node test", () => {
  it("Get hyperscript string from html", () => {
    let html = '<body><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</body>';

    let dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("body", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<html><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</html>';

    dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("html", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<!DOCTYPE html><html><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</html>';

    dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  "<!DOCTYPE html>",
  v("html", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<head><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</head>';

    dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("head", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<div><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</div>';

    dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("div", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world';

    dom = htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
  "Hello world"
]`);
  });

  it("Get html from hyperscript", () => {
    const Component = () => <div>Hello world</div>;

    expect(render(<Component />)).toEqual("<div>Hello world</div>");
  });

  it("SSR escapes normal text nodes", () => {
    const payload = "<img src=x onerror=alert(1)>";

    expect(render(<div>{payload}</div>)).toEqual("<div>&lt;img src=x onerror=alert(1)&gt;</div>");
  });

  it("SSR escapes attributes", () => {
    const payload = '"><script>alert(1)</script>';

    expect(render(<div title={payload} />)).toEqual(
      '<div title="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"></div>'
    );
  });

  it("SSR preserves inline script text", () => {
    expect(render(<script>{`if (a < b) mount(myApp)`}</script>)).toEqual(
      "<script>if (a < b) mount(myApp)</script>"
    );
  });

  it("SSR preserves inline style text", () => {
    expect(render(<style>{`.x > .y { color: red; }`}</style>)).toEqual(
      "<style>.x > .y { color: red; }</style>"
    );
  });

  it("SSR preserves trusted raw HTML", () => {
    expect(render(<div>{trust("<span>Hello <strong>world</strong></span>")}</div>)).toEqual(
      "<div><span>Hello <strong>world</strong></span></div>"
    );
  });

  it("SSR renders HTML directly when using v-html", () => {
    const svg = '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10H0z"></path></svg>';

    expect(render(<div v-html={svg} />)).toEqual(`<div>${svg}</div>`);
  });

  it("should apply styles correctly", () => {
    const image =
      "https://media.istockphoto.com/id/1283852667/es/foto/toque-de-musgo-fresco-en-el-bosque.jpg?s=1024x1024&amp;w=is&amp;k=20&amp;c=ASa_AG8uP5Di7azXgJraSA6ME7fbLB0GX4YT_OzCARI=";
    const html = render(<div style={`background-image: url(${image});`}>Hello world</div>);
    const dom = htmlToDom(
      // eslint-disable-next-line max-len
      '<div style="background-image: url(https://media.istockphoto.com/id/1283852667/es/foto/toque-de-musgo-fresco-en-el-bosque.jpg?s=1024x1024&amp;w=is&amp;k=20&amp;c=ASa_AG8uP5Di7azXgJraSA6ME7fbLB0GX4YT_OzCARI=);">Hello world</div>'
    );
    const result =
      // eslint-disable-next-line max-len
      '<div style="background-image: url(https://media.istockphoto.com/id/1283852667/es/foto/toque-de-musgo-fresco-en-el-bosque.jpg?s=1024x1024&amp;w=is&amp;k=20&amp;c=ASa_AG8uP5Di7azXgJraSA6ME7fbLB0GX4YT_OzCARI=);">Hello world</div>';
    expect(html).toEqual(result);
    expect(domToHtml(dom)).toEqual(result);
  });

  it("Should create a service worker file", async () => {
    const file = ".tmp/sw.js";
    await sw(file, {
      name: "Test",
      version: packageJson.version,
      urls: ["/", "/hello"]
    });

    expect(fs.existsSync(file)).toBeTruthy();
  });

  it("should create sw runtime and react to update lifecycle with mocks", async () => {
    const originalNavigator = (globalThis as any).navigator;
    const originalWindow = (globalThis as any).window;

    const postedMessages: any[] = [];
    const listeners: Record<string, Function> = {};
    const swListeners: Record<string, Function> = {};

    const installingWorker = {
      state: "installing",
      addEventListener(event: string, cb: Function) {
        listeners[event] = cb;
      }
    } as any;

    const waitingWorker = {
      postMessage(msg: any) {
        postedMessages.push(msg);
      }
    } as any;

    const registration = {
      waiting: null,
      installing: installingWorker,
      addEventListener(event: string, cb: Function) {
        listeners[event] = cb;
      },
      update: async () => {},
      unregister: async () => true
    } as any;

    (globalThis as any).navigator = {
      serviceWorker: {
        controller: {},
        register: async () => registration,
        addEventListener(event: string, cb: Function) {
          swListeners[event] = cb;
        }
      }
    };

    const reloadCalls: number[] = [];
    (globalThis as any).window = {
      location: {
        reload() {
          reloadCalls.push(1);
        }
      }
    };

    const runtime = await new SwRuntimeManager({
      strategy: "manual",
      runtime: {
        isNodeJs: false,
        navigator: (globalThis as any).navigator,
        window: (globalThis as any).window
      }
    }).init();
    const seen: string[] = [];
    runtime.on("registered", () => seen.push("registered"));
    runtime.on("updateavailable", () => seen.push("updateavailable"));
    runtime.on("updated", () => seen.push("updated"));

    // Trigger registration update lifecycle
    listeners.updatefound();
    installingWorker.state = "installed";
    registration.waiting = waitingWorker;
    listeners.statechange();

    expect(runtime.state.updateAvailable).toBeTrue();
    runtime.applyUpdate();
    expect(postedMessages).toEqual([{ type: "SKIP_WAITING" }]);

    swListeners.controllerchange();
    expect(runtime.state.updateAvailable).toBeFalse();
    expect(reloadCalls.length).toEqual(0);

    await runtime.checkForUpdate();
    expect(await runtime.unregister()).toBeTrue();
    expect(seen).toContain("updateavailable");
    expect(seen).toContain("updated");

    (globalThis as any).navigator = originalNavigator;
    (globalThis as any).window = originalWindow;
  });

  it("should keep sessionStorage isolated per ServerStorage context", async () => {
    sessionStorage.clear();

    const getSessionValueInsideContext = (value: string, waitMs: number) =>
      new Promise<string | null>((resolve) => {
        ServerStorage.run(() => {
          sessionStorage.setItem("request-id", value);
          setTimeout(() => {
            resolve(sessionStorage.getItem("request-id"));
          }, waitMs);
        });
      });

    const [first, second] = await Promise.all([
      getSessionValueInsideContext("first-request", 20),
      getSessionValueInsideContext("second-request", 5)
    ]);

    expect(first).toEqual("first-request");
    expect(second).toEqual("second-request");
    expect(sessionStorage.getItem("request-id")).toEqual(null);
  });

  // NOTE: This test will take some time between 30 and 60 seconds
  it("Should generate icons, manifest.json and a links component", async () => {
    const favicons = {
      iconsPath: ".tmp/", // Path to the generated icons
      linksViewPath: ".tmp/", // Path to the generated links file

      // favicons options
      path: "/icons/", // Path for overriding default icons path. `string`
      appName: packageJson.name, // Your application's name. `string`
      appShortName: packageJson.name, // Your application's short_name. `string`. Optional. If not set, appName will be used. `string`
      appDescription: packageJson.description, // Your application's description. `string`
      developerName: "Christian César Robledo López (Masquerade Circus)", // Your (or your developer's) name. `string`
      developerURL: "http://masquerade-circus.net",
      dir: "auto", // Primary text direction for name, short_name, and description
      lang: "en-US",
      background: "#fff", // Background colour for flattened icons. `string`
      theme_color: "#fff", // Theme color user for example in Android's task switcher. `string`
      appleStatusBarStyle: "black-translucent", // Style for Apple status bar: "black-translucent", "default", "black". `string`
      display: "standalone", // Android display: "browser" or "standalone". `string`
      orientation: "any", // Android orientation: "any" "portrait" or "landscape". `string`
      scope: "/", // set of URLs that the browser considers within your app
      start_url: "/", // Start URL when launching the application from a device. `string`
      version: packageJson.version, // Your application's version number. `number`
      logging: false, // Print logs to console? `boolean`
      pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
      loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
      icons: {
        // Platform Options:
        // - offset - offset in percentage
        // - background:
        //   * false - use default
        //   * true - force use default, e.g. set background for Android icons
        //   * color - set background for the specified icons
        //   * mask - apply mask in order to create circle icon (applied by default for firefox). `boolean`
        //   * overlayGlow - apply glow effect after mask has been applied (applied by default for firefox). `boolean`
        //   * overlayShadow - apply drop shadow after mask has been applied .`boolean`
        //
        android: true, // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        coast: false, // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        favicons: true, // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        firefox: false, // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
        yandex: false // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }` or an array of sources
      }
    };

    await icons("./assets/icon.png", favicons);
    expect(fs.existsSync(".tmp/favicon.ico")).toBeTruthy();
    expect(fs.existsSync(".tmp/links.js")).toBeTruthy();
    expect(fs.existsSync(".tmp/manifest.webmanifest")).toBeTruthy();
  });

  it("should remove unused css", async () => {
    const html = "<body><span>Hello world</span></body>";
    const css = `
span{display:block;}
span.hello{display: inline-block}
    `;
    const cleanCss = await inline.uncss([html], css);

    expect(cleanCss).toEqual("span{display:block}");
  });

  it("should inline js", async () => {
    const { raw: indexTs } = await inline("./lib/index.ts", { compact: true, noValidate: true });
    // const { raw: indexOld } = await inline("./bench/index-old.js", { compact: true });
    // eslint-disable-next-line no-console
    console.log(indexTs.length);
    // eslint-disable-next-line no-console
    // console.log(indexOld.length);
  });

  it("should compile tsx with automatic jsx runtime imports by default", async () => {
    const { raw: component } = await inline("./test/utils/component-automatic.tsx", {
      compact: false,
      bundle: false
    });

    expect(component).toMatch(/from\s+"valyrian\.js\/jsx-runtime"/);
    expect(component).toMatch(/\bjsxs\(Fragment\b/);
    expect(component).toMatch(/\bjsx\("button",\s*\{\s*children:\s*"Hello"\s*\}\)/);
    expect(component).toMatch(/\bjsx\("span",\s*\{\s*children:\s*"Automatic runtime"\s*\}\)/);
    expect(component).not.toContain('import { v } from "valyrian.js"');
    expect(component).not.toContain("v.fragment");
    expect(component).not.toMatch(/\bcreateAutomaticVNode\b/);
    expect(component).not.toMatch(/(?:const|var) Fragment\s*=/);
  });

  it("should not log inline tsc debug output during normal execution", async () => {
    const originalConsoleLog = console.log;
    const calls: unknown[][] = [];

    console.log = (...args: unknown[]) => {
      calls.push(args);
    };

    try {
      await inline("./test/utils/component-automatic.tsx", {
        compact: false,
        bundle: false
      });
    } finally {
      console.log = originalConsoleLog;
    }

    expect(calls.some((args) => args[0] === "tsc")).toBeFalse();
  });

  it("should compile tsx dev output with jsxDEV from valyrian.js/jsx-dev-runtime", async () => {
    const { raw: component } = await inline("./test/utils/component-automatic-dev.tsx", {
      compact: false,
      bundle: false,
      esbuild: {
        jsxDev: true
      }
    });

    expect(component).toMatch(/from\s+"valyrian\.js\/jsx-dev-runtime"/);
    expect(component).toMatch(/\bjsxDEV\(/);
    expect(component).not.toContain('from "valyrian.js/jsx-runtime"');
    expect(component).not.toContain("v.fragment");
    expect(component).not.toMatch(/\bcreateAutomaticVNode\b/);
  });

  it("should typecheck automatic jsx runtime for an external consumer package", () => {
    const fixtureRoot = path.join(process.cwd(), ".tmp/external-consumer");
    const packageTarballRoot = path.join(fixtureRoot, "packed");
    const packageRoot = path.join(fixtureRoot, "node_modules/valyrian.js");
    const consumerDistRoot = path.join(fixtureRoot, "dist");

    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    fs.mkdirSync(packageTarballRoot, { recursive: true });
    fs.mkdirSync(packageRoot, { recursive: true });
    const packResult = Bun.spawnSync(["npm", "pack", "--json", "--pack-destination", packageTarballRoot], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe"
    });
    const packOutput = `${packResult.stdout.toString()}${packResult.stderr.toString()}`;

    expect(packResult.exitCode).toBe(0);

    const [{ filename }] = JSON.parse(packResult.stdout.toString()) as Array<{ filename: string }>;
    const tarballPath = path.join(packageTarballRoot, filename);
    const unpackResult = Bun.spawnSync(["tar", "-xzf", tarballPath, "-C", packageRoot, "--strip-components=1"], {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe"
    });

    expect(unpackResult.exitCode).toBe(0);

    fs.writeFileSync(
      path.join(fixtureRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            target: "ESNext",
            jsx: "react-jsx",
            jsxImportSource: "valyrian.js",
            strict: true,
            rootDir: ".",
            outDir: "./dist",
            types: []
          },
          include: ["./index.tsx"]
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(fixtureRoot, "index.tsx"),
      [
        'import { mount } from "valyrian.js";',
        'import { Fragment, jsxs } from "valyrian.js/jsx-runtime";',
        "",
        'const directFragment = jsxs(Fragment, { children: ["Packed", "consumer"] });',
        'void directFragment;',
        "",
        "function App() {",
        "  return (",
        "    <>",
        '      <main>Hello</main>',
        '      <footer>Automatic runtime</footer>',
        "    </>",
        "  );",
        "}",
        "",
        'mount("#app", App);'
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

    const emittedConsumerJs = fs.readFileSync(path.join(consumerDistRoot, "index.js"), "utf8");
    const resolutionResult = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        [
          'await import("valyrian.js/jsx-runtime");',
          'await import("valyrian.js/jsx-dev-runtime");',
          'console.log("resolved");'
        ].join("\n")
      ],
      {
        cwd: fixtureRoot,
        stdout: "pipe",
        stderr: "pipe"
      }
    );
    const publishedFiles = [
      "dist/jsx-runtime/index.js",
      "dist/jsx-runtime/index.mjs",
      "dist/jsx-dev-runtime/index.js",
      "dist/jsx-dev-runtime/index.mjs",
      "dist/lib/jsx-runtime/index.d.ts",
      "dist/lib/jsx-dev-runtime/index.d.ts"
    ].map((relativePath) => path.join(packageRoot, relativePath));
    const jsxRuntimeTypes = fs.readFileSync(path.join(packageRoot, "dist/lib/jsx-runtime/index.d.ts"), "utf8");
    const jsxDevRuntimeTypes = fs.readFileSync(path.join(packageRoot, "dist/lib/jsx-dev-runtime/index.d.ts"), "utf8");
    const jsxRuntimeJs = fs.readFileSync(path.join(packageRoot, "dist/jsx-runtime/index.js"), "utf8");
    const runtimeSurfaceResult = Bun.spawnSync(
      [
        process.execPath,
        "-e",
        [
          'const runtime = await import("valyrian.js/jsx-runtime");',
          'console.log(Object.keys(runtime).sort().join(","));'
        ].join("\n")
      ],
      {
        cwd: fixtureRoot,
        stdout: "pipe",
        stderr: "pipe"
      }
    );

    expect(packOutput).toContain(filename);
    expect(emittedConsumerJs).toMatch(/(?:from|require\()\s*["']valyrian\.js\/jsx-runtime["']/);
    expect(emittedConsumerJs).not.toContain("v.fragment");
    expect(emittedConsumerJs).not.toContain("valyrian_js_1.v");
    expect(emittedConsumerJs).not.toMatch(/\bcreateAutomaticVNode\b/);
    expect(jsxRuntimeJs).not.toMatch(/\bcreateAutomaticVNode\b/);
    expect(jsxRuntimeTypes).not.toMatch(/\bcreateAutomaticVNode\b/);
    expect(resolutionResult.exitCode).toBe(0);
    expect(resolutionResult.stdout.toString()).toContain("resolved");
    expect(resolutionResult.stderr.toString()).toBe("");
    expect(runtimeSurfaceResult.exitCode).toBe(0);
    expect(runtimeSurfaceResult.stderr.toString()).toBe("");
    expect(runtimeSurfaceResult.stdout.toString().trim()).toBe("Fragment,jsx,jsxs");
    for (const publishedFile of publishedFiles) {
      expect(fs.existsSync(publishedFile)).toBeTrue();
    }
    expect(jsxDevRuntimeTypes).toContain("export declare function jsxDEV(");
  }, 20000);
});

describe("All lib files", () => {
  it.skip("should get all lib files", async () => {
    function readFilesRecursivelySync(directory: string) {
      let filesList: { path: string; content: string }[] = [];
      const files = fs.readdirSync(directory, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(directory, file.name);

        if (file.isDirectory()) {
          // Si es un directorio, llamamos recursivamente a la función
          filesList = filesList.concat(readFilesRecursivelySync(fullPath));
        } else {
          // Si es un archivo, leemos su contenido
          try {
            const content = fs.readFileSync(fullPath, "utf-8"); // Leer archivo en UTF-8
            filesList.push({ path: fullPath, content });
          } catch (error) {
            console.error(`Error leyendo el archivo: ${fullPath}`, error);
          }
        }
      }
      // Sort by depth and then by name
      return filesList.sort((a, b) => {
        const depthA = a.path.split("/").length;
        const depthB = b.path.split("/").length;
        if (depthA === depthB) {
          return a.path.localeCompare(b.path);
        }
        return depthA - depthB;
      });
    }

    const allFiles = readFilesRecursivelySync("./lib");
    const allTestFiles = readFilesRecursivelySync("./test");
    const allDocsFiles = readFilesRecursivelySync("./docs");

    const text =
      allFiles.reduce(
        (acc, file) => `${acc}\n\n/****************** Path: ${file.path} ******************/\n${file.content}`,
        ""
      ) +
      allTestFiles.reduce(
        (acc, file) => `${acc}\n\n/****************** Path: ${file.path} ******************/\n${file.content}`,
        ""
      ) +
      allDocsFiles.reduce(
        (acc, file) => `${acc}\n\n/****************** Path: ${file.path} ******************/\n${file.content}`,
        ""
      );

    const docsText = allDocsFiles.reduce(
      (acc, file) => `${acc}\n\n____________________________________________\n\n${file.content}`,
      ""
    );

    fs.writeFileSync(".tmp/docs-files.md", docsText);

    fs.writeFileSync(".tmp/all-files.ts", text);
  });
});
