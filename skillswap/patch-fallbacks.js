const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

// Replace fallbacks that use random faces with default-avatar.svg
js = js.replace(/\|\| 'saif\.jpg'/g, "|| 'default-avatar.svg'");
js = js.replace(/\|\| 'mim\.jpg'/g, "|| 'default-avatar.svg'");
js = js.replace(/\|\| 'miraz\.jpg'/g, "|| 'default-avatar.svg'");
js = js.replace(/\|\| 'person 2\.jpeg'/g, "|| 'default-avatar.svg'");
js = js.replace(/src=\\'mim\.jpg\\'/g, "src=\\'default-avatar.svg\\'");

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
console.log("Fallbacks updated to default-avatar.svg.");
