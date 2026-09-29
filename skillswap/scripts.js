/**
 * SkillSwap Platform - Dynamic Client Core & Living Animations
 * Professional Peer-to-Peer Knowledge Exchange
 * Fully connected to persistent SQLite Backend API
 */

(() => {
  'use strict';

  // -------------------------------------------------------------
  // DOM Elements & Core State
  // -------------------------------------------------------------
  const body = document.body;
  const authGateway = document.querySelector('#auth-gateway');
  const mainApp = document.querySelector('#main-app');
  const toast = document.querySelector('#toast');
  const toastMessage = document.querySelector('#toast-message');
  let toastTimer;

  // Global State
  let currentUser = null;
  let allRegisteredUsers = [];
  let userConversations = [];
  let activeConversationId = null;
  let activeConversationPeer = null;
  let activeFeedCategory = 'all';
  let chatPollInterval = null;
  let notifPollInterval = null;

  // -------------------------------------------------------------
  // Toast Notification System
  // -------------------------------------------------------------
  function showToast(message, icon = '✓') {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    const iconEl = toast.querySelector('span');
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // -------------------------------------------------------------
  // REST API Client
  // -------------------------------------------------------------
  async function api(endpoint, options = {}) {
    const token = localStorage.getItem('skillswap_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      return { ok: false, error: 'Network or server connection error.' };
    }
  }

  // -------------------------------------------------------------
  // 1. PARTICLES & GLOWING WAVES CANVAS
  // -------------------------------------------------------------
  const canvas = document.querySelector('#synapse-canvas');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let waveTime = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PALETTE = [
    { r: 59,  g: 102, b: 255 }, // Royal Blue
    { r: 96,  g: 165, b: 250 }, // Sky/Cyan
    { r: 139, g: 92,  b: 246 }, // Vivid Purple
    { r: 168, g: 85,  b: 247 }, // Neon Violet
    { r: 16,  g: 185, b: 129 }  // Emerald accent
  ];

  class ElegantNode {
    constructor() {
      this.reset();
      this.x = Math.random() * (canvasWidth || window.innerWidth);
      this.y = Math.random() * (canvasHeight || window.innerHeight);
    }

    reset() {
      this.x = Math.random() * (canvasWidth || window.innerWidth);
      this.y = Math.random() * (canvasHeight || window.innerHeight);
      this.vx = (Math.random() - 0.5) * 0.28;
      this.vy = (Math.random() - 0.5) * 0.28;
      this.radius = Math.random() * 2.5 + 1.2;
      this.baseAlpha = Math.random() * 0.45 + 0.22;
      this.alpha = this.baseAlpha;
      this.phase = Math.random() * Math.PI * 2;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    update() {
      this.phase += 0.012;
      this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.16;
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -30) this.x = canvasWidth + 30;
      if (this.x > canvasWidth + 30) this.x = -30;
      if (this.y < -30) this.y = canvasHeight + 30;
      if (this.y > canvasHeight + 30) this.y = -30;
    }

    draw(isDark) {
      if (!ctx) return;
      const alphaVal = Math.max(0.05, Math.min(1, this.alpha * (isDark ? 0.95 : 0.7)));

      ctx.save();
      const glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3.2);
      glowGrad.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alphaVal})`);
      glowGrad.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.min(1, alphaVal * 1.4)})`;
      ctx.fill();
      ctx.restore();
    }
  }

  let nodes = [];
  const NODE_COUNT = 38;

  function initCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push(new ElegantNode());
    }
  }

  function renderGlowingWaves(isDark) {
    if (!ctx) return;
    waveTime += 0.007;
    const baseH = canvasHeight * 0.74;
    const step = 20;

    // Wave 1
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x = 0; x <= canvasWidth + step; x += step) {
      const y = baseH + Math.sin(x * 0.0022 + waveTime) * 34 + Math.cos(x * 0.0011 + waveTime * 0.7) * 16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();
    const grad1 = ctx.createLinearGradient(0, baseH - 40, 0, canvasHeight);
    grad1.addColorStop(0, isDark ? 'rgba(59, 102, 255, 0.12)' : 'rgba(59, 102, 255, 0.06)');
    grad1.addColorStop(1, 'rgba(59, 102, 255, 0)');
    ctx.fillStyle = grad1;
    ctx.fill();
    ctx.restore();

    // Wave 2
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x = 0; x <= canvasWidth + step; x += step) {
      const y = (baseH + 30) + Math.sin(x * 0.0018 + waveTime * 0.85 + 1.8) * 38 + Math.sin(x * 0.003 + waveTime * 0.5) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();
    const grad2 = ctx.createLinearGradient(0, baseH, 0, canvasHeight);
    grad2.addColorStop(0, isDark ? 'rgba(139, 92, 246, 0.10)' : 'rgba(139, 92, 246, 0.05)');
    grad2.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = grad2;
    ctx.fill();
    ctx.restore();
  }

  function renderElegantCanvas() {
    if (!ctx || prefersReducedMotion) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const isDark = body.dataset.theme === 'dark';

    renderGlowingWaves(isDark);

    const maxDist = 135;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * (isDark ? 0.22 : 0.12);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${nodes[i].color.r}, ${nodes[i].color.g}, ${nodes[i].color.b}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      n.update();
      n.draw(isDark);
    });

    requestAnimationFrame(renderElegantCanvas);
  }

  if (canvas) {
    initCanvas();
    window.addEventListener('resize', initCanvas, { passive: true });
    if (!prefersReducedMotion) renderElegantCanvas();
  }

  // -------------------------------------------------------------
  // 2. REAL-TIME CALENDAR ENGINES
  // -------------------------------------------------------------
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const gwCalTitle = document.querySelector('#gw-cal-title');
  const gwCalDays = document.querySelector('#gw-cal-days');
  const gwCalPrev = document.querySelector('#gw-cal-prev');
  const gwCalNext = document.querySelector('#gw-cal-next');

  let weekOffset = 0;

  function renderGatewayWeekCalendar() {
    if (!gwCalTitle || !gwCalDays) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));

    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth();
    const todayDay = todayDate.getDate();

    gwCalTitle.textContent = `${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()}`;

    const currentDayOfWeek = targetDate.getDay();
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - currentDayOfWeek);

    gwCalDays.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const isToday = dayDate.getFullYear() === todayYear &&
                      dayDate.getMonth() === todayMonth &&
                      dayDate.getDate() === todayDay;

      const dayCell = document.createElement('span');
      dayCell.className = `cal-day-num${isToday ? ' is-today' : ''}`;
      dayCell.textContent = dayDate.getDate();
      dayCell.setAttribute('title', `${MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}, ${dayDate.getFullYear()}`);

      dayCell.addEventListener('click', () => {
        gwCalDays.querySelectorAll('.cal-day-num').forEach(d => d.classList.remove('is-today'));
        dayCell.classList.add('is-today');
        gwCalTitle.textContent = `${MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}, ${dayDate.getFullYear()}`;
        showToast(`Date selected: ${MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}`, '📅');
      });

      gwCalDays.appendChild(dayCell);
    }
  }

  if (gwCalPrev) gwCalPrev.addEventListener('click', () => { weekOffset--; renderGatewayWeekCalendar(); });
  if (gwCalNext) gwCalNext.addEventListener('click', () => { weekOffset++; renderGatewayWeekCalendar(); });
  renderGatewayWeekCalendar();

  // App Monthly Calendar
  const appCalTitle = document.querySelector('#app-cal-title');
  const appCalDates = document.querySelector('#app-cal-dates');
  const appCalPrev = document.querySelector('#app-cal-prev');
  const appCalNext = document.querySelector('#app-cal-next');

  let appCalMonth = new Date().getMonth();
  let appCalYear = new Date().getFullYear();

  function renderAppMonthCalendar() {
    if (!appCalTitle || !appCalDates) return;
    appCalTitle.textContent = `${MONTH_NAMES[appCalMonth]} ${appCalYear}`;

    const realToday = new Date();
    const realYear = realToday.getFullYear();
    const realMonth = realToday.getMonth();
    const realDay = realToday.getDate();

    const daysInMonth = new Date(appCalYear, appCalMonth + 1, 0).getDate();
    const firstDayIndex = (new Date(appCalYear, appCalMonth, 1).getDay() + 6) % 7;
    const prevMonthDays = new Date(appCalYear, appCalMonth, 0).getDate();

    const cells = [];
    for (let i = firstDayIndex; i > 0; i--) {
      cells.push(`<span class="muted">${prevMonthDays - i + 1}</span>`);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = appCalYear === realYear && appCalMonth === realMonth && d === realDay;
      const hasSession = d === 18 || d === 25;
      const hasRequest = d === 24;
      const classes = [];
      if (isToday) classes.push('is-today');
      if (hasSession) classes.push('has-session');
      if (hasRequest) classes.push('has-request');

      const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
      cells.push(`<span${classAttr} data-day="${d}">${d}</span>`);
    }
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= trailing; d++) {
      cells.push(`<span class="muted">${d}</span>`);
    }
    appCalDates.innerHTML = cells.join('');

    appCalDates.querySelectorAll('span:not(.muted)').forEach((cell) => {
      cell.addEventListener('click', () => {
        appCalDates.querySelectorAll('span').forEach((c) => c.classList.remove('is-today'));
        cell.classList.add('is-today');
        const d = cell.dataset.day;
        showToast(`Schedule for ${MONTH_NAMES[appCalMonth]} ${d}, ${appCalYear}`, '📅');
      });
    });
  }

  if (appCalPrev) {
    appCalPrev.addEventListener('click', () => {
      appCalMonth--;
      if (appCalMonth < 0) { appCalMonth = 11; appCalYear--; }
      renderAppMonthCalendar();
    });
  }
  if (appCalNext) {
    appCalNext.addEventListener('click', () => {
      appCalMonth++;
      if (appCalMonth > 11) { appCalMonth = 0; appCalYear++; }
      renderAppMonthCalendar();
    });
  }
  renderAppMonthCalendar();

  // -------------------------------------------------------------
  // 3. AUTHENTICATION & GATEWAY LOGIC
  // -------------------------------------------------------------
  const gatewayAuthForm = document.querySelector('#gateway-auth-form');
  const gwCardTitle = document.querySelector('#gateway-card-title');
  const gwCardSubtitle = document.querySelector('#gateway-card-subtitle');
  const gwSubmitBtn = document.querySelector('#gw-submit-btn');
  const gwModeToggle = document.querySelector('#gw-mode-toggle');
  const gwFooterPrompt = document.querySelector('#gw-footer-prompt');
  const tabLogin = document.querySelector('#tab-login');
  const tabSignup = document.querySelector('#tab-signup');
  const siteNavLoginBtn = document.querySelector('#site-nav-login-btn');
  const siteNavSignupBtn = document.querySelector('#site-nav-signup-btn');
  const gwTopDemoBtn = document.querySelector('#gw-top-demo-btn');
  const gwDemoBtn = document.querySelector('#gw-demo-btn');
  const passStrengthMeter = document.querySelector('#pass-strength-meter');
  const strengthBarFill = document.querySelector('#strength-bar-fill');
  const strengthVal = document.querySelector('#strength-val');
  const fieldSignupName = document.querySelector('#field-signup-name');
  const fieldSignupSkill = document.querySelector('#field-signup-skill');
  const gwNameInput = document.querySelector('#gw-name-input');
  const gwEmailInput = document.querySelector('#gw-email-input');
  const gwPassInput = document.querySelector('#gw-pass-input');
  const gwPassToggle = document.querySelector('#gw-pass-toggle');
  const gwSkillInput = document.querySelector('#gw-skill-input');
  const gwGoogleBtn = document.querySelector('#gw-google-btn');
  const gwGoogleLabel = document.querySelector('#gw-google-label');
  const gwAuthError = document.querySelector('#gw-auth-error');
  const gwAuthErrorText = document.querySelector('#gw-auth-error-text');

  const userMenuBtn = document.querySelector('#user-menu-btn');
  const userDropdownMenu = document.querySelector('#user-dropdown-menu');
  const appLogoutBtn = document.querySelector('#app-logout-btn');
  const headerUserName = document.querySelector('#header-user-name');
  const headerUserAvatar = document.querySelector('#header-user-avatar');
  const dropdownUserName = document.querySelector('#dropdown-user-name');
  const dropdownUserEmail = document.querySelector('#dropdown-user-email');

  let isSignUpMode = false;

  function clearAuthError() {
    if (gwAuthError) gwAuthError.hidden = true;
  }

  function showAuthError(msg) {
    if (gwAuthError && gwAuthErrorText) {
      gwAuthErrorText.textContent = msg;
      gwAuthError.hidden = false;
      gwAuthError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      showToast(msg, '⚠️');
    }
  }

  function setGatewayMode(signup) {
    isSignUpMode = signup;
    clearAuthError();

    if (tabLogin && tabSignup) {
      tabLogin.classList.toggle('active', !signup);
      tabSignup.classList.toggle('active', signup);
      tabLogin.setAttribute('aria-selected', !signup);
      tabSignup.setAttribute('aria-selected', signup);
    }

    if (isSignUpMode) {
      gwCardTitle.textContent = 'Create Your Free Account';
      gwCardSubtitle.textContent = 'Trade skills, build freelance careers, and grow with real peers.';
      gwSubmitBtn.textContent = 'Create Your Free Account →';
      gwFooterPrompt.textContent = 'Already have an account?';
      gwModeToggle.textContent = 'Log in';
      if (fieldSignupName) fieldSignupName.style.display = 'flex';
      if (fieldSignupSkill) fieldSignupSkill.style.display = 'flex';
      if (passStrengthMeter) passStrengthMeter.style.display = 'block';
      // Hide demo hint in signup mode
      const demoCreds = document.querySelector('#demo-creds-hint');
      if (demoCreds) demoCreds.hidden = true;
      if (gwNameInput) {
        gwNameInput.required = true;
        setTimeout(() => gwNameInput.focus(), 80);
      }
      if (gwGoogleLabel) gwGoogleLabel.textContent = 'Sign up with Google';
    } else {
      gwCardTitle.textContent = 'Welcome Back!';
      gwCardSubtitle.textContent = 'Login to your account or create a new one to get started.';
      gwSubmitBtn.textContent = 'Login';
      gwFooterPrompt.textContent = "Don't have an account?";
      gwModeToggle.textContent = 'Sign up free';
      if (fieldSignupName) fieldSignupName.style.display = 'none';
      if (fieldSignupSkill) fieldSignupSkill.style.display = 'none';
      if (passStrengthMeter) passStrengthMeter.style.display = 'none';
      if (gwNameInput) gwNameInput.required = false;
      // Show demo hint in login mode
      const demoCreds = document.querySelector('#demo-creds-hint');
      if (demoCreds) demoCreds.hidden = false;
      if (gwGoogleLabel) gwGoogleLabel.textContent = 'Sign in with Google';
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => setGatewayMode(false));
  if (tabSignup) tabSignup.addEventListener('click', () => setGatewayMode(true));
  if (gwModeToggle) gwModeToggle.addEventListener('click', () => setGatewayMode(!isSignUpMode));

  function updatePasswordStrength(val) {
    if (!strengthBarFill || !strengthVal) return;
    const len = val.length;
    let score = 0;
    if (len >= 6) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (len >= 10 || /[^A-Za-z0-9]/.test(val)) score++;

    strengthBarFill.className = 'strength-bar-fill';
    strengthVal.className = 'strength-val';

    if (len === 0) {
      strengthBarFill.style.width = '0%';
      strengthVal.textContent = 'Enter password';
    } else if (score <= 1) {
      strengthBarFill.classList.add('weak');
      strengthVal.classList.add('weak');
      strengthVal.textContent = 'Weak';
    } else if (score === 2) {
      strengthBarFill.classList.add('medium');
      strengthVal.classList.add('medium');
      strengthVal.textContent = 'Good';
    } else {
      strengthBarFill.classList.add('strong');
      strengthVal.classList.add('strong');
      strengthVal.textContent = 'Strong (Secure)';
    }
  }

  if (gwPassInput) {
    gwPassInput.addEventListener('input', () => {
      clearAuthError();
      if (isSignUpMode) updatePasswordStrength(gwPassInput.value);
    });
  }

  if (gwPassToggle && gwPassInput) {
    gwPassToggle.addEventListener('click', () => {
      const isPass = gwPassInput.type === 'password';
      gwPassInput.type = isPass ? 'text' : 'password';
      gwPassToggle.textContent = isPass ? '🙈' : '👁';
    });
  }

  // -------------------------------------------------------------
  // 4. UNLOCK WEBSITE & LOAD REAL DATA
  // -------------------------------------------------------------
  const siteHeaderAuthNav = document.querySelector('#site-header-auth-nav');
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
  
  async function unlockWebsiteAccess(user, token) {
    currentUser = user;
    if (token) localStorage.setItem('skillswap_token', token);

    if (siteHeaderAuthNav) siteHeaderAuthNav.style.display = 'none';
    if (userProfileBadge) userProfileBadge.style.display = 'block';

    const firstName = (user.full_name || 'Swapper').split(' ')[0];
    if (headerUserName) headerUserName.textContent = firstName;
    if (headerUserAvatar && user.avatar_url) headerUserAvatar.src = user.avatar_url;
    if (dropdownUserName) dropdownUserName.textContent = user.full_name;
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;

    const myProfileName = document.querySelector('#my-profile-name');
    const myProfileRole = document.querySelector('#my-profile-role');
    const myProfileAvatar = document.querySelector('#my-profile-avatar-img');

    if (myProfileName) myProfileName.textContent = user.full_name;
    if (myProfileRole) myProfileRole.textContent = user.role_title || 'Skill Swapper • Open for Mutual Exchanges';
    if (myProfileAvatar && user.avatar_url) myProfileAvatar.src = user.avatar_url;

    updateGoalsDisplay({
      fullname: user.full_name,
      role: user.role_title || 'Skill Swapper',
      bio: user.bio || '',
      avatar: user.avatar_url || 'default-avatar.svg',
      learning: user.skills_learn || 'Next.js & AI Agents',
      project: user.project_interest || 'Building an AI Developer Platform',
      teach: user.skills_teach || 'UI/UX Design, Figma',
      cadence: user.cadence || 'Weekly Google Meet Sessions'
    });

    authGateway.classList.add('gateway-unlocked');
    mainApp.hidden = false;
    body.classList.remove('modal-open');

    // Start Real-time Polling
    startRealtimePolling();

    // Load dynamic real database sections
    await Promise.all([
      loadRegisteredUsersAndRender(),
      loadPlatformStats(),
      loadHeroMatches(),
      loadProposals(),
      loadSessions(),
      loadConversations(),
      loadCommunityPosts(),
      loadNotifications(),
      loadReviews()
    ]);

    // Initialize swipe feature after main data loads
    initSwipeFeature();

    showToast(`Welcome, ${firstName}!`, '🎉');
  }

  function lockWebsiteAccess() {
    stopRealtimePolling();
    localStorage.removeItem('skillswap_token');
    currentUser = null;
    if (userDropdownMenu) userDropdownMenu.classList.remove('show');
    showToast('Logged out successfully.', '??');
    unlockWebsiteAccessAsGuest();
  }

  if (appLogoutBtn) appLogoutBtn.addEventListener('click', lockWebsiteAccess);
  if (siteNavLoginBtn) siteNavLoginBtn.addEventListener('click', () => { showAuthGateway(false); });
  if (siteNavSignupBtn) siteNavSignupBtn.addEventListener('click', () => { showAuthGateway(true); });

  // -------------------------------------------------------------
  // 5. REAL-TIME POLLING ENGINE
  // -------------------------------------------------------------
  function startRealtimePolling() {
    stopRealtimePolling();
    // Poll messages every 3 seconds for live chat feel
    chatPollInterval = setInterval(() => {
      if (activeConversationId) {
        loadConversationMessages(activeConversationId, true);
      }
    }, 3000);

    // Poll notifications every 8 seconds
    notifPollInterval = setInterval(() => {
      if (currentUser) {
        loadNotifications(true);
      }
    }, 8000);
  }

  function stopRealtimePolling() {
    if (chatPollInterval) clearInterval(chatPollInterval);
    if (notifPollInterval) clearInterval(notifPollInterval);
  }

  // -------------------------------------------------------------
  // 6. GATEWAY FORM SUBMIT (Sign Up / Login)
  // -------------------------------------------------------------
  if (gatewayAuthForm) {
    gatewayAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAuthError();

      const email = gwEmailInput ? gwEmailInput.value.trim() : '';
      const password = gwPassInput ? gwPassInput.value : '';
      const fullName = (gwNameInput && gwNameInput.value.trim()) || '';
      const skillTeach = (gwSkillInput && gwSkillInput.value.trim()) || '';

      if (!email) {
        showAuthError('Please enter your email address.');
        if (gwEmailInput) gwEmailInput.focus();
        return;
      }
      if (!password) {
        showAuthError('Please enter your password.');
        if (gwPassInput) gwPassInput.focus();
        return;
      }
      if (isSignUpMode && !fullName) {
        showAuthError('Please enter your full name to create an account.');
        if (gwNameInput) gwNameInput.focus();
        return;
      }

      gwSubmitBtn.disabled = true;
      gwSubmitBtn.textContent = 'Connecting...';

      if (isSignUpMode) {
        const res = await api('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            full_name: fullName || email.split('@')[0],
            skills_teach: skillTeach || 'UI/UX Design, Figma',
            skills_learn: 'Web Development, React'
          })
        });

        gwSubmitBtn.disabled = false;
        gwSubmitBtn.textContent = 'Create Your Free Account →';

        if (res.ok && res.user && res.token) {
          unlockWebsiteAccess(res.user, res.token);
          showToast('Account created and saved in SQLite database!', '✨');
        } else {
          showAuthError(res.error || 'Failed to create account. Please try again.');
        }
      } else {
        const res = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        gwSubmitBtn.disabled = false;
        gwSubmitBtn.textContent = 'Login';

        if (res.ok && res.user && res.token) {
          unlockWebsiteAccess(res.user, res.token);
        } else {
          const errMsg = res.error || 'Invalid email or password.';
          // Suggest sign up if it looks like account doesn't exist
          if (errMsg.includes('Invalid email') || errMsg.includes('not found')) {
            showAuthError(errMsg + ' Don\'t have an account? Click "Sign Up Free" above.');
          } else {
            showAuthError(errMsg);
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 7. GOOGLE & GUEST SIGN-IN
  // -------------------------------------------------------------
  const googleLoginModal = document.querySelector('#google-login-modal');
  const googleModalClose = document.querySelector('#google-modal-close');
  const googleAccAlex = document.querySelector('#google-acc-alex');
  const googleCustomEmail = document.querySelector('#google-custom-email');
  const googleCustomSubmit = document.querySelector('#google-custom-submit-btn');

  function openGoogleModal() {
    if (!googleLoginModal) return;
    googleLoginModal.classList.add('open');
    googleLoginModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closeGoogleModal() {
    if (!googleLoginModal) return;
    googleLoginModal.classList.remove('open');
    googleLoginModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (gwGoogleBtn) gwGoogleBtn.addEventListener('click', openGoogleModal);
  if (googleModalClose) googleModalClose.addEventListener('click', closeGoogleModal);
  if (googleLoginModal) {
    googleLoginModal.addEventListener('click', (e) => {
      if (e.target === googleLoginModal) closeGoogleModal();
    });
  }

  async function performGoogleAuth(email, name = null) {
    const formattedName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const res = await api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        email,
        full_name: formattedName,
        google_id: `g_${email}`,
        avatar_url: null
      })
    });

    if (res.ok && res.user && res.token) {
      closeGoogleModal();
      unlockWebsiteAccess(res.user, res.token);
      showToast(`Signed in as ${res.user.full_name}`, '✓');
    } else {
      showToast(res.error || 'Google authentication failed.', '⚠️');
    }
  }

  if (googleAccAlex) {
    googleAccAlex.addEventListener('click', () => {
      performGoogleAuth('alex.chen@gmail.com', 'Alex Chen');
    });
  }

  if (googleCustomSubmit) {
    googleCustomSubmit.addEventListener('click', () => {
      const email = (googleCustomEmail && googleCustomEmail.value.trim()) || 'learner@gmail.com';
      performGoogleAuth(email);
    });
  }

  if (gwDemoBtn || gwTopDemoBtn) {
    const handleGuest = (e) => {
      if (e) e.preventDefault();
      unlockWebsiteAccessAsGuest();
    };
    if (gwDemoBtn) gwDemoBtn.addEventListener('click', handleGuest);
    if (gwTopDemoBtn) gwTopDemoBtn.addEventListener('click', handleGuest);
  }

  // User Dropdown in Header
  if (userMenuBtn && userDropdownMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShown = userDropdownMenu.classList.toggle('show');
      userMenuBtn.setAttribute('aria-expanded', String(isShown));
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
        userDropdownMenu.classList.remove('show');
        userMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // -------------------------------------------------------------
  // 8. NOTIFICATIONS SYSTEM (Real-time DB Notifications)
  // -------------------------------------------------------------
  const notifBellBtn = document.querySelector('#notif-bell-btn');
  const notifBadgeCount = document.querySelector('#notif-badge-count');
  const notifDropdown = document.querySelector('#notif-dropdown');
  const notifList = document.querySelector('#notif-list');
  const notifMarkAllRead = document.querySelector('#notif-mark-all-read');

  if (notifBellBtn && notifDropdown) {
    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShown = notifDropdown.classList.toggle('show');
      if (isShown) loadNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!notifBellBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('show');
      }
    });
  }

  async function loadNotifications(silent = false) {
    if (!currentUser) return;
    const res = await api('/api/notifications');
    if (!res.ok || !Array.isArray(res.notifications)) return;

    const notifs = res.notifications;
    const unreadCount = notifs.filter(n => !n.is_read).length;

    if (notifBadgeCount) {
      if (unreadCount > 0) {
        notifBadgeCount.textContent = unreadCount > 9 ? '9+' : unreadCount;
        notifBadgeCount.hidden = false;
      } else {
        notifBadgeCount.hidden = true;
      }
    }

    if (!notifList) return;

    if (notifs.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }

    notifList.innerHTML = notifs.map(n => {
      let icon = '🔔';
      if (n.type === 'proposal_received') icon = '📬';
      if (n.type === 'proposal_accepted') icon = '🤝';
      if (n.type === 'message_received') icon = '💬';
      if (n.type === 'session_scheduled') icon = '📅';
      if (n.type === 'review_received') icon = '⭐';

      return `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" data-link="${escapeHtml(n.link || '')}">
          <div class="notif-icon">${icon}</div>
          <div class="notif-content">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-msg">${escapeHtml(n.message)}</div>
            <div class="notif-time">${n.created_at || 'Just now'}</div>
          </div>
        </div>
      `;
    }).join('');

    notifList.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        const link = item.dataset.link;
        await api(`/api/notifications/${id}/read`, { method: 'PUT' });
        item.classList.remove('unread');
        loadNotifications();
        if (link && link.startsWith('#')) {
          const targetEl = document.querySelector(link);
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          notifDropdown.classList.remove('show');
        }
      });
    });
  }

  if (notifMarkAllRead) {
    notifMarkAllRead.addEventListener('click', async () => {
      await api('/api/notifications/read-all', { method: 'PUT' });
      showToast('All notifications marked as read', '✓');
      loadNotifications();
    });
  }

  // -------------------------------------------------------------
  // 9. PLATFORM STATS & HERO SYNC
  // -------------------------------------------------------------
  async function loadPlatformStats() {
    const res = await api('/api/stats');
    if (!res.ok || !res.stats) return;

    const stats = res.stats;
    const statUsers = document.querySelector('#stat-total-users');
    const statExchanges = document.querySelector('#stat-total-exchanges');
    const statSessions = document.querySelector('#stat-total-sessions');
    const statRating = document.querySelector('#stat-avg-rating');
    const gwUsers = document.querySelector('#gw-stat-users');
    const gwExchanges = document.querySelector('#gw-stat-exchanges');
    const gwRating = document.querySelector('#gw-stat-rating');

    if (statUsers) statUsers.textContent = stats.total_users || 6;
    if (statExchanges) statExchanges.textContent = stats.total_exchanges || 3;
    if (statSessions) statSessions.textContent = stats.total_sessions || 4;
    if (statRating) statRating.textContent = `${stats.avg_community_rating || '5.0'} ★`;

    if (gwUsers) gwUsers.textContent = `${stats.total_users * 150}+ Learners`;
    if (gwExchanges) gwExchanges.textContent = `${stats.total_exchanges * 80}+ Exchanges`;
    if (gwRating) gwRating.textContent = `${stats.avg_community_rating || '4.9'} ★`;
  }

  // -------------------------------------------------------------
  // 10. DYNAMIC DISCOVER & SEARCH PIPELINE
  // -------------------------------------------------------------
  const peopleGrid = document.querySelector('#people-grid');
  const searchInput = document.querySelector('#skill-search');
  const searchButton = document.querySelector('#search-button');
  const searchClear = document.querySelector('#search-clear');
  const statusText = document.querySelector('#search-status');
  const emptyState = document.querySelector('#empty-state');
  const activeChipContainer = document.querySelector('#active-chip-container');
  const activeChipText = document.querySelector('#active-chip-text');
  const activeChipClear = document.querySelector('#active-chip-clear');
  const filterButtons = [...document.querySelectorAll('.filter')];
  const quickSkillSelect = document.querySelector('#quick-skill-select');
  const quickSearchBtn = document.querySelector('#quick-search-btn');
  const quickPills = document.querySelectorAll('.quick-pill');

  let selectedCategory = 'all';

  async function loadRegisteredUsersAndRender() {
    const res = await api('/api/users');
    if (res.ok && Array.isArray(res.users)) {
      allRegisteredUsers = res.users;
      renderPeerCards(allRegisteredUsers);
    }
  }

  function renderPeerCards(users, highlightSkill = null) {
    if (!peopleGrid) return;
    peopleGrid.innerHTML = '';

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const peers = currentUser ? users.filter(u => u.id !== currentUser.id) : users;

    let matchCount = 0;

    peers.forEach(peer => {
      const skillsTeach = peer.skills_teach || '';
      const skillsLearn = peer.skills_learn || '';
      const fullSearchText = `${peer.full_name} ${peer.role_title} ${skillsTeach} ${skillsLearn} ${peer.project_interest || ''}`.toLowerCase();

      // Category filter matching
      let matchesCat = selectedCategory === 'all';
      if (selectedCategory === 'favorites') {
        matchesCat = peer.is_favorite === true;
      } else if (selectedCategory === 'tech') {
        matchesCat = /(python|web|react|node|html|cloud|devops|engineer|software|backend|frontend)/i.test(fullSearchText);
      } else if (selectedCategory === 'design') {
        matchesCat = /(design|figma|ui|ux|brand|visual|motion|systems)/i.test(fullSearchText);
      } else if (selectedCategory === 'creative') {
        matchesCat = /(guitar|music|illustration|storytelling|video|blender|3d)/i.test(fullSearchText);
      } else if (selectedCategory === 'business') {
        matchesCat = /(business|strategy|freelance|marketing|product|growth|seo)/i.test(fullSearchText);
      } else if (selectedCategory === 'language') {
        matchesCat = /(language|english|speaking|presentation|fluency)/i.test(fullSearchText);
      }

      const matchesQuery = !query || fullSearchText.includes(query);

      if (matchesCat && matchesQuery) {
        matchCount++;

        const card = document.createElement('article');
        card.className = 'person-card tilt-card reveal in-view';
        if (highlightSkill && fullSearchText.includes(highlightSkill.toLowerCase())) {
          card.classList.add('search-highlight');
        }

        const teachPills = skillsTeach.split(/[,·|]/).map(s => s.trim()).filter(Boolean);
        const pillsHtml = teachPills.slice(0, 4).map(skill => `<span data-skill="${escapeHtml(skill)}">${escapeHtml(skill)}</span>`).join('');
        const avatarSrc = peer.avatar_url || 'default-avatar.svg';
        const ratingDisplay = peer.avg_rating ? `${peer.avg_rating} ★ (${peer.review_count || 1})` : '★ 5.0 (Verified)';
        const isFav = peer.is_favorite;

        card.innerHTML = `
          <div class="person-top">
            <div class="profile-portrait">
              <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(peer.full_name)}" loading="lazy" />
              <i>●</i>
            </div>
            <button class="heart-button ${isFav ? 'favorited' : ''}" type="button" data-id="${peer.id}" aria-label="Toggle favorites">
              ${isFav ? '♥' : '♡'}
            </button>
          </div>
          <div class="person-name">
            <h3>${escapeHtml(peer.full_name)} <span class="verified">✓</span></h3>
            <span>${ratingDisplay}</span>
          </div>
          <p>${escapeHtml(peer.role_title || 'Lifelong learner on SkillSwap.')}</p>
          <div class="skill-pills">
            ${pillsHtml || '<span data-skill="Learning">Active Learner</span>'}
          </div>
          <div class="peer-exchange-needs">
            <div class="wants">
              <span>🎯 Wants to learn:</span>
              <strong>${escapeHtml(peer.skills_learn || 'Open to proposals')}</strong>
            </div>
            ${peer.project_interest ? `
            <div class="project-interest">
              <span>🚀 Target project:</span>
              <strong>${escapeHtml(peer.project_interest)}</strong>
            </div>` : ''}
          </div>
          <div class="person-actions-row">
            <button class="button button-card open-proposal-btn" type="button" data-id="${peer.id}" data-name="${escapeHtml(peer.full_name)}" data-teach="${escapeHtml(peer.skills_teach || '')}" data-learn="${escapeHtml(peer.skills_learn || '')}">
              Swap Request <span aria-hidden="true">→</span>
            </button>
            <button class="btn-view-profile open-peer-modal-btn" type="button" data-id="${peer.id}">
              Profile
            </button>
          </div>
        `;

        peopleGrid.appendChild(card);
      }
    });

    if (statusText) {
      if (query) {
        statusText.textContent = `${matchCount} match${matchCount === 1 ? '' : 'es'} for “${searchInput.value.trim()}”`;
      } else if (selectedCategory === 'favorites') {
        statusText.textContent = `Showing ${matchCount} saved favorite peer${matchCount === 1 ? '' : 's'}`;
      } else if (selectedCategory !== 'all') {
        statusText.textContent = `Showing ${matchCount} peer${matchCount === 1 ? '' : 's'} in ${selectedCategory}`;
      } else {
        statusText.textContent = `Showing ${matchCount} verified community peer${matchCount === 1 ? '' : 's'}`;
      }
    }

    if (activeChipContainer && activeChipText) {
      if (query || selectedCategory !== 'all') {
        activeChipContainer.hidden = false;
        activeChipText.textContent = query ? `Skill: ${searchInput.value.trim()}` : `Filter: ${selectedCategory}`;
      } else {
        activeChipContainer.hidden = true;
      }
    }

    if (emptyState) emptyState.hidden = matchCount > 0;

    // Attach Proposal Modal Triggers
    peopleGrid.querySelectorAll('.open-proposal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openProposalModal({
          id: btn.dataset.id,
          name: btn.dataset.name,
          teach: btn.dataset.teach,
          learn: btn.dataset.learn
        });
      });
    });

    // Attach Full Profile Modal Triggers
    peopleGrid.querySelectorAll('.open-peer-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => openPeerProfileModal(btn.dataset.id));
    });

    // Attach Persistent Favorites Heart
    peopleGrid.querySelectorAll('.heart-button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const peerId = btn.dataset.id;
        if (!requireAuth('favorite a profile')) return;
          const isFav = btn.classList.contains('favorited');

        if (isFav) {
          await api(`/api/favorites/${peerId}`, { method: 'DELETE' });
          btn.classList.remove('favorited');
          btn.textContent = '♡';
          showToast('Removed from saved favorites', '🤍');
        } else {
          await api(`/api/favorites/${peerId}`, { method: 'POST' });
          btn.classList.add('favorited');
          btn.textContent = '♥';
          showToast('Saved peer to favorites!', '❤️');
        }

        // Update local user state
        const target = allRegisteredUsers.find(u => String(u.id) === String(peerId));
        if (target) target.is_favorite = !isFav;
      });
    });

    // Attach skill pills click to search
    peopleGrid.querySelectorAll('.skill-pills span').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        executeFindYourPeople(pill.dataset.skill || pill.textContent.trim());
      });
    });
  }

  function executeFindYourPeople(skill) {
    if (!skill) skill = 'Brand strategy';
    if (searchInput) searchInput.value = skill;

    const lower = skill.toLowerCase();
    let targetCat = 'all';
    if (/python|web|react|node|html/i.test(lower)) targetCat = 'tech';
    else if (/brand|motion|design|figma/i.test(lower)) targetCat = 'design';
    else if (/illustration|guitar|music/i.test(lower)) targetCat = 'creative';
    else if (/photography|ux writing|business/i.test(lower)) targetCat = 'business';

    selectedCategory = targetCat;
    filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === targetCat));

    const discoverSection = document.querySelector('#discover');
    if (discoverSection) discoverSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      renderPeerCards(allRegisteredUsers, skill);
      showToast(`Showing verified peers for “${skill}”`, '🔍');
    }, 350);
  }

  if (quickSearchBtn) {
    quickSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const chosen = quickSkillSelect ? quickSkillSelect.value : '';
      if (!chosen) {
        showToast('Please pick a skill or click a popular pill below!', '💡');
        if (quickSkillSelect) quickSkillSelect.focus();
        return;
      }
      executeFindYourPeople(chosen);
    });
  }

  if (quickSkillSelect) {
    quickSkillSelect.addEventListener('change', () => {
      if (quickSkillSelect.value) executeFindYourPeople(quickSkillSelect.value);
    });
  }

  quickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const skill = pill.dataset.skill;
      if (quickSkillSelect) quickSkillSelect.value = skill;
      quickPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      executeFindYourPeople(skill);
    });
  });

  if (searchButton) searchButton.addEventListener('click', () => renderPeerCards(allRegisteredUsers));
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchClear) searchClear.hidden = !searchInput.value;
      renderPeerCards(allRegisteredUsers);
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.hidden = true;
      renderPeerCards(allRegisteredUsers);
      searchInput.focus();
    });
  }
  if (activeChipClear) {
    activeChipClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      selectedCategory = 'all';
      filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === 'all'));
      renderPeerCards(allRegisteredUsers);
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.dataset.filter || 'all';
      renderPeerCards(allRegisteredUsers);
    });
  });

  const menuViewFavsBtn = document.querySelector('#menu-view-favs-btn');
  if (menuViewFavsBtn) {
    menuViewFavsBtn.addEventListener('click', () => {
      if (userDropdownMenu) userDropdownMenu.classList.remove('show');
      selectedCategory = 'favorites';
      filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'favorites'));
      const discover = document.querySelector('#discover');
      if (discover) discover.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderPeerCards(allRegisteredUsers);
    });
  }

  // -------------------------------------------------------------
  // 11. PEER PROFILE DETAIL MODAL
  // -------------------------------------------------------------
  const peerProfileModal = document.querySelector('#peer-profile-modal');
  const peerModalClose = document.querySelector('#peer-modal-close');
  const peerModalAvatar = document.querySelector('#peer-modal-avatar');
  const peerModalName = document.querySelector('#peer-modal-name');
  const peerModalRole = document.querySelector('#peer-modal-role');
  const peerModalRating = document.querySelector('#peer-modal-rating');
  const peerModalBio = document.querySelector('#peer-modal-bio');
  const peerModalTeachChips = document.querySelector('#peer-modal-teach-chips');
  const peerModalLearnChips = document.querySelector('#peer-modal-learn-chips');
  const peerModalReviewsList = document.querySelector('#peer-modal-reviews-list');
  const peerModalConnectBtn = document.querySelector('#peer-modal-connect-btn');
  const peerModalFavBtn = document.querySelector('#peer-modal-fav-btn');

  let activeModalPeer = null;

  async function openPeerProfileModal(peerId) {
    if (!requireAuth('view full profiles')) return;
    if (!peerProfileModal) return;
    const peer = allRegisteredUsers.find(u => String(u.id) === String(peerId));
    if (!peer) return;

    activeModalPeer = peer;

    if (peerModalAvatar) peerModalAvatar.src = peer.avatar_url || 'default-avatar.svg';
    if (peerModalName) peerModalName.innerHTML = `${escapeHtml(peer.full_name)} <span class="verified">✓</span>`;
    if (peerModalRole) peerModalRole.textContent = peer.role_title || 'Skill Swapper';
    if (peerModalRating) peerModalRating.textContent = peer.avg_rating ? `${peer.avg_rating} ★ (${peer.review_count || 1} reviews)` : '★ 5.0 (Verified Peer)';
    if (peerModalBio) peerModalBio.textContent = peer.bio || 'Curious, collaborative peer ready to share knowledge and level up skills together.';

    // Teach Chips
    if (peerModalTeachChips) {
      const teachArr = (peer.skills_teach || '').split(/[,·|]/).map(s => s.trim()).filter(Boolean);
      peerModalTeachChips.innerHTML = teachArr.map(s => `<span class="peer-modal-chip chip-teach">${escapeHtml(s)}</span>`).join('') || '<span>General Knowledge</span>';
    }

    // Learn Chips
    if (peerModalLearnChips) {
      const learnArr = (peer.skills_learn || '').split(/[,·|]/).map(s => s.trim()).filter(Boolean);
      peerModalLearnChips.innerHTML = learnArr.map(s => `<span class="peer-modal-chip chip-learn">${escapeHtml(s)}</span>`).join('') || '<span>Open to discovery</span>';
    }

    if (peerModalFavBtn) {
      peerModalFavBtn.textContent = peer.is_favorite ? '❤️ Remove from Favorites' : '⭐ Save to Favorites';
    }

    if (peerModalConnectBtn) {
      peerModalConnectBtn.onclick = () => {
        closePeerProfileModal();
        openProposalModal({
          id: peer.id,
          name: peer.full_name,
          teach: peer.skills_teach,
          learn: peer.skills_learn
        });
      };
    }

    // Load peer reviews
    if (peerModalReviewsList) {
      peerModalReviewsList.innerHTML = '<div style="font-size: 11px; color: var(--muted);">Loading verified reviews...</div>';
      const res = await api(`/api/users/${peer.id}/reviews`);
      if (res.ok && Array.isArray(res.reviews) && res.reviews.length > 0) {
        peerModalReviewsList.innerHTML = res.reviews.map(r => `
          <div class="peer-review-mini-card">
            <div class="stars">${'★'.repeat(r.rating)}</div>
            <p>“${escapeHtml(r.review_text)}”</p>
            <small>— ${escapeHtml(r.reviewer_name)}</small>
          </div>
        `).join('');
      } else {
        peerModalReviewsList.innerHTML = '<div style="font-size: 11px; color: var(--muted);">No reviews written for this peer yet.</div>';
      }
    }

    peerProfileModal.classList.add('open');
    peerProfileModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closePeerProfileModal() {
    if (!peerProfileModal) return;
    peerProfileModal.classList.remove('open');
    peerProfileModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (peerModalClose) peerModalClose.addEventListener('click', closePeerProfileModal);
  if (peerProfileModal) {
    peerProfileModal.addEventListener('click', (e) => {
      if (e.target === peerProfileModal) closePeerProfileModal();
    });
  }

  if (peerModalFavBtn) {
    peerModalFavBtn.addEventListener('click', async () => {
      if (!activeModalPeer) return;
      const isFav = activeModalPeer.is_favorite;
      if (isFav) {
        await api(`/api/favorites/${activeModalPeer.id}`, { method: 'DELETE' });
        activeModalPeer.is_favorite = false;
        peerModalFavBtn.textContent = '⭐ Save to Favorites';
        showToast('Removed from favorites', '🤍');
      } else {
        await api(`/api/favorites/${activeModalPeer.id}`, { method: 'POST' });
        activeModalPeer.is_favorite = true;
        peerModalFavBtn.textContent = '❤️ Remove from Favorites';
        showToast('Saved to favorites!', '❤️');
      }
      renderPeerCards(allRegisteredUsers);
    });
  }

  // -------------------------------------------------------------
  // 12. HERO MATCHES & CARDS
  // -------------------------------------------------------------
  async function loadHeroMatches() {
    const res = await api('/api/matches');
    if (!res.ok || !Array.isArray(res.matches)) return;
    const matches = res.matches;

    const userCard1 = document.querySelector('#user-card-1');
    const userCard2 = document.querySelector('#user-card-2');
    const heroMatchPanel = document.querySelector('#hero-match-panel');

    if (matches.length > 0 && userCard1) {
      const p1 = matches[0];
      userCard1.querySelector('.peer-name').innerHTML = `${escapeHtml(p1.full_name)} <span class="verified-dot">✓</span>`;
      userCard1.querySelector('.peer-role').textContent = p1.role_title || 'Lead UI/UX Designer';
      userCard1.querySelector('.peer-avatar img').src = p1.avatar_url || 'default-avatar.svg';
      const teachSpan = userCard1.querySelector('.tag-teach');
      const learnSpan = userCard1.querySelector('.tag-learn');
      if (teachSpan) teachSpan.textContent = `Teach: ${(p1.skills_teach || 'Design').split(',')[0]}`;
      if (learnSpan) learnSpan.textContent = `Learn: ${(p1.skills_learn || 'Coding').split(',')[0]}`;
    }

    if (matches.length > 1 && userCard2) {
      const p2 = matches[1];
      userCard2.querySelector('.peer-name').innerHTML = `${escapeHtml(p2.full_name)} <span class="verified-dot">✓</span>`;
      userCard2.querySelector('.peer-role').textContent = p2.role_title || 'Full-Stack Engineer';
      userCard2.querySelector('.peer-avatar img').src = p2.avatar_url || 'default-avatar.svg';
      const teachSpan = userCard2.querySelector('.tag-teach');
      const learnSpan = userCard2.querySelector('.tag-learn');
      if (teachSpan) teachSpan.textContent = `Teach: ${(p2.skills_teach || 'Development').split(',')[0]}`;
      if (learnSpan) learnSpan.textContent = `Learn: ${(p2.skills_learn || 'Design').split(',')[0]}`;
    }

    if (matches.length > 0 && heroMatchPanel) {
      const topMatch = matches[0];
      const featuredArt = heroMatchPanel.querySelector('.featured-match');
      if (featuredArt) {
        featuredArt.querySelector('.profile-portrait img').src = topMatch.avatar_url || 'default-avatar.svg';
        featuredArt.querySelector('.match-person p').innerHTML = `${escapeHtml(topMatch.full_name)} <span class="verified">✓</span>`;
        featuredArt.querySelector('.match-person small').textContent = `${topMatch.role_title || 'Brand Architect'}`;
        const ratingEl = featuredArt.querySelector('.match-footer .rating');
        if (ratingEl) {
          ratingEl.innerHTML = topMatch.avg_rating ? `★ ${topMatch.avg_rating} <small>(Verified)</small>` : '★ 5.0 <small>(Verified)</small>';
        }

        const connectBtn = featuredArt.querySelector('.connect-pulse-btn');
        if (connectBtn) {
          connectBtn.onclick = () => {
            openProposalModal({
              id: topMatch.id,
              name: topMatch.full_name,
              teach: topMatch.skills_teach,
              learn: topMatch.skills_learn
            });
          };
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 13. SCHEDULED SESSIONS & MANAGEMENT
  // -------------------------------------------------------------
  const scheduledSessionsContainer = document.querySelector('#scheduled-sessions-container');
  const openScheduleModalBtn = document.querySelector('#open-schedule-modal-btn');
  const upcomingAddBtn = document.querySelector('#upcoming-add-btn');
  const scheduleSessionModal = document.querySelector('#schedule-session-modal');
  const scheduleModalClose = document.querySelector('#schedule-modal-close');
  const scheduleModalCancel = document.querySelector('#schedule-modal-cancel');
  const scheduleSessionForm = document.querySelector('#schedule-session-form');
  const scheduleParticipantSelect = document.querySelector('#schedule-participant-select');
  const scheduleTitleInput = document.querySelector('#schedule-title');
  const scheduleTimeInput = document.querySelector('#schedule-time');
  const scheduleMeetUrlInput = document.querySelector('#schedule-meet-url');
  const scheduleNotesInput = document.querySelector('#schedule-notes');

  async function loadSessions() {
    if (!scheduledSessionsContainer || !currentUser) return;
    const res = await api('/api/sessions');
    if (!res.ok || !Array.isArray(res.sessions)) return;

    const sessions = res.sessions;

    if (sessions.length === 0) {
      scheduledSessionsContainer.innerHTML = `
        <div style="padding: 16px; background: var(--paper-2); border-radius: 12px; text-align: center; color: var(--muted); font-size: 13px;">
          No sessions scheduled yet. Click <strong>"+ New"</strong> or propose an exchange!
        </div>
      `;
      return;
    }

    scheduledSessionsContainer.innerHTML = `
      <div class="sessions-dynamic-list">
        ${sessions.map(s => {
          const isHost = s.host_id === currentUser.id;
          const partnerName = isHost ? s.participant_name : s.host_name;
          const partnerAvatar = isHost ? s.participant_avatar : s.host_avatar;

          return `
            <div class="session-row-card">
              <div class="session-row-left">
                <img class="session-row-avatar" src="${escapeHtml(partnerAvatar || 'default-avatar.svg')}" alt="${escapeHtml(partnerName)}" />
                <div class="session-row-info">
                  <h4>${escapeHtml(s.title)}</h4>
                  <p>with ${escapeHtml(partnerName)}</p>
                  <small>◷ ${escapeHtml(s.scheduled_time)}</small>
                </div>
              </div>
              <div class="session-row-actions">
                <a href="${escapeHtml(s.meet_url || DEFAULT_MEET_URL)}" target="_blank" rel="noopener noreferrer" class="btn-join-meet-mini">
                  📹 Meet
                </a>
                <button type="button" class="btn-session-cancel" data-id="${s.id}" title="Cancel session">
                  ✕
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    scheduledSessionsContainer.querySelectorAll('.btn-session-cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await api(`/api/sessions/${id}`, { method: 'DELETE' });
        showToast('Session cancelled.', 'ℹ️');
        loadSessions();
        loadPlatformStats();
      });
    });
  }

  function openScheduleSessionModal() {
    if (!requireAuth('schedule a session')) return;
    if (!scheduleSessionModal || !scheduleParticipantSelect) return;

    scheduleParticipantSelect.innerHTML = '<option value="" disabled selected>Choose a partner...</option>';
    const partners = allRegisteredUsers.filter(u => currentUser && u.id !== currentUser.id);

    partners.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.full_name} (${p.role_title || 'Peer'})`;
      scheduleParticipantSelect.appendChild(opt);
    });

    scheduleSessionModal.classList.add('open');
    scheduleSessionModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closeScheduleSessionModal() {
    if (!scheduleSessionModal) return;
    scheduleSessionModal.classList.remove('open');
    scheduleSessionModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (openScheduleModalBtn) openScheduleModalBtn.addEventListener('click', openScheduleSessionModal);
  if (upcomingAddBtn) upcomingAddBtn.addEventListener('click', openScheduleSessionModal);
  if (scheduleModalClose) scheduleModalClose.addEventListener('click', closeScheduleSessionModal);
  if (scheduleModalCancel) scheduleModalCancel.addEventListener('click', closeScheduleSessionModal);
  if (scheduleSessionModal) {
    scheduleSessionModal.addEventListener('click', (e) => {
      if (e.target === scheduleSessionModal) closeScheduleSessionModal();
    });
  }

  if (scheduleSessionForm) {
    scheduleSessionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const participant_id = scheduleParticipantSelect ? scheduleParticipantSelect.value : '';
      const title = scheduleTitleInput ? scheduleTitleInput.value.trim() : '';
      const scheduled_time = scheduleTimeInput ? scheduleTimeInput.value.trim() : '';
      const meet_url = scheduleMeetUrlInput ? scheduleMeetUrlInput.value.trim() : '';
      const notes = scheduleNotesInput ? scheduleNotesInput.value.trim() : '';

      if (!participant_id || !title) {
        showToast('Please select a partner and enter a session title.', '⚠️');
        return;
      }

      const res = await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          participant_id,
          title,
          scheduled_time,
          meet_url,
          notes
        })
      });

      if (res.ok) {
        closeScheduleSessionModal();
        scheduleSessionForm.reset();
        showToast('Session scheduled successfully!', '📅');
        await loadSessions();
        await loadPlatformStats();
      } else {
        showToast(res.error || 'Failed to schedule session.', '⚠️');
      }
    });
  }

  // -------------------------------------------------------------
  // 14. REAL-TIME MESSENGER & GOOGLE MEET
  // -------------------------------------------------------------
  const chatConversationsBar = document.querySelector('#chat-conversations-bar');
  const chatPartnerAvatar = document.querySelector('#chat-partner-avatar');
  const chatPartnerName = document.querySelector('#chat-partner-name');
  const chatPartnerStatus = document.querySelector('#chat-partner-status');
  const chatMessages = document.querySelector('#chat-messages');
  const chatForm = document.querySelector('#chat-form');
  const chatMeetBtn = document.querySelector('#chat-meet-btn');

  if (chatMeetBtn) {
    chatMeetBtn.addEventListener('click', () => {
      if (chatInput) {
        // Generate a random meet link suffix for demo
        const randomId = Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5);
        const meetUrl = `https://meet.google.com/${randomId}`;
        chatInput.value = `Let's join a live call! ${meetUrl}`;
        chatInput.focus();
        showToast('Google Meet link generated!', '??');
      }
    });
  }
  const chatInput = document.querySelector('#chat-input');
  const chatRatePartnerBtn = document.querySelector('#chat-rate-partner-btn');

  const activeMeetUrlEl = document.querySelector('#active-meet-url');
  const copyMeetLinkBtn = document.querySelector('#copy-meet-link-btn');
  const openMeetModalBtn = document.querySelector('#open-meet-modal-btn');
  const meetLinkModal = document.querySelector('#meet-link-modal');
  const meetModalClose = document.querySelector('#meet-modal-close');
  const meetModalCancel = document.querySelector('#meet-modal-cancel');
  const meetShareForm = document.querySelector('#meet-share-form');
  const inputMeetUrl = document.querySelector('#input-meet-url');
  const generateMeetBtn = document.querySelector('#generate-meet-btn');
  const joinSessionBtn = document.querySelector('#join-session');

  const DEFAULT_MEET_URL = 'https://meet.google.com/qmv-ytpk-zbw';
  let currentMeetUrl = DEFAULT_MEET_URL;

  function updateActiveMeet(url) {
    currentMeetUrl = url || DEFAULT_MEET_URL;
    if (activeMeetUrlEl) {
      activeMeetUrlEl.href = currentMeetUrl;
      activeMeetUrlEl.textContent = currentMeetUrl.replace(/^https?:\/\//, '');
    }
    if (inputMeetUrl) inputMeetUrl.value = currentMeetUrl;
  }

  async function loadConversations() {
    const res = await api('/api/conversations');
    if (!res.ok || !Array.isArray(res.conversations)) return;
    userConversations = res.conversations;

    if (chatConversationsBar) {
      chatConversationsBar.innerHTML = '';
      if (userConversations.length === 0) {
        chatConversationsBar.innerHTML = '<span style="font-size: 11px; color: var(--muted); padding: 4px 8px;">No active conversations yet. Propose a swap to chat!</span>';
      } else {
        userConversations.forEach((conv, idx) => {
          const peerName = conv.other_user ? conv.other_user.full_name : 'Peer';
          const tab = document.createElement('button');
          tab.type = 'button';
          tab.className = `chat-conv-tab${(activeConversationId === conv.id || (!activeConversationId && idx === 0)) ? ' active' : ''}`;
          tab.innerHTML = `💬 ${escapeHtml(peerName.split(' ')[0])}`;
          tab.addEventListener('click', () => selectConversation(conv));
          chatConversationsBar.appendChild(tab);
        });
      }
    }

    if (userConversations.length > 0) {
      const selected = activeConversationId ? userConversations.find(c => c.id === activeConversationId) : userConversations[0];
      if (selected) selectConversation(selected);
    }
  }

  async function selectConversation(conv) {
    activeConversationId = conv.id;
    activeConversationPeer = conv.other_user;

    if (chatConversationsBar) {
      chatConversationsBar.querySelectorAll('.chat-conv-tab').forEach((tab, i) => {
        tab.classList.toggle('active', userConversations[i] && userConversations[i].id === conv.id);
      });
    }

    if (activeConversationPeer) {
      if (chatPartnerName) chatPartnerName.textContent = activeConversationPeer.full_name;
      if (chatPartnerAvatar && activeConversationPeer.avatar_url) chatPartnerAvatar.src = activeConversationPeer.avatar_url;
      if (chatPartnerStatus) chatPartnerStatus.innerHTML = '<i></i> Active exchange partner';
    }

    if (conv.meet_url) updateActiveMeet(conv.meet_url);
    await loadConversationMessages(conv.id);
  }

  async function loadConversationMessages(convId, isBackgroundPoll = false) {
    if (!chatMessages) return;
    const res = await api(`/api/conversations/${convId}/messages`);
    if (res.ok && Array.isArray(res.messages)) {
      const previousScrollHeight = chatMessages.scrollHeight;
      const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 60;

      chatMessages.innerHTML = '<p class="chat-date">Real-Time Secure Messenger</p>';
      if (res.messages.length === 0) {
        chatMessages.innerHTML += '<div class="message incoming">Say hello! Agree on your goals and schedule your Google Meet session.</div>';
      } else {
        res.messages.forEach(msg => {
          const isOutgoing = currentUser && msg.sender_id === currentUser.id;
          const msgEl = document.createElement('div');
          msgEl.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
          
          if (msg.text.includes('meet.google.com')) {
            const urlMatch = msg.text.match(/https?:\/\/meet\.google\.com\/[a-z0-9-]+/i);
            const meetLink = urlMatch ? urlMatch[0] : '';
            msgEl.innerHTML = `📹 <strong>${escapeHtml(msg.sender_name || 'Partner')}:</strong> ${escapeHtml(msg.text)} <a href="${meetLink}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:underline;font-weight:700;display:block;margin-top:4px;">Join Google Meet →</a>`;
          } else {
            msgEl.textContent = msg.text;
          }

          chatMessages.appendChild(msgEl);
        });
      }

      if (!isBackgroundPoll || isAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  }

  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput ? chatInput.value.trim() : '';
      if (!text) return;

      if (!activeConversationId) {
        showToast('Please select or start an exchange first to send messages.', '💡');
        return;
      }

      chatInput.value = '';

      const res = await api(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });

      if (res.ok && res.message) {
        const msgEl = document.createElement('div');
        msgEl.className = 'message outgoing';
        msgEl.textContent = text;
        chatMessages.appendChild(msgEl);
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        showToast(res.error || 'Failed to send message.', '⚠️');
      }
    });
  }

  if (copyMeetLinkBtn) {
    copyMeetLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentMeetUrl).then(() => {
        showToast('Google Meet link copied to clipboard!', '📋');
      }).catch(() => {
        showToast(`Google Meet link: ${currentMeetUrl}`, '📋');
      });
    });
  }

  function openMeetModal() {
    if (!meetLinkModal) return;
    if (inputMeetUrl) inputMeetUrl.value = currentMeetUrl;
    meetLinkModal.classList.add('open');
    meetLinkModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    setTimeout(() => inputMeetUrl && inputMeetUrl.focus(), 150);
  }

  function closeMeetModal() {
    if (!meetLinkModal) return;
    meetLinkModal.classList.remove('open');
    meetLinkModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (openMeetModalBtn) openMeetModalBtn.addEventListener('click', openMeetModal);
  if (meetModalClose) meetModalClose.addEventListener('click', closeMeetModal);
  if (meetModalCancel) meetModalCancel.addEventListener('click', closeMeetModal);
  if (meetLinkModal) {
    meetLinkModal.addEventListener('click', (e) => {
      if (e.target === meetLinkModal) closeMeetModal();
    });
  }

  if (generateMeetBtn) {
    generateMeetBtn.addEventListener('click', () => {
      const seg = () => Math.random().toString(36).substring(2, 5);
      const genUrl = `https://meet.google.com/${seg()}-${seg()}-${seg()}`;
      if (inputMeetUrl) inputMeetUrl.value = genUrl;
      showToast(`Generated new Google Meet link: ${genUrl}`, '⚡');
    });
  }

  if (meetShareForm) {
    meetShareForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newUrl = inputMeetUrl ? inputMeetUrl.value.trim() : currentMeetUrl;
      if (!newUrl) return;

      if (activeConversationId) {
        const res = await api(`/api/conversations/${activeConversationId}/meet`, {
          method: 'PUT',
          body: JSON.stringify({ meet_url: newUrl })
        });
        if (res.ok) {
          updateActiveMeet(newUrl);
          closeMeetModal();
          showToast('Google Meet link shared with partner!', '📹');
          loadConversationMessages(activeConversationId);
        }
      } else {
        updateActiveMeet(newUrl);
        closeMeetModal();
        showToast('Google Meet link updated!', '📹');
      }
    });
  }

  if (joinSessionBtn) {
    joinSessionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Opening Google Meet: ${currentMeetUrl}...`, '📹');
      window.open(currentMeetUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // -------------------------------------------------------------
  // 15. PROPOSALS & EXCHANGE REQUESTS
  // -------------------------------------------------------------
  const incomingProposalsWrap = document.querySelector('#incoming-proposals-wrap');
  const requestModal = document.querySelector('#request-modal');
  const requestPerson = document.querySelector('#request-person');
  const requestForm = document.querySelector('#request-form');
  const requestReceiverId = document.querySelector('#request-receiver-id');
  const requestInputLearn = document.querySelector('#request-input-learn');
  const requestInputTeach = document.querySelector('#request-input-teach');
  const requestInputMsg = document.querySelector('#request-input-msg');
  const requestClose = document.querySelector('#request-modal-close');

  async function loadProposals() {
    if (!incomingProposalsWrap || !currentUser) return;
    const res = await api('/api/proposals');
    if (!res.ok || !Array.isArray(res.proposals)) return;

    const pendingIncoming = res.proposals.filter(p => p.receiver_id === currentUser.id && p.status === 'pending');

    if (pendingIncoming.length === 0) {
      incomingProposalsWrap.innerHTML = '';
      return;
    }

    incomingProposalsWrap.innerHTML = `
      <div class="incoming-proposals-box">
        <h4 style="margin: 0 0 10px; color: #10b981; font-size: 14px; font-weight: 700;">
          📬 Incoming Exchange Proposals (${pendingIncoming.length})
        </h4>
        ${pendingIncoming.map(p => `
          <div class="proposal-item">
            <div>
              <strong>${escapeHtml(p.sender_name)}</strong> wants to learn <em>“${escapeHtml(p.learn_skill)}”</em> and teach <em>“${escapeHtml(p.teach_skill)}”</em>.
              ${p.message ? `<small style="display:block;color:var(--muted);margin-top:2px;">"${escapeHtml(p.message)}"</small>` : ''}
            </div>
            <div class="proposal-actions">
              <button type="button" class="btn-accept" data-id="${p.id}">Accept & Chat</button>
              <button type="button" class="btn-reject" data-id="${p.id}">Decline</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    incomingProposalsWrap.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const res = await api(`/api/proposals/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'accepted' })
        });
        if (res.ok) {
          showToast('Exchange proposal accepted! Conversation created.', '🤝');
          await loadProposals();
          await loadConversations();
          await loadSessions();
          await loadPlatformStats();
          const chatCard = document.querySelector('#chat-card');
          if (chatCard) chatCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    incomingProposalsWrap.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const res = await api(`/api/proposals/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'rejected' })
        });
        if (res.ok) {
          showToast('Proposal declined.', 'ℹ️');
          loadProposals();
        }
      });
    });
  }

  function openProposalModal(peer) {
    if (!requestModal) return;
    if (requestPerson) requestPerson.textContent = peer.name || 'your skill partner';
    if (requestReceiverId) requestReceiverId.value = peer.id || '';
    if (requestInputLearn) requestInputLearn.value = peer.teach ? peer.teach.split(',')[0].trim() : '';
    if (requestInputTeach) requestInputTeach.value = currentUser && currentUser.skills_teach ? currentUser.skills_teach.split(',')[0].trim() : '';

    requestModal.classList.add('open');
    requestModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closeProposalModal() {
    if (!requestModal) return;
    requestModal.classList.remove('open');
    requestModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (requestClose) requestClose.addEventListener('click', closeProposalModal);
  if (requestModal) {
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeProposalModal();
    });
  }

  document.querySelectorAll('.open-request').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const firstPeer = allRegisteredUsers.find(u => currentUser && u.id !== currentUser.id);
      openProposalModal({
        id: firstPeer ? firstPeer.id : '',
        name: firstPeer ? firstPeer.full_name : (btn.dataset.person || 'a new skill partner'),
        teach: firstPeer ? firstPeer.skills_teach : '',
        learn: firstPeer ? firstPeer.skills_learn : ''
      });
    });
  });

  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const receiverId = requestReceiverId ? requestReceiverId.value : '';
      const learnSkill = requestInputLearn ? requestInputLearn.value.trim() : '';
      const teachSkill = requestInputTeach ? requestInputTeach.value.trim() : '';
      const message = requestInputMsg ? requestInputMsg.value.trim() : '';

      if (!receiverId) {
        showToast('Please select a peer from the Discover section to propose an exchange.', '💡');
        closeProposalModal();
        return;
      }

      const res = await api('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: receiverId,
          learn_skill: learnSkill,
          teach_skill: teachSkill,
          message
        })
      });

      if (res.ok) {
        closeProposalModal();
        requestForm.reset();
        showToast('Exchange proposal sent successfully!', '💌');
      } else {
        showToast(res.error || 'Failed to send proposal.', '⚠️');
      }
    });
  }

  // -------------------------------------------------------------
  // 16. COMMUNITY POSTS & DISCUSSIONS
  // -------------------------------------------------------------
  const communityFeedGrid = document.querySelector('#community-feed-grid');
  const openCreatePostBtn = document.querySelector('#open-create-post-btn');
  const createPostModal = document.querySelector('#create-post-modal');
  const postModalClose = document.querySelector('#post-modal-close');
  const postModalCancel = document.querySelector('#post-modal-cancel');
  const createPostForm = document.querySelector('#create-post-form');
  const postCategorySelect = document.querySelector('#post-category');
  const postTitleInput = document.querySelector('#post-title');
  const postContentInput = document.querySelector('#post-content');
  const postTagsInput = document.querySelector('#post-tags');
  const feedFilterBtns = document.querySelectorAll('.feed-filter-btn');

  async function loadCommunityPosts() {
    if (!communityFeedGrid) return;
    const res = await api(`/api/community/posts?category=${activeFeedCategory}`);
    if (!res.ok || !Array.isArray(res.posts)) return;

    const posts = res.posts;

    if (posts.length === 0) {
      communityFeedGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px; text-align: center; background: var(--card-bg); border-radius: 20px; border: 1.5px dashed var(--line); color: var(--muted);">
          <p style="font-size: 15px; margin: 0 0 12px; color: var(--ink);">No discussions in this category yet.</p>
          <button type="button" class="button button-primary" id="feed-empty-create-btn">✍️ Be the First to Post</button>
        </div>
      `;
      const emptyBtn = document.querySelector('#feed-empty-create-btn');
      if (emptyBtn) emptyBtn.addEventListener('click', openCreatePostModal);
      return;
    }

    communityFeedGrid.innerHTML = posts.map(p => {
      const tags = (p.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const tagsHtml = tags.map(t => `<span class="feed-tag-pill">#${escapeHtml(t)}</span>`).join('');

      return `
        <article class="feed-card tilt-card reveal in-view">
          <div>
            <div class="feed-author-row">
              <div class="feed-author-info">
                <img class="feed-author-avatar" src="${escapeHtml(p.author_avatar || 'default-avatar.svg')}" alt="${escapeHtml(p.author_name)}" />
                <div>
                  <h4 class="feed-author-name">${escapeHtml(p.author_name)}</h4>
                  <span class="feed-author-role">${escapeHtml(p.author_role || 'Skill Swapper')}</span>
                </div>
              </div>
              <span class="feed-cat-badge">${escapeHtml(p.category)}</span>
            </div>
            <h3 class="feed-title" style="margin-top: 14px;">${escapeHtml(p.title)}</h3>
            <p class="feed-content" style="margin-top: 8px;">${escapeHtml(p.content)}</p>
          </div>
          <div>
            <div class="feed-tags-row">${tagsHtml}</div>
            <div class="feed-footer-row" style="margin-top: 12px;">
              <button type="button" class="feed-like-btn ${p.has_liked ? 'liked' : ''}" data-id="${p.id}">
                <span>${p.has_liked ? '❤️' : '🤍'}</span> <strong>${p.likes_count || 0}</strong>
              </button>
              <span class="feed-date">${p.created_at ? p.created_at.substring(0, 10) : 'Recent'}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    communityFeedGrid.querySelectorAll('.feed-like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const res = await api(`/api/community/posts/${id}/like`, { method: 'POST' });
        if (res.ok) {
          btn.classList.toggle('liked', res.liked);
          const countEl = btn.querySelector('strong');
          const heartEl = btn.querySelector('span');
          let current = parseInt(countEl.textContent, 10);
          countEl.textContent = res.liked ? current + 1 : Math.max(0, current - 1);
          heartEl.textContent = res.liked ? '❤️' : '🤍';
        }
      });
    });
  }

  function openCreatePostModal() {
    if (!requireAuth('create a post')) return;
    if (!createPostModal) return;
    createPostModal.classList.add('open');
    createPostModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closeCreatePostModal() {
    if (!createPostModal) return;
    createPostModal.classList.remove('open');
    createPostModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (openCreatePostBtn) openCreatePostBtn.addEventListener('click', openCreatePostModal);
  if (postModalClose) postModalClose.addEventListener('click', closeCreatePostModal);
  if (postModalCancel) postModalCancel.addEventListener('click', closeCreatePostModal);
  if (createPostModal) {
    createPostModal.addEventListener('click', (e) => {
      if (e.target === createPostModal) closeCreatePostModal();
    });
  }

  if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = postCategorySelect ? postCategorySelect.value : 'General';
      const title = postTitleInput ? postTitleInput.value.trim() : '';
      const content = postContentInput ? postContentInput.value.trim() : '';
      const tags = postTagsInput ? postTagsInput.value.trim() : '';

      if (!title || !content) {
        showToast('Title and content are required.', '⚠️');
        return;
      }

      const res = await api('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({ category, title, content, tags })
      });

      if (res.ok) {
        closeCreatePostModal();
        createPostForm.reset();
        showToast('Discussion posted to community!', '🚀');
        loadCommunityPosts();
      } else {
        showToast(res.error || 'Failed to publish post.', '⚠️');
      }
    });
  }

  feedFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      feedFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFeedCategory = btn.dataset.feedCat || 'all';
      loadCommunityPosts();
    });
  });

  // -------------------------------------------------------------
  // 17. REVIEWS & RATINGS
  // -------------------------------------------------------------
  const reviewStackContainer = document.querySelector('#review-stack-container');
  const ratingModal = document.querySelector('#rating-modal');
  const ratingModalClose = document.querySelector('#rating-modal-close');
  const ratingModalCancel = document.querySelector('#rating-modal-cancel');
  const ratingForm = document.querySelector('#rating-form');
  const ratingPartnerSelect = document.querySelector('#rating-partner-select');
  const ratingStarsPicker = document.querySelector('#rating-stars-picker');
  const inputRatingVal = document.querySelector('#input-rating-val');
  const inputReviewText = document.querySelector('#input-review-text');
  const openRatingModalBtn = document.querySelector('#open-rating-modal-btn');

  async function loadReviews() {
    if (!reviewStackContainer) return;
    const res = await api('/api/reviews');
    if (!res.ok || !Array.isArray(res.reviews)) return;

    const reviews = res.reviews;

    if (reviews.length === 0) {
      reviewStackContainer.innerHTML = `
        <div style="background: var(--card-bg); border: 1.5px dashed var(--line); border-radius: 16px; padding: 24px; text-align: center; color: var(--ink-soft);">
          <p style="font-size: 14px; margin: 0 0 10px;">No reviews submitted yet. Complete your first skill exchange to leave a review!</p>
        </div>
      `;
      return;
    }

    const firstTwo = reviews.slice(0, 2);
    let cardsHtml = '';

    firstTwo.forEach((rev, idx) => {
      const isFront = idx === 0;
      const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      const avatarSrc = rev.reviewer_avatar || 'person 6.jpeg';

      cardsHtml += `
        <article class="review-card ${isFront ? 'review-front' : 'review-back'}">
          <span class="rating" style="color: #f59e0b;">${stars}</span>
          <p>“${escapeHtml(rev.review_text)}”</p>
          <div>
            <span class="mini-portrait">
              <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(rev.reviewer_name)}" />
            </span>
            <div>
              <strong>${escapeHtml(rev.reviewer_name)}</strong>
              <small>${escapeHtml(rev.reviewer_role || 'Skill Swapper')}</small>
            </div>
          </div>
        </article>
      `;
    });

    const avg = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

    cardsHtml += `
      <span class="stat-bubble">
        <b>${avg}/5</b>
        <small>rating</small>
      </span>
    `;

    reviewStackContainer.innerHTML = cardsHtml;
  }

  function openRatingModal(preselectedUserId = null) {
    if (!ratingModal || !ratingPartnerSelect) return;

    ratingPartnerSelect.innerHTML = '<option value="" disabled selected>Select partner to review...</option>';
    const candidates = allRegisteredUsers.filter(u => currentUser && u.id !== currentUser.id);

    candidates.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.full_name} (${u.role_title || 'Peer'})`;
      if (preselectedUserId && String(u.id) === String(preselectedUserId)) {
        opt.selected = true;
      }
      ratingPartnerSelect.appendChild(opt);
    });

    ratingModal.classList.add('open');
    ratingModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
  }

  function closeRatingModal() {
    if (!ratingModal) return;
    ratingModal.classList.remove('open');
    ratingModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (openRatingModalBtn) openRatingModalBtn.addEventListener('click', () => openRatingModal());
  if (chatRatePartnerBtn) {
    chatRatePartnerBtn.addEventListener('click', () => {
      if (activeConversationPeer) openRatingModal(activeConversationPeer.id);
      else openRatingModal();
    });
  }

  if (ratingModalClose) ratingModalClose.addEventListener('click', closeRatingModal);
  if (ratingModalCancel) ratingModalCancel.addEventListener('click', closeRatingModal);
  if (ratingModal) {
    ratingModal.addEventListener('click', (e) => {
      if (e.target === ratingModal) closeRatingModal();
    });
  }

  if (ratingStarsPicker) {
    const starBtns = ratingStarsPicker.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.rating, 10);
        if (inputRatingVal) inputRatingVal.value = val;
        starBtns.forEach(b => {
          const bVal = parseInt(b.dataset.rating, 10);
          b.classList.toggle('active', bVal <= val);
        });
      });
    });
  }

  if (ratingForm) {
    ratingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const revieweeId = ratingPartnerSelect ? ratingPartnerSelect.value : '';
      const rating = inputRatingVal ? inputRatingVal.value : '5';
      const reviewText = inputReviewText ? inputReviewText.value.trim() : '';

      if (!revieweeId || !reviewText) {
        showToast('Please select a partner and write your review.', '⚠️');
        return;
      }

      const res = await api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          reviewee_id: revieweeId,
          rating,
          review_text: reviewText
        })
      });

      if (res.ok) {
        closeRatingModal();
        ratingForm.reset();
        showToast('Review submitted and recorded in database!', '⭐');
        await loadReviews();
        await loadRegisteredUsersAndRender();
        await loadPlatformStats();
      } else {
        showToast(res.error || 'Failed to submit review.', '⚠️');
      }
    });
  }

  // -------------------------------------------------------------
  // 18. PROFILE & LEARNING GOALS EDITOR WITH AVATAR GALLERY
  // -------------------------------------------------------------
  function updateGoalsDisplay(goals) {
    const menuLearning = document.querySelector('#menu-user-learning');
    const menuTeach = document.querySelector('#menu-user-teach');
    const dispLearning = document.querySelector('#display-my-learning');
    const dispProject = document.querySelector('#display-my-project');
    const dispTeach = document.querySelector('#display-my-teach');
    const dispCadence = document.querySelector('#display-my-cadence');

    if (menuLearning) menuLearning.textContent = goals.learning;
    if (menuTeach) menuTeach.textContent = goals.teach;
    if (dispLearning) dispLearning.textContent = goals.learning;
    if (dispProject) dispProject.textContent = goals.project;
    if (dispTeach) dispTeach.textContent = goals.teach;
    if (dispCadence) dispCadence.textContent = goals.cadence;

    const inputName = document.querySelector('#input-user-fullname');
    const inputRole = document.querySelector('#input-user-role');
    const inputBio = document.querySelector('#input-user-bio');
    const inputAvatar = document.querySelector('#input-user-avatar');
    const inputLearning = document.querySelector('#input-user-learning');
    const inputProject = document.querySelector('#input-user-project');
    const inputTeach = document.querySelector('#input-user-teach');
    const inputCadence = document.querySelector('#input-user-cadence');

    if (inputName) inputName.value = goals.fullname || '';
    if (inputRole) inputRole.value = goals.role || '';
    if (inputBio) inputBio.value = goals.bio || '';
    if (inputAvatar) inputAvatar.value = goals.avatar || 'default-avatar.svg';
    if (inputLearning) inputLearning.value = goals.learning;
    if (inputProject) inputProject.value = goals.project;
    if (inputTeach) inputTeach.value = goals.teach;
    if (inputCadence) inputCadence.value = goals.cadence;

    // Highlight selected avatar option
    const gallery = document.querySelector('#avatar-picker-gallery');
    if (gallery) {
      gallery.querySelectorAll('.avatar-pick-option').forEach(img => {
        img.classList.toggle('selected', img.dataset.src === goals.avatar);
      });
    }
  }

  const goalsModal = document.querySelector('#learning-goals-modal');
  const goalsModalClose = document.querySelector('#goals-modal-close');
  const goalsModalCancel = document.querySelector('#goals-modal-cancel');
  const goalsForm = document.querySelector('#learning-goals-form');
  const triggerGoalsModalBtn = document.querySelector('#trigger-goals-modal-btn');
  const menuEditGoalsBtn = document.querySelector('#menu-edit-goals-btn');
  const emptyStateEditBtn = document.querySelector('#empty-state-edit-btn');
  const avatarPickerGallery = document.querySelector('#avatar-picker-gallery');
  const inputUserAvatar = document.querySelector('#input-user-avatar');

  const avatarFile = document.querySelector('#input-avatar-file');
  const avatarPreview = document.querySelector('#avatar-preview-img');
  
  if (avatarFile) {
    avatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (avatarPreview) avatarPreview.src = dataUrl;
        if (inputUserAvatar) inputUserAvatar.value = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function openGoalsModal() {
    if (!goalsModal) return;
    goalsModal.classList.add('open');
    goalsModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    const input = document.querySelector('#input-user-fullname');
    if (input) setTimeout(() => input.focus(), 150);
  }

  function closeGoalsModal() {
    if (!goalsModal) return;
    goalsModal.classList.remove('open');
    goalsModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (triggerGoalsModalBtn) triggerGoalsModalBtn.addEventListener('click', openGoalsModal);
  if (emptyStateEditBtn) emptyStateEditBtn.addEventListener('click', openGoalsModal);
  if (menuEditGoalsBtn) {
    menuEditGoalsBtn.addEventListener('click', () => {
      if (userDropdownMenu) userDropdownMenu.classList.remove('show');
      openGoalsModal();
    });
  }
  if (goalsModalClose) goalsModalClose.addEventListener('click', closeGoalsModal);
  if (goalsModalCancel) goalsModalCancel.addEventListener('click', closeGoalsModal);
  if (goalsModal) {
    goalsModal.addEventListener('click', (e) => {
      if (e.target === goalsModal) closeGoalsModal();
    });
  }

  if (goalsForm) {
    goalsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.querySelector('#input-user-fullname')?.value.trim() || currentUser.full_name;
      const role_title = document.querySelector('#input-user-role')?.value.trim() || 'Skill Swapper';
      const bio = document.querySelector('#input-user-bio')?.value.trim() || '';
      const avatar_url = inputUserAvatar ? inputUserAvatar.value : 'default-avatar.svg';
      const skills_learn = '';
      const project_interest = '';
      const skills_teach = '';
      const cadence = 'Weekly Google Meet Sessions';

      const res = await api('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name,
          role_title,
          bio,
          avatar_url,
          skills_learn,
          project_interest,
          skills_teach,
          cadence
        })
      });

      if (res.ok && res.user) {
        currentUser = res.user;
        const firstName = res.user.full_name.split(' ')[0];
        if (headerUserName) headerUserName.textContent = firstName;
        if (headerUserAvatar) headerUserAvatar.src = res.user.avatar_url;
        if (dropdownUserName) dropdownUserName.textContent = res.user.full_name;

        const myProfileName = document.querySelector('#my-profile-name');
        const myProfileRole = document.querySelector('#my-profile-role');
        const myProfileAvatar = document.querySelector('#my-profile-avatar-img');

        if (myProfileName) myProfileName.textContent = res.user.full_name;
        if (myProfileRole) myProfileRole.textContent = res.user.role_title;
        if (myProfileAvatar) myProfileAvatar.src = res.user.avatar_url;

        updateGoalsDisplay({
          fullname: res.user.full_name,
          role: res.user.role_title,
          bio: res.user.bio,
          avatar: res.user.avatar_url,
          learning: res.user.skills_learn,
          project: res.user.project_interest,
          teach: res.user.skills_teach,
          cadence: res.user.cadence
        });

        closeGoalsModal();
        showToast('Profile and goals updated successfully!', '🎯');
        await loadRegisteredUsersAndRender();
        await loadHeroMatches();
      } else {
        showToast(res.error || 'Failed to update profile.', '⚠️');
      }
    });
  }

  // -------------------------------------------------------------
  // 19. THEME & INTERACTIVE HELPERS
  // -------------------------------------------------------------
  try {
    const savedTheme = localStorage.getItem('skillswap_theme');
    if (savedTheme === 'dark') body.dataset.theme = 'dark';
  } catch (e) {}

  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.dataset.theme === 'dark';
      if (isDark) {
        delete body.dataset.theme;
        try { localStorage.setItem('skillswap_theme', 'light'); } catch (e) {}
        showToast('Light mode enabled', '☀️');
      } else {
        body.dataset.theme = 'dark';
        try { localStorage.setItem('skillswap_theme', 'dark'); } catch (e) {}
        showToast('Dark mode enabled', '🌙');
      }
    });
  }

  document.querySelectorAll('[data-scroll-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scrollTarget);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion;
  if (canTilt) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('pointerenter', () => card.style.setProperty('--tilt-lift', '-5px'));
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-py * 6).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(px * 7).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--tilt-lift', '0px');
      });
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProposalModal();
      closeMeetModal();
      closeGoogleModal();
      closeGoalsModal();
      closeRatingModal();
      closeScheduleSessionModal();
      closeCreatePostModal();
      closePeerProfileModal();
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // 20. INITIALIZE APP ON PAGE LOAD
  // -------------------------------------------------------------
  async function checkInitialSession() {
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

  
  // -------------------------------------------------------------
  // SCROLL SPY FOR NAVIGATION
  // -------------------------------------------------------------
  const navLinks = document.querySelectorAll('.main-nav a');
  const sections = Array.from(navLinks).map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger when section crosses the middle of viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Also highlight Home on load if at top
  window.addEventListener('scroll', () => {
    if (window.scrollY < 100) {
      navLinks.forEach(link => link.classList.remove('active'));
      const homeLink = document.querySelector('.main-nav a[href="#home"]');
      if (homeLink) homeLink.classList.add('active');
    }
  });


  checkInitialSession();

  // -------------------------------------------------------------
  // 21. SWIPE FEATURE & FEATURED PROFILES
  // -------------------------------------------------------------
  const swipeDeck = document.querySelector('#swipe-deck');
  const swipeEmpty = document.querySelector('#swipe-empty');
  const swipeLeftBtn = document.querySelector('#swipe-left-btn');
  const swipeRightBtn = document.querySelector('#swipe-like-btn');
  const swipeViewBtn = document.querySelector('#swipe-view-btn');
  const swipeConnectBtn = document.querySelector('#swipe-connect-btn');
  const swipeResetBtn = document.querySelector('#swipe-reset-btn');
  const featuredGrid = document.querySelector('#featured-grid');

  let swipeQueue = [];
  let currentSwipeIndex = 0;
  let isDraggingCard = false;

  async function initSwipeFeature() {
    if (!swipeDeck) return;
    const res = await api('/api/users');
    if (!res.ok || !Array.isArray(res.users)) return;
    swipeQueue = res.users
      .filter(u => !currentUser || u.id !== currentUser.id)
      .sort(() => Math.random() - 0.5);
    currentSwipeIndex = 0;
    renderSwipeCards();
    loadFeaturedProfiles();
  }

  function renderSwipeCards() {
    if (!swipeDeck || !swipeEmpty) return;
    swipeDeck.querySelectorAll('.swipe-card').forEach(c => c.remove());
    const remaining = swipeQueue.slice(currentSwipeIndex);
    if (remaining.length === 0) {
      swipeEmpty.classList.add('visible');
      return;
    }
    swipeEmpty.classList.remove('visible');
    const visible = remaining.slice(0, 3).reverse();
    visible.forEach((user, i) => {
      const card = buildSwipeCard(user);
      const isTop = i === visible.length - 1;
      const offset = (visible.length - 1 - i) * 8;
      card.style.zIndex = i + 1;
      card.style.transform = isTop ? '' : 'translateY(' + offset + 'px) rotate(' + (i % 2 === 0 ? -1.5 : 1.5) + 'deg)';
      card.style.opacity = isTop ? '1' : String(0.7 + i * 0.15);
      swipeDeck.insertBefore(card, swipeDeck.firstChild);
    });
    const topCard = swipeDeck.querySelector('.swipe-card:last-child');
    if (topCard) attachSwipeDrag(topCard);
  }

  function buildSwipeCard(user) {
    const card = document.createElement('div');
    card.className = 'swipe-card';
    card.dataset.userId = user.id;
    const skills = (user.skills_teach || '').split(',').slice(0, 3).map(s => s.trim()).filter(Boolean);
    const pills = skills.map(s => '<span class="swipe-skill-tag">' + escapeHtml(s) + '</span>').join('');
    const avatarHtml = user.avatar_url
      ? '<img class="swipe-card-img" src="' + escapeHtml(user.avatar_url) + '" alt="' + escapeHtml(user.full_name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'default-avatar.svg\';" />'
      : '<div class="swipe-card-img-placeholder">&#129489;&#8205;&#128187;</div>';
    card.innerHTML = '<div class="swipe-like-overlay">&#128154; CONNECT</div>' +
      '<div class="swipe-nope-overlay">&#10005; PASS</div>' +
      avatarHtml +
      '<div class="swipe-card-body">' +
        '<h3 class="swipe-card-name">' + escapeHtml(user.full_name) + ' <span class="verified">&#10003;</span></h3>' +
        '<p class="swipe-card-role">' + escapeHtml(user.role_title || 'Skill Swapper') + '</p>' +
        '<div class="swipe-card-skills">' + (pills || '<span class="swipe-skill-tag">Open to Exchange</span>') + '</div>' +
        (user.skills_learn ? '<div class="swipe-card-wants">&#127919; Wants to learn: <strong>' + escapeHtml(user.skills_learn.split(',')[0].trim()) + '</strong></div>' : '') +
      '</div>';
    return card;
  }

  function attachSwipeDrag(card) {
    let sx = 0, sy = 0, cx = 0, cy = 0;
    const likeEl = card.querySelector('.swipe-like-overlay');
    const nopeEl = card.querySelector('.swipe-nope-overlay');

    function onStart(e) {
      sx = e.touches ? e.touches[0].clientX : e.clientX;
      sy = e.touches ? e.touches[0].clientY : e.clientY;
      card.classList.add('dragging');
      isDraggingCard = true;
    }

    function onMove(e) {
      if (!isDraggingCard) return;
      cx = (e.touches ? e.touches[0].clientX : e.clientX) - sx;
      cy = (e.touches ? e.touches[0].clientY : e.clientY) - sy;
      card.style.transform = 'translateX(' + cx + 'px) translateY(' + cy + 'px) rotate(' + (cx * 0.08) + 'deg)';
      const ratio = Math.min(Math.abs(cx) / 100, 1);
      if (likeEl) likeEl.style.opacity = cx > 0 ? ratio : 0;
      if (nopeEl) nopeEl.style.opacity = cx < 0 ? ratio : 0;
    }

    function onEnd() {
      if (!isDraggingCard) return;
      isDraggingCard = false;
      card.classList.remove('dragging');
      if (Math.abs(cx) > 80) {
        doSwipe(card, cx > 0 ? 'right' : 'left');
      } else {
        card.style.transform = '';
        if (likeEl) likeEl.style.opacity = '0';
        if (nopeEl) nopeEl.style.opacity = '0';
      }
    }

    card.addEventListener('mousedown', onStart);
    card.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  }

    async function doSwipe(card, direction) {
    if (!requireAuth('swipe profiles')) { card.style.transform = ''; return; }
    const userId = card.dataset.userId;
    card.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');
    
    setTimeout(() => {
      card.remove();
      currentSwipeIndex++;
      renderSwipeCards();
      if (direction === 'right') setTimeout(loadFeaturedProfiles, 600);
    }, 460);

    if (userId && currentUser) {
      const res = await api('/api/swipe', { method: 'POST', body: JSON.stringify({ target_id: parseInt(userId), direction }) });
      if (res && res.isMatch) {
        // Boom! It's a match!
        showToast('?? ITS A MATCH! A new chat has been created in Sessions.', '??');
        loadConversations();
        
        // Show match notification logic if we want a big alert
        const userName = card.querySelector('.swipe-card-name')?.textContent || 'this user';
        alert(`It's a Match! You and ${userName.trim()} both swiped right. You can now message each other in the Sessions/Discussions tab!`);
      } else if (direction === 'right') {
        showToast('Connection interest recorded! ??', '?');
      }
    }
  }

  if (swipeLeftBtn) {
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
  }

  if (swipeResetBtn) {
    swipeResetBtn.addEventListener('click', () => {
      currentSwipeIndex = 0;
      swipeQueue = swipeQueue.slice().sort(() => Math.random() - 0.5);
      renderSwipeCards();
      showToast('Shuffled profiles! Ready to swipe.', '&#9856;');
    });
  }

  async function loadFeaturedProfiles() {
    if (!featuredGrid) return;
    const res = await api('/api/featured?limit=6');
    if (!res.ok || !Array.isArray(res.featured)) return;
    const profiles = res.featured;
    if (profiles.length === 0) {
      featuredGrid.innerHTML = '<p style="text-align:center;color:var(--muted);grid-column:1/-1;padding:32px;">No featured profiles yet. Start swiping to help rank the community!</p>';
      return;
    }
    const rankBadges = ['&#129351; Top Match', '&#129352; #2', '&#129353; #3', '&#128293; Hot', '&#11088; Rising', '&#128161; Trending'];
    featuredGrid.innerHTML = profiles.map((p, i) => {
      const skills = (p.skills_teach || '').split(',').slice(0, 3).map(s => s.trim()).filter(Boolean);
      const pills = skills.map(s => '<span class="featured-skill-tag">' + escapeHtml(s) + '</span>').join('');
      const badge = rankBadges[i] || '&#11088; Featured';
      return '<div class="featured-card tilt-card">' +
        '<span class="featured-badge">' + badge + '</span>' +
        '<div class="featured-card-top">' +
          '<img class="featured-avatar" src="' + escapeHtml(p.avatar_url || 'default-avatar.svg') + '" alt="' + escapeHtml(p.full_name) + '" loading="lazy" />' +
          '<div><p class="featured-name">' + escapeHtml(p.full_name) + '</p><p class="featured-role">' + escapeHtml(p.role_title || 'Skill Swapper') + '</p></div>' +
        '</div>' +
        '<div class="featured-stats">' +
          '<span class="featured-stat">&#128070; <strong>' + (p.right_swipes || 0) + '</strong> connects</span>' +
          (p.avg_rating ? '<span class="featured-stat">&#11088; <strong>' + p.avg_rating + '</strong></span>' : '') +
        '</div>' +
        '<div class="featured-skills">' + (pills || '<span class="featured-skill-tag">Open to Exchange</span>') + '</div>' +
        '<button class="featured-connect-btn open-proposal-btn" type="button" data-id="' + p.id + '" data-name="' + escapeHtml(p.full_name) + '" data-teach="' + escapeHtml(p.skills_teach || '') + '" data-learn="' + escapeHtml(p.skills_learn || '') + '">Send Exchange Proposal &#8594;</button>' +
      '</div>';
    }).join('');

    featuredGrid.querySelectorAll('.open-proposal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openProposalModal({ id: btn.dataset.id, name: btn.dataset.name, teach: btn.dataset.teach, learn: btn.dataset.learn });
      });
    });
  }

  console.log('%c SkillSwap Dynamic Platform %c Node.js + SQLite Connected ',
    'background:#3B66FF;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;',
    'background:#10B981;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
  );
})();
