const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

const oldVars = `const swipeLeftBtn = document.querySelector('#swipe-left-btn');
  const swipeRightBtn = document.querySelector('#swipe-right-btn');
  const swipeResetBtn = document.querySelector('#swipe-reset-btn');`;

const newVars = `const swipeLeftBtn = document.querySelector('#swipe-left-btn');
  const swipeRightBtn = document.querySelector('#swipe-like-btn');
  const swipeViewBtn = document.querySelector('#swipe-view-btn');
  const swipeConnectBtn = document.querySelector('#swipe-connect-btn');
  const swipeResetBtn = document.querySelector('#swipe-reset-btn');`;

js = js.replace(oldVars, newVars);

const oldHandlersRegex = /if \(swipeLeftBtn\) \{[\s\S]*?doSwipe\(top, 'right'\);\n\s*\}\);\n\s*\}/m;

const newHandlers = `if (swipeLeftBtn) {
    swipeLeftBtn.addEventListener('click', () => {
      const top = swipeDeck ? swipeDeck.querySelector('.swipe-card:last-child') : null;
      if (top) doSwipe(top, 'left');
    });
  }

  if (swipeRightBtn) {
    swipeRightBtn.addEventListener('click', () => {
      const top = swipeDeck ? swipeDeck.querySelector('.swipe-card:last-child') : null;
      if (top) doSwipe(top, 'right');
    });
  }

  if (swipeViewBtn) {
    swipeViewBtn.addEventListener('click', () => {
      const topCard = swipeDeck ? swipeDeck.querySelector('.swipe-card:last-child') : null;
      if (topCard && topCard.dataset.userId) {
        openPeerProfileModal(topCard.dataset.userId);
      }
    });
  }

  if (swipeConnectBtn) {
    swipeConnectBtn.addEventListener('click', () => {
      const topCard = swipeDeck ? swipeDeck.querySelector('.swipe-card:last-child') : null;
      if (topCard && topCard.dataset.userId) {
        if (!requireAuth('propose an exchange')) return;
        const user = allRegisteredUsers.find(u => String(u.id) === topCard.dataset.userId);
        if (user) {
          openProposalModal({
            id: user.id,
            name: user.full_name,
            teach: user.skills_teach,
            learn: user.skills_learn
          });
        }
      }
    });
  }`;

if (oldHandlersRegex.test(js)) {
  js = js.replace(oldHandlersRegex, newHandlers);
  console.log("Handlers replaced!");
} else {
  console.log("Regex failed.");
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
