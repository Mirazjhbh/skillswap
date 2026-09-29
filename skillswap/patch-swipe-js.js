const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

// 1. Fix buildSwipeCard to include onerror for the image
const oldImg = `const avatarHtml = user.avatar_url
      ? '<img class="swipe-card-img" src="' + escapeHtml(user.avatar_url) + '" alt="' + escapeHtml(user.full_name) + '" loading="lazy" />'
      : '<div class="swipe-card-img-placeholder">&#129489;&#8205;&#128187;</div>';`;
      
const newImg = `const avatarHtml = user.avatar_url
      ? '<img class="swipe-card-img" src="' + escapeHtml(user.avatar_url) + '" alt="' + escapeHtml(user.full_name) + '" loading="lazy" onerror="this.onerror=null;this.src=\\'mim.jpg\\';" />'
      : '<div class="swipe-card-img-placeholder">&#129489;&#8205;&#128187;</div>';`;
      
if (js.includes(oldImg)) {
  js = js.replace(oldImg, newImg);
  console.log("buildSwipeCard patched with onerror fallback.");
} else {
  // Regex fallback
  const regexImg = /const avatarHtml = user\.avatar_url[\s\S]*?'<div class="swipe-card-img-placeholder">/;
  if (regexImg.test(js)) {
    js = js.replace(regexImg, `const avatarHtml = user.avatar_url
      ? '<img class="swipe-card-img" src="' + escapeHtml(user.avatar_url) + '" alt="' + escapeHtml(user.full_name) + '" loading="lazy" onerror="this.onerror=null;this.src=\\'mim.jpg\\';" />'
      : '<div class="swipe-card-img-placeholder">`);
    console.log("buildSwipeCard patched via regex.");
  }
}

// 2. Attach new handlers
// First, find swipeRightBtn
const oldVars = `const swipeLeftBtn = document.querySelector('#swipe-left-btn');
  const swipeRightBtn = document.querySelector('#swipe-right-btn');
  const swipeResetBtn = document.querySelector('#swipe-reset-btn');`;

const newVars = `const swipeLeftBtn = document.querySelector('#swipe-left-btn');
  const swipeRightBtn = document.querySelector('#swipe-like-btn');
  const swipeViewBtn = document.querySelector('#swipe-view-btn');
  const swipeConnectBtn = document.querySelector('#swipe-connect-btn');
  const swipeResetBtn = document.querySelector('#swipe-reset-btn');`;

if (js.includes(oldVars)) {
  js = js.replace(oldVars, newVars);
}

const oldHandlers = `  if (swipeLeftBtn) swipeLeftBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard) doSwipe(topCard, 'left');
  });

  if (swipeRightBtn) swipeRightBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard) doSwipe(topCard, 'right');
  });`;

const newHandlers = `  if (swipeLeftBtn) swipeLeftBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard) doSwipe(topCard, 'left');
  });

  if (swipeRightBtn) swipeRightBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard) doSwipe(topCard, 'right');
  });

  if (swipeViewBtn) swipeViewBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard && topCard.dataset.userId) {
      openPeerProfileModal(topCard.dataset.userId);
    }
  });

  if (swipeConnectBtn) swipeConnectBtn.addEventListener('click', () => {
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
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
  });`;

if (js.includes("if (swipeRightBtn) swipeRightBtn.addEventListener")) {
  const handlerRegex = /if \(swipeLeftBtn\) swipeLeftBtn\.addEventListener[\s\S]*?doSwipe\(topCard, 'right'\);\n  \}\);/m;
  if (handlerRegex.test(js)) {
    js = js.replace(handlerRegex, newHandlers);
    console.log("Swipe handlers patched.");
  }
}

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
console.log("scripts.js updated.");
