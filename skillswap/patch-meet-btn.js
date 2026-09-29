const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

const oldForm = `<form class="chat-compose" id="chat-form">
                <label class="sr-only" for="chat-input">Write a message</label>
                <input id="chat-input" placeholder="Write a message to your partner..." autocomplete="off" />
                <button type="submit" aria-label="Send message">&#128640;</button>
              </form>`;

const newForm = `<form class="chat-compose" id="chat-form" style="display:flex; gap: 8px;">
                <button type="button" id="chat-meet-btn" class="button" aria-label="Share Google Meet Link" title="Share Google Meet Link" style="padding: 0 14px; background: rgba(59, 102, 255, 0.1); border: 1px solid var(--royal-blue); border-radius: 20px; font-size: 18px;">
                  &#128249;
                </button>
                <label class="sr-only" for="chat-input">Write a message</label>
                <input id="chat-input" placeholder="Write a message to your partner..." autocomplete="off" style="flex:1;" />
                <button type="submit" aria-label="Send message">&#128640;</button>
              </form>`;

if (html.includes('<form class="chat-compose" id="chat-form">')) {
  html = html.replace(oldForm, newForm);
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  console.log("HTML Meet Button added.");
} else {
  // Try regex
  const rx = /<form class="chat-compose" id="chat-form">[\s\S]*?<\/form>/m;
  if (rx.test(html)) {
    html = html.replace(rx, newForm);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log("HTML Meet Button added via regex.");
  } else {
    console.log("Could not find chat-form in HTML");
  }
}

// Now add the JS functionality in scripts.js
let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const jsHook = `  const chatForm = document.querySelector('#chat-form');`;
const newJsHook = `  const chatForm = document.querySelector('#chat-form');
  const chatMeetBtn = document.querySelector('#chat-meet-btn');

  if (chatMeetBtn) {
    chatMeetBtn.addEventListener('click', () => {
      if (chatInput) {
        // Generate a random meet link suffix for demo
        const randomId = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
        const meetUrl = \`https://meet.google.com/\${randomId}\`;
        chatInput.value = \`Let's join a live call! \${meetUrl}\`;
        chatInput.focus();
        showToast('Google Meet link generated!', '??');
      }
    });
  }`;

if (js.includes(jsHook) && !js.includes("chatMeetBtn.addEventListener")) {
  js = js.replace(jsHook, newJsHook);
  fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
  console.log("Meet JS handler added.");
} else {
  console.log("Could not add JS handler.");
}
