const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const oldBtns = `<div class="swipe-action-btns">
              <button type="button" class="swipe-btn swipe-left-btn" id="swipe-left-btn" title="Pass">
                <span>&#10005;</span>
              </button>
              <button type="button" class="swipe-btn swipe-right-btn" id="swipe-right-btn" title="Connect">
                <span>&#10084;</span>
              </button>
            </div>
            <div class="swipe-hint-row">
              <span class="swipe-hint-left">&#8592; Pass</span>
              <span class="swipe-hint-right">Connect &#8594;</span>
            </div>`;

const newBtns = `<div class="swipe-action-btns">
              <button type="button" class="swipe-btn swipe-btn-small" id="swipe-view-btn" title="View Profile" style="font-size: 20px; color: var(--ink);">
                <span>&#128100;</span>
              </button>
              <button type="button" class="swipe-btn swipe-left-btn" id="swipe-left-btn" title="Cross/Skip">
                <span>&#10005;</span>
              </button>
              <button type="button" class="swipe-btn swipe-right-btn" id="swipe-like-btn" title="Like/Love">
                <span>&#10084;</span>
              </button>
              <button type="button" class="swipe-btn swipe-btn-small" id="swipe-connect-btn" title="Connect" style="font-size: 20px; color: var(--royal-blue);">
                <span>&#129309;</span>
              </button>
            </div>
            <div class="swipe-hint-row">
              <span class="swipe-hint-left">&#8592; Cross/Skip</span>
              <span class="swipe-hint-right">Like/Love &#8594;</span>
            </div>`;

if (html.includes('<div class="swipe-action-btns">')) {
  // Try plain string replacement since we copied exactly
  if (html.includes(oldBtns)) {
    html = html.replace(oldBtns, newBtns);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log("HTML patched with new buttons (exact match).");
  } else {
    console.log("Exact match failed. Attempting regex.");
    const regex = /<div class="swipe-action-btns">[\s\S]*?<\/div>[\s]*<div class="swipe-hint-row">[\s\S]*?<\/div>/m;
    if (regex.test(html)) {
      html = html.replace(regex, newBtns);
      fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
      console.log("HTML patched via regex.");
    }
  }
}
