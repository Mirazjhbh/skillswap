const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const regex = /function lockWebsiteAccess\(\) \{[\s\S]*?showToast\('Session ended\. SkillSwap locked\.', '.*?'\);\n  \}/m;

const replacement = `function lockWebsiteAccess() {
    stopRealtimePolling();
    localStorage.removeItem('skillswap_token');
    currentUser = null;
    if (userDropdownMenu) userDropdownMenu.classList.remove('show');
    showToast('Logged out successfully.', '??');
    unlockWebsiteAccessAsGuest();
  }`;

if (regex.test(js)) {
  js = js.replace(regex, replacement);
  console.log("lockWebsiteAccess patched.");
} else {
  console.log("lockWebsiteAccess not found.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
