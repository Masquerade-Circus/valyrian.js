import fs from "fs";
import path from "path";

export function sw(file: string, options = {}) {
  let swfiletemplate = path.resolve(__dirname, "./node.sw.tpl");
  let swTpl = fs.readFileSync(swfiletemplate, "utf8");
  let opt = Object.assign(
    {
      version: "v1::",
      name: "Valyrian.js",
      urls: ["/"],
      debug: false
    },
    options
  );
  let contents = swTpl
    .replace("v1::", "v" + opt.version + "::")
    .replace("Valyrian.js", opt.name)
    .replace("['/']", '["' + opt.urls.join('","') + '"]');

  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }

  fs.writeFileSync(file, contents, "utf8");
}
