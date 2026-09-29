const fs = require("node:fs");
const path = require("node:path");
const dir = process.cwd();

// ==============================================
// 1. PATCH index.html
// ==============================================
let html = fs.readFileSync(path.join(dir, "index.html"), "utf8");

// Change "Instant Guest Access" to "Browse as Guest"
const oldGuestBtn = `<button type="button" class="gateway-demo-link" id="gw-demo-btn">? Instant Guest Access</button>`;
const newGuestBtn = `<button type="button" class="gateway-demo-link" id="gw-demo-btn" style="font-weight: 600; font-size: 14px;">Explore Website as Guest &rarr;</button>`;

if (html.includes("? Instant Guest Access")) {
  html = html.replace(oldGuestBtn, newGuestBtn);
}

// Make sure the auth nav and user profile badge are nicely structured
// They already exist in the HTML, we just need to ensure we can toggle them.

// Add some CSS to index.html or styles.css to ensure modal z-indexes are correct
// Actually, I'll put it in styles.css in step 3.

fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
console.log("index.html patched.");

// ==============================================
// 2. PATCH scripts.js
// ==============================================
let js = fs.readFileSync(path.join(dir, "scripts.js"), "utf8");

// A. Create unlockWebsiteAccessAsGuest
const unlockWebsiteAccessStr = `  async function unlockWebsiteAccess(user, token) {`;
const unlockAsGuestFunc = `  const siteHeaderAuthNav = document.querySelector('#site-header-auth-nav');
  const userProfileBadge = document.querySelector('.user-profile-badge');

  async function unlockWebsiteAccessAsGuest() {
    currentUser = null;
    localStorage.removeItem('skillswap_token');
    
    if (siteHeaderAuthNav) siteHeaderAuthNav.style.display = 'flex';
    if (userProfileBadge) userProfileBadge.style.display = 'none';
    
    authGateway.classList.add('gateway-unlocked');
    mainApp.hidden = false;
    body.classList.remove('modal-open');

    // Only load public data
    await Promise.all([
      loadRegisteredUsersAndRender(),
      loadPlatformStats(),
      loadCommunityPosts(),
      loadReviews()
    ]);
    
    initSwipeFeature();
  }
  
  function requireAuth(actionMsg) {
    if (!currentUser) {
      showToast('Please log in to ' + actionMsg, '??');
      showAuthGateway(false);
      return false;
    }
    return true;
  }
  
  function showAuthGateway(isSignUp = false) {
    authGateway.classList.remove('gateway-unlocked');
    mainApp.hidden = true;
    setGatewayMode(isSignUp);
  }
  
  async function unlockWebsiteAccess(user, token) {`;

if (!js.includes("unlockWebsiteAccessAsGuest()")) {
  js = js.replace(unlockWebsiteAccessStr, unlockAsGuestFunc);
}

// B. Update unlockWebsiteAccess to toggle header elements
const oldHeaderSetup = `    const firstName = (user.full_name || 'Swapper').split(' ')[0];
    if (headerUserName) headerUserName.textContent = firstName;`;
const newHeaderSetup = `    if (siteHeaderAuthNav) siteHeaderAuthNav.style.display = 'none';
    if (userProfileBadge) userProfileBadge.style.display = 'block';

    const firstName = (user.full_name || 'Swapper').split(' ')[0];
    if (headerUserName) headerUserName.textContent = firstName;`;

if (!js.includes("siteHeaderAuthNav.style.display = 'none'")) {
  js = js.replace(oldHeaderSetup, newHeaderSetup);
}

// C. Update handleGuest to call unlockWebsiteAccessAsGuest
const oldHandleGuest = `    if (gwDemoBtn || gwTopDemoBtn) {
      const handleGuest = async () => {
        await api('/api/seed', { method: 'POST' });
        performGoogleAuth('explorer@skillswap.io', 'Alex Chen');
      };
      if (gwDemoBtn) gwDemoBtn.addEventListener('click', handleGuest);
      if (gwTopDemoBtn) gwTopDemoBtn.addEventListener('click', handleGuest);
    }`;
const newHandleGuest = `    if (gwDemoBtn || gwTopDemoBtn) {
      const handleGuest = (e) => {
        e.preventDefault();
        unlockWebsiteAccessAsGuest();
      };
      if (gwDemoBtn) gwDemoBtn.addEventListener('click', handleGuest);
      if (gwTopDemoBtn) gwTopDemoBtn.addEventListener('click', handleGuest);
    }`;

if (js.includes("performGoogleAuth('explorer@skillswap.io', 'Alex Chen');")) {
  js = js.replace(oldHandleGuest, newHandleGuest);
}

// D. Update checkInitialSession
// Actually, let's keep the gateway open on first visit so they see the beautiful landing page,
// but they can click "Explore as Guest".
// If they have no token, just stay on the gateway.
const oldInitSession = `  async function checkInitialSession() {
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

const newInitSession = `  async function checkInitialSession() {
    const token = localStorage.getItem('skillswap_token');
    if (token) {
      const res = await api('/api/auth/me');
      if (res.ok && res.user) {
        unlockWebsiteAccess(res.user, token);
        return;
      } else {
        localStorage.removeItem('skillswap_token');
      }
    } else {
      // Direct access without showing gateway if desired, 
      // but showing gateway is fine since we have a "Browse as Guest" button.
      // Let's just unlock as guest so the user sees the site immediately as requested:
      // "users should not be required to Sign Up or Log In just to visit and view the website"
      unlockWebsiteAccessAsGuest();
    }
  }`;

if (js.includes("const hasVisited = localStorage.getItem('skillswap_has_visited');")) {
  js = js.replace(oldInitSession, newInitSession);
}

// E. Add requireAuth guards to actions
function replaceWithAuthGuard(js, search, guardAction) {
  if (js.includes(search) && !js.includes(`requireAuth('${guardAction}')`)) {
    return js.replace(search, `if (!requireAuth('${guardAction}')) return;\n${search}`);
  }
  return js;
}

// 1. doSwipe
js = js.replace(`  function doSwipe(card, direction) {`, `  function doSwipe(card, direction) {\n    if (!requireAuth('swipe profiles')) { card.style.transform = ''; return; }`);

// 2. Open proposal modal
js = js.replace(`  function openProposalModal({ id, name, teach, learn }) {`, `  function openProposalModal({ id, name, teach, learn }) {\n    if (!requireAuth('propose an exchange')) return;`);

// 3. Open schedule session
js = js.replace(`  function openScheduleSessionModal() {`, `  function openScheduleSessionModal() {\n    if (!requireAuth('schedule a session')) return;`);

// 4. Create post modal
js = js.replace(`  function openCreatePostModal() {`, `  function openCreatePostModal() {\n    if (!requireAuth('create a post')) return;`);

// 5. Open peer profile modal
js = js.replace(`  function openPeerProfileModal(user) {`, `  function openPeerProfileModal(user) {\n    if (!requireAuth('view full profiles')) return;`);

// F. Update lockWebsiteAccess to use showAuthGateway
const oldLock = `  function lockWebsiteAccess() {
    stopRealtimePolling();
    localStorage.removeItem('skillswap_token');
    currentUser = null;
    authGateway.classList.remove('gateway-unlocked');
    mainApp.hidden = true;
    if (userDropdownMenu) userDropdownMenu.classList.remove('show');
    showToast('Session ended. SkillSwap locked.', '??');
  }`;
const newLock = `  function lockWebsiteAccess() {
    stopRealtimePolling();
    localStorage.removeItem('skillswap_token');
    currentUser = null;
    if (userDropdownMenu) userDropdownMenu.classList.remove('show');
    showToast('Logged out successfully.', '??');
    unlockWebsiteAccessAsGuest();
  }`;

if (js.includes("showToast('Session ended. SkillSwap locked.', '??');")) {
  js = js.replace(oldLock, newLock);
}

// G. Update siteNavLoginBtn and siteNavSignupBtn listeners
const oldNavLogin = `  if (siteNavLoginBtn) siteNavLoginBtn.addEventListener('click', () => { lockWebsiteAccess(); setGatewayMode(false); });
  if (siteNavSignupBtn) siteNavSignupBtn.addEventListener('click', () => { lockWebsiteAccess(); setGatewayMode(true); });`;
const newNavLogin = `  if (siteNavLoginBtn) siteNavLoginBtn.addEventListener('click', () => { showAuthGateway(false); });
  if (siteNavSignupBtn) siteNavSignupBtn.addEventListener('click', () => { showAuthGateway(true); });`;

if (js.includes("lockWebsiteAccess(); setGatewayMode(false);")) {
  js = js.replace(oldNavLogin, newNavLogin);
}

// H. Google Sign in should not show generic failure if it fails, or it should 
// But let's check Google custom email logic. It's fine.

fs.writeFileSync(path.join(dir, "scripts.js"), js, "utf8");
console.log("scripts.js patched.");

// ==============================================
// 3. PATCH styles.css
// ==============================================
let css = fs.readFileSync(path.join(dir, "styles.css"), "utf8");

const oldGatewayCSS = `#auth-gateway {
  position: fixed;
  inset: 0;
  z-index: 1000;`;

const newGatewayCSS = `#auth-gateway {
  position: fixed;
  inset: 0;
  z-index: 9999;`; // Ensure it's above everything when shown

if (css.includes("z-index: 1000;") && css.includes("#auth-gateway {")) {
  css = css.replace(oldGatewayCSS, newGatewayCSS);
}

// Ensure header nav is styled
if (!css.includes(".site-header-auth-nav {")) {
  css += `\n
/* Header Auth Nav enhancements */
.site-header-auth-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.site-nav-auth-btn {
  background: transparent;
  border: 1px solid var(--royal-blue);
  color: var(--royal-blue);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.site-nav-login:hover {
  background: rgba(59,102,255,0.08);
}
.site-nav-signup {
  background: var(--royal-blue);
  color: white;
}
.site-nav-signup:hover {
  background: var(--royal-blue-deep);
  transform: translateY(-1px);
}
/* Allow auth gateway to act as modal overlay */
#auth-gateway {
  backdrop-filter: blur(8px);
}
.gateway-grid-bg {
  opacity: 0.7; /* Make the background slightly transparent so site is visible underneath */
}
`;
}

fs.writeFileSync(path.join(dir, "styles.css"), css, "utf8");
console.log("styles.css patched.");
