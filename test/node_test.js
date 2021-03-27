import "../lib";

import expect from "expect";
import fs from "fs";
import nodePlugin from "../plugins/node";
import packageJson from "../package.json";

v.usePlugin(nodePlugin);

describe("Node test", () => {
  it("Get hyperscript string from html", () => {
    let html = '<body><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</body>';

    let dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("body", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<html><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</html>';

    dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("html", {}, [
    v("head", {}, [
      v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, [])
    ]),
    v("body", {}, [
      "Hello world"
    ])
  ])
]`);

    html = '<!DOCTYPE html><html><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</html>';

    dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  "<!DOCTYPE html>",
  v("html", {}, [
    v("head", {}, [
      v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, [])
    ]),
    v("body", {}, [
      "Hello world"
    ])
  ])
]`);

    html = '<head><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</head>';

    dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("head", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, [])
  ])
]`);

    html = '<div><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</div>';

    dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("div", {}, [
    v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
    "Hello world"
  ])
]`);

    html = '<link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world';

    dom = v.htmlToHyperscript(html);

    expect(dom).toEqual(`[
  v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}, []),
  "Hello world"
]`);
  });

  it("Should create a service worker file", async () => {
    let file = ".tmp/sw.js";
    await v.sw(file, {
      name: "Test",
      version: packageJson.version,
      urls: ["/", "/hello"]
    });

    expect(fs.existsSync(file)).toBeTruthy();
  });

  // NOTE: This test will take some time between 30 and 60 seconds
  it("Should generate icons, manifest.json and a links component", async () => {
    let favicons = {
      iconsPath: ".tmp/", // Path to the generated icons
      linksViewPath: ".tmp/", // Path to the generated links file

      // favicons options
      path: "/icons/", // Path for overriding default icons path. `string`
      appName: packageJson.name, // Your application's name. `string`
      appShortName: packageJson.name, // Your application's short_name. `string`. Optional. If not set, appName will be used. `string`
      appDescription: packageJson.description, // Your application's description. `string`
      developerName: "Christian César Robledo López (Masquerade Circus)", // Your (or your developer's) name. `string`
      developerURL: "http://masquerade-circus.net",
      dir: "auto",
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

    await v.icons("./assets/icon.png", favicons);
    expect(fs.existsSync(".tmp/favicon.ico")).toBeTruthy();
    expect(fs.existsSync(".tmp/links.js")).toBeTruthy();
    expect(fs.existsSync(".tmp/manifest.json")).toBeTruthy();
  });

  it("should remove unused css", async () => {
    let html = "<body><span>Hello world</span></body>";
    let css = `
span{display:block;}
span.hello{display: inline-block}
    `;

    await v.inline.css({ raw: css });
    let cleanCss = await v.inline.uncss([html]);

    expect(cleanCss).toEqual("span{display:block}");
  });

  it.only("should inline js", async () => {
    v.inline.extensions("ts");
    // await v.inline.ts("./lib/index.ts.old", { outputOptions: { minify: true } });
    await v.inline.ts("./lib/index.ts", { outputOptions: { compact: true } });
    await v.inline.js("./lib/index-old.js", { outputOptions: { compact: true } });
    console.log(v.inline.ts()[0].raw.length);
    // console.log(v.inline.ts()[1].raw.length);
    console.log(v.inline.js()[0].raw.length);

    // console.log(v.inline.ts()[1].raw);
    // fs.writeFileSync("./dist/valyrian.lite.js", v.inline.ts()[1].raw);

    // expect(v.inline.ts()[0].raw.length).toBeLessThan(5115);

    let compiled = fs.readFileSync("./dist/valyrian.min.js", "utf-8");
    console.log(compiled.length);
  });
});
