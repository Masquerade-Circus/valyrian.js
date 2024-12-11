import fs from "fs";
import { htmlToHyperscript } from "./tree-adapter";

export interface IconsOptions {
  iconsPath: string | null;
  linksViewPath: string | null;
  logging: boolean;

  // favicons options
  path: string;
  appName?: string;
  appDescription?: string;
  developerName?: string;
  developerURL?: string;
  dir?: "auto" | "ltr" | "rtl" | string;
  lang?: string;
  background?: string;
  theme_color?: string;
  display?: "browser" | "standalone" | string;
  orientation?: "any" | "portrait" | "landscape" | string;
  start_url?: string;
  version?: string;
  icons: {
    android: boolean;
    appleIcon: boolean;
    appleStartup: boolean;
    coast: boolean;
    favicons: boolean;
    firefox: boolean;
    windows: boolean;
    yandex: boolean;
  };
}

export async function icons(source: string, configuration?: IconsOptions) {
  const options = {
    ...icons.options,
    ...(configuration || {})
  };

  if (options.iconsPath) {
    options.iconsPath = options.iconsPath.replace(/\/$/gi, "") + "/";
  }

  if (options.linksViewPath) {
    options.linksViewPath = options.linksViewPath.replace(/\/$/gi, "") + "/";
  }

  const { favicons } = await import("favicons");

  try {
    const response = await favicons(source, options);

    if (options.iconsPath) {
      for (const i in response.images) {
        fs.writeFileSync(options.iconsPath + response.images[i].name, response.images[i].contents);
      }

      for (const i in response.files) {
        fs.writeFileSync(options.iconsPath + response.files[i].name, response.files[i].contents);
      }
    }

    if (options.linksViewPath) {
      const html = `
  function Links(){
    return ${htmlToHyperscript(response.html.join(""))};
  }
  
  Links.default = Links;
  module.exports = Links;
        `;

      fs.writeFileSync(`${options.linksViewPath}/links.js`, html);
    }
  } catch (err) {
    process.stdout.write((err as any).status + "\n"); // HTTP error code (e.g. `200`) or `null`
    process.stdout.write((err as any).name + "\n"); // Error name e.g. "API Error"
    process.stdout.write((err as any).message + "\n"); // Error description e.g. "An unknown error has occurred"
  }
}

icons.options = {
  iconsPath: null,
  linksViewPath: null,

  // favicons options
  path: "",
  appName: null,
  appDescription: null,
  developerName: null,
  developerURL: null,
  dir: "auto",
  lang: "en-US",
  background: "#fff",
  theme_color: "#fff",
  display: "standalone",
  orientation: "any",
  start_url: "/",
  version: "1.0",
  logging: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    firefox: false,
    windows: true,
    yandex: false // Create Yandex browser icon. `boolean`
  }
} as unknown as IconsOptions;
