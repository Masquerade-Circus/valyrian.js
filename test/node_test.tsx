import { htmlToHyperscript, icons, inline, render, sw, htmlToDom, domToHtml } from "valyrian.js/node";

import { expect, describe, test as it } from "bun:test";
import fs from "fs";
import path from "path";
import packageJson from "../package.json";
// eslint-disable-next-line no-unused-vars
import { v } from "valyrian.js";

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

  it("should convert tsx to hyperscript by default", async () => {
    const { raw: component } = await inline("./test/utils/component.tsx", { compact: false, noValidate: true });
    const { raw: component2 } = await inline("./test/utils/component.tsx", { compact: true });

    expect(component).toMatch(`
  function Button() {
    return /* @__PURE__ */ v("button", null, "Hello");
  }`);

    expect(component2).toMatch(/function\(\)\{return \w\("button",null,"Hello"\)\}/);
  });

  it("should convert jsx to hyperscript by default", async () => {
    const { raw: component } = await inline("./test/utils/component.jsx", { compact: false });
    const { raw: component2 } = await inline("./test/utils/component.jsx", { compact: true });

    expect(component).toMatch(`
  function Button() {
    return /* @__PURE__ */ v("button", null, "Hello");
  }`);

    expect(component2).toMatch(/function\(\)\{return \w\("button",null,"Hello"\)\}/);
  });
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

    const text =
      allFiles.reduce(
        (acc, file) => `${acc}\n\n/****************** Path: ${file.path} ******************/\n${file.content}`,
        ""
      ) +
      allTestFiles.reduce(
        (acc, file) => `${acc}\n\n/****************** Path: ${file.path} ******************/\n${file.content}`,
        ""
      );

    fs.writeFileSync(".tmp/all-lib-files.ts", text);
  });
});
