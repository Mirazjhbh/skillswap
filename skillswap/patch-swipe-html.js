const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const oldBtns = `            <!-- Swipe Action Buttons (Static underneath deck) -->
            <div class="swipe-action-btns">
              <button class="swipe-btn swipe-left-btn" id="swipe-left-btn" aria-label="Pass">
                &#10005;
              </button>
              <button class="swipe-btn swipe-right-btn" id="swipe-right-btn" aria-label="Connect">
                &#128153;
              </button>
            </div>
            <div class="swipe-hint-row">
              <span class="swipe-hint-left">o~ Swipe Left to Pass</span>
              <span class="swipe-hint-right">Swipe Right to Connect o~</span>
            </div>`;

const newBtns = `            <!-- Swipe Action Buttons (Static underneath deck) -->
            <div class="swipe-action-btns">
              <button class="swipe-btn swipe-btn-small" id="swipe-view-btn" aria-label="View Profile" title="View Profile">
                &#128100;
              </button>
              <button class="swipe-btn swipe-left-btn" id="swipe-left-btn" aria-label="Skip" title="Cross/Skip">
                &#10005;
              </button>
              <button class="swipe-btn swipe-right-btn" id="swipe-like-btn" aria-label="Like/Love" title="Like/Love">
                &#128150;
              </button>
              <button class="swipe-btn swipe-btn-small" id="swipe-connect-btn" aria-label="Connect" title="Connect">
                &#129309;
              </button>
            </div>
            <div class="swipe-hint-row">
              <span class="swipe-hint-left">o~ Left to Skip</span>
              <span class="swipe-hint-right">Right to Like/Connect o~</span>
            </div>`;

if (html.includes('<div class="swipe-action-btns">')) {
  // Use regex to replace the block
  const regex = /<!-- Swipe Action Buttons \(Static underneath deck\) -->[\s\S]*?<\/div>[\s]*<\/div>/m;
  if (regex.test(html)) {
    html = html.replace(regex, newBtns);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log("HTML patched with new buttons.");
  } else {
    console.log("Regex for HTML buttons failed.");
  }
} else {
  console.log("Swipe action btns not found in HTML.");
}
