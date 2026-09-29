const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let scriptsJs = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");
scriptsJs = scriptsJs.replace(/avatar_url: 'saif.jpg'/g, "avatar_url: null");
fs.writeFileSync(path.join(dir, "scripts.js"), scriptsJs, "utf8");
