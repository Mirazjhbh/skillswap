const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldStr = `  async function checkInitialSession() {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      const res = await api('/api/auth/me');
      if (res.ok && res.user) {
        unlockWebsiteAccess(res.user, token);
        return;
      } else {
        localStorage.removeItem('skillswap_token');
      }
    }
    // Keep Login as default - users can switch to Sign Up themselves
    // Show a helpful hint for truly first-time visitors
    const hasVisited = localStorage.getItem('skillswap_has_visited');
    if (!hasVisited) {
      localStorage.setItem('skillswap_has_visited', '1');
      // Flash the Sign Up tab to draw attention, then return to Login
      if (gwCardSubtitle) {
        gwCardSubtitle.innerHTML = 'New here? <button type="button" class="gateway-toggle-link" style="display:inline;font-size:inherit;" onclick="document.querySelector(\\'#tab-signup\\').click()">Create a free account</button> — or log in below.';
      }
    }
  }`;

const newStr = `  async function checkInitialSession() {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      const res = await api('/api/auth/me');
      if (res.ok && res.user) {
        unlockWebsiteAccess(res.user, token);
        return;
      } else {
        localStorage.removeItem('skillswap_token');
      }
    }
    
    // Default to Guest Access immediately!
    unlockWebsiteAccessAsGuest();
  }`;

// Use regex to replace everything from "async function checkInitialSession() {" to the end of the function.
const regex = /async function checkInitialSession\(\) \{[\s\S]*?(?=checkInitialSession\(\);)/m;

const replacement = `async function checkInitialSession() {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      const res = await api('/api/auth/me');
      if (res.ok && res.user) {
        unlockWebsiteAccess(res.user, token);
        return;
      } else {
        localStorage.removeItem('skillswap_token');
      }
    }
    
    // Default to Guest Access immediately!
    unlockWebsiteAccessAsGuest();
  }

  `;

js = js.replace(regex, replacement);

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
console.log("checkInitialSession patched.");
