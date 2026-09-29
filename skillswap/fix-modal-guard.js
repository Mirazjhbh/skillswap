const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldFunc = `async function openPeerProfileModal(peerId) {`;
const newFunc = `async function openPeerProfileModal(peerId) {
    if (!requireAuth('view full profiles')) return;`;

if (js.includes(oldFunc) && !js.includes("requireAuth('view full profiles')")) {
  js = js.replace(oldFunc, newFunc);
  console.log("openPeerProfileModal patched.");
}

// Check other guards
if (!js.includes("requireAuth('like a post')")) {
  js = js.replace(`async function toggleLike(postId) {`, `async function toggleLike(postId) {\n    if (!requireAuth('like a post')) return;`);
  console.log("toggleLike patched.");
}

if (!js.includes("requireAuth('favorite a profile')")) {
  js = js.replace(`const isFav = btn.classList.contains('favorited');`, `if (!requireAuth('favorite a profile')) return;\n          const isFav = btn.classList.contains('favorited');`);
  console.log("Favorite patched.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
