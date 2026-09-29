const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

// 1. PATCH server.js
let serverJs = fs.readFileSync(path.join(dir, "server.js"), "utf8");
serverJs = serverJs.replace(/avatar_url: avatar_url \|\| 'person 2\.jpeg'/g, "avatar_url: avatar_url || 'default-avatar.svg'");
serverJs = serverJs.replace(/avatar_url: avatar_url \|\| 'saif\.jpg'/g, "avatar_url: avatar_url || 'default-avatar.svg'");
fs.writeFileSync(path.join(dir, "server.js"), serverJs, "utf8");

// 2. PATCH scripts.js (Google Auth)
let scriptsJs = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");
const oldGoogleAuth = `        body: JSON.stringify({
          email,
          full_name: formattedName,
          google_id: \`g_\${email}\`,
          avatar_url: 'saif.jpg'
        })`;
const newGoogleAuth = `        body: JSON.stringify({
          email,
          full_name: formattedName,
          google_id: \`g_\${email}\`,
          avatar_url: null
        })`;
if (scriptsJs.includes(oldGoogleAuth)) {
  scriptsJs = scriptsJs.replace(oldGoogleAuth, newGoogleAuth);
  fs.writeFileSync(path.join(dir, "scripts.js"), scriptsJs, "utf8");
  console.log("scripts.js updated for google auth.");
}
