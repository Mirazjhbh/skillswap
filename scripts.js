/**
 * SkillSwap Platform - Interactive Core & Living Animations
 * Professional Peer-to-Peer Knowledge Exchange
 */

(() => {
  'use strict';

  // -------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------
  const body = document.body;
  const authGateway = document.querySelector('#auth-gateway');
  const mainApp = document.querySelector('#main-app');
  const toast = document.querySelector('#toast');
  const toastMessage = document.querySelector('#toast-message');
  let toastTimer;

  // -------------------------------------------------------------
  // Toast System
  // -------------------------------------------------------------
  function showToast(message, icon = '✓') {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    const iconEl = toast.querySelector('span');
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
  }

  // -------------------------------------------------------------
  // 1. SLOW-MOVING BLUE/PURPLE PARTICLES & GLOWING WAVES CANVAS
  // -------------------------------------------------------------
  const canvas = document.querySelector('#synapse-canvas');
  let ctx = canvas ? canvas.getContext('2d') : null;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let animationFrameId;
  let waveTime = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Blue & Purple Color Palette for Living Aura
  const PALETTE = [
    { r: 59,  g: 102, b: 255 }, // Royal Blue
    { r: 96,  g: 165, b: 250 }, // Sky/Electric Cyan
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

      // Subtle Particle Radial Glow Halo
      ctx.save();
      const glowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3.2);
      glowGrad.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alphaVal})`);
      glowGrad.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Solid Core Dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.min(1, alphaVal * 1.4)})`;
      ctx.fill();
      ctx.restore();
    }
  }

  let nodes = [];
  const NODE_COUNT = 42;

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

  // Draw Smooth Sinusoidal Undulating Glowing Waves
  function renderGlowingWaves(isDark) {
    if (!ctx) return;
    waveTime += 0.007;

    const baseH = canvasHeight * 0.74;
    const step = 20;

    // Wave 1: Deep Blue Oceanic Flow
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

    // Wave 2: Royal Purple Sinusoidal Undulation
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

    // Wave 3: Subtle Luminous Crest Glow Line
    ctx.save();
    ctx.beginPath();
    for (let x = 0; x <= canvasWidth + step; x += step) {
      const y = (baseH - 20) + Math.sin(x * 0.0025 + waveTime * 1.1) * 22;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.22)' : 'rgba(59, 102, 255, 0.14)';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = 'rgba(96, 165, 250, 0.45)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  function renderElegantCanvas() {
    if (!ctx || prefersReducedMotion) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const isDark = body.dataset.theme === 'dark';

    // 1. Render Undulating Glowing Waves
    renderGlowingWaves(isDark);

    // 2. Draw Subtle Inter-Particle Constellation Filaments
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

    // 3. Render and Update Blue/Purple Particle Cloud
    nodes.forEach((n) => {
      n.update();
      n.draw(isDark);
    });

    animationFrameId = requestAnimationFrame(renderElegantCanvas);
  }

  if (canvas) {
    initCanvas();
    window.addEventListener('resize', initCanvas, { passive: true });
    if (!prefersReducedMotion) renderElegantCanvas();
  }

  // -------------------------------------------------------------
  // 2. DYNAMIC REAL-TIME CALENDAR ENGINE (Day-by-Day Auto-Update)
  // -------------------------------------------------------------
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Gateway Weekly Calendar Widget
  const gwCalTitle = document.querySelector('#gw-cal-title');
  const gwCalDays = document.querySelector('#gw-cal-days');
  const gwCalPrev = document.querySelector('#gw-cal-prev');
  const gwCalNext = document.querySelector('#gw-cal-next');

  let currentRealDate = new Date();
  let weekOffset = 0; // In weeks from current week

  function renderGatewayWeekCalendar() {
    if (!gwCalTitle || !gwCalDays) return;

    // Determine the target date for the view
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));

    const todayDate = new Date();
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth();
    const todayDay = todayDate.getDate();

    gwCalTitle.textContent = `${MONTH_NAMES[targetDate.getMonth()]} ${targetDate.getDate()}, ${targetDate.getFullYear()}`;

    // Find Sunday of this week
    const currentDayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ...
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
        showToast(`Date selected: ${MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}, ${dayDate.getFullYear()}`, '📅');
      });

      gwCalDays.appendChild(dayCell);
    }
  }

  if (gwCalPrev) gwCalPrev.addEventListener('click', () => { weekOffset--; renderGatewayWeekCalendar(); });
  if (gwCalNext) gwCalNext.addEventListener('click', () => { weekOffset++; renderGatewayWeekCalendar(); });
  renderGatewayWeekCalendar();

  // Main Website Monthly Calendar (In Sessions Section)
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
    const firstDayIndex = (new Date(appCalYear, appCalMonth, 1).getDay() + 6) % 7; // Monday-first index

    const prevMonthDays = new Date(appCalYear, appCalMonth, 0).getDate();

    const cells = [];
    for (let i = firstDayIndex; i > 0; i--) {
      cells.push(`<span class="muted">${prevMonthDays - i + 1}</span>`);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = appCalYear === realYear && appCalMonth === realMonth && d === realDay;
      const hasSession = d === 18;
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
        showToast(`Viewing schedule for ${MONTH_NAMES[appCalMonth]} ${d}, ${appCalYear}`, '📅');
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
  // 3. PRE-AUTH GATEWAY: FRONT SIGN-UP, LOG IN & STRENGTH METER
  // -------------------------------------------------------------
  const gatewayAuthForm = document.querySelector('#gateway-auth-form');
  const gwCardTitle = document.querySelector('#gateway-card-title');
  const gwCardSubtitle = document.querySelector('#gateway-card-subtitle');
  const gwSubmitBtn = document.querySelector('#gw-submit-btn');
  const gwModeToggle = document.querySelector('#gw-mode-toggle');
  const gwFooterPrompt = document.querySelector('#gw-footer-prompt');
  const tabLogin = document.querySelector('#tab-login');
  const tabSignup = document.querySelector('#tab-signup');
  const gwNavLoginBtn = document.querySelector('#gw-nav-login-btn');
  const gwNavSignupBtn = document.querySelector('#gw-nav-signup-btn');
  const siteNavLoginBtn = document.querySelector('#site-nav-login-btn');
  const siteNavSignupBtn = document.querySelector('#site-nav-signup-btn');
  const gwTopSignupBtn = document.querySelector('#gw-top-signup-btn');
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
  const gwGoogleBtn = document.querySelector('#gw-google-btn');
  const gwGithubBtn = document.querySelector('#gw-github-btn');
  const gwGoogleLabel = document.querySelector('#gw-google-label');
  const gwGithubLabel = document.querySelector('#gw-github-label');
  const gwForgotLink = document.querySelector('#gw-forgot-link');

  const userMenuBtn = document.querySelector('#user-menu-btn');
  const userDropdownMenu = document.querySelector('#user-dropdown-menu');
  const appLogoutBtn = document.querySelector('#app-logout-btn');
  const headerUserName = document.querySelector('#header-user-name');
  const dropdownUserName = document.querySelector('#dropdown-user-name');
  const dropdownUserEmail = document.querySelector('#dropdown-user-email');

  let isSignUpMode = false;

  function setGatewayMode(signup) {
    isSignUpMode = signup;
    if (tabLogin && tabSignup) {
      tabLogin.classList.toggle('active', !signup);
      tabSignup.classList.toggle('active', signup);
      tabLogin.setAttribute('aria-selected', !signup);
      tabSignup.setAttribute('aria-selected', signup);
    }
    if (gwNavLoginBtn && gwNavSignupBtn) {
      gwNavLoginBtn.classList.toggle('active', !signup);
      gwNavSignupBtn.classList.toggle('active', signup);
    }

    if (isSignUpMode) {
      gwCardTitle.textContent = 'Create Your Free Account';
      gwCardSubtitle.textContent = 'Trade skills, build freelance careers, and grow with 10,000+ peers.';
      gwSubmitBtn.textContent = 'Create Your Free Account →';
      gwFooterPrompt.textContent = 'Already have an account?';
      gwModeToggle.textContent = 'Log in';
      if (fieldSignupName) fieldSignupName.hidden = false;
      if (fieldSignupSkill) fieldSignupSkill.hidden = false;
      if (passStrengthMeter) passStrengthMeter.hidden = false;
      if (gwNameInput) {
        gwNameInput.required = true;
        setTimeout(() => gwNameInput.focus(), 80);
      }
      if (gwGoogleLabel) gwGoogleLabel.textContent = 'Sign up with Google';
      if (gwGithubLabel) gwGithubLabel.textContent = 'Sign up with GitHub';
    } else {
      gwCardTitle.textContent = 'Welcome Back!';
      gwCardSubtitle.textContent = 'Login to your account or create a new one to get started.';
      gwSubmitBtn.textContent = 'Login';
      gwFooterPrompt.textContent = "Don't have an account?";
      gwModeToggle.textContent = 'Sign up free';
      if (fieldSignupName) fieldSignupName.hidden = true;
      if (fieldSignupSkill) fieldSignupSkill.hidden = true;
      if (passStrengthMeter) passStrengthMeter.hidden = true;
      if (gwNameInput) gwNameInput.required = false;
      if (gwGoogleLabel) gwGoogleLabel.textContent = 'Continue with Google';
      if (gwGithubLabel) gwGithubLabel.textContent = 'Continue with GitHub';
    }
  }

  if (tabLogin) tabLogin.addEventListener('click', () => setGatewayMode(false));
  if (tabSignup) tabSignup.addEventListener('click', () => setGatewayMode(true));
  if (gwNavLoginBtn) {
    gwNavLoginBtn.addEventListener('click', () => {
      setGatewayMode(false);
      const card = document.querySelector('.gateway-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (gwEmailInput) setTimeout(() => gwEmailInput.focus(), 120);
    });
  }
  if (gwNavSignupBtn) {
    gwNavSignupBtn.addEventListener('click', () => {
      setGatewayMode(true);
      const card = document.querySelector('.gateway-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (gwNameInput) setTimeout(() => gwNameInput.focus(), 120);
    });
  }
  if (gwTopSignupBtn) {
    gwTopSignupBtn.addEventListener('click', () => {
      setGatewayMode(true);
      const card = document.querySelector('.gateway-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  if (gwModeToggle) {
    gwModeToggle.addEventListener('click', () => setGatewayMode(!isSignUpMode));
  }

  // Password Strength Evaluation
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

  // Mascot playful interaction when typing password
  const mascotEl = document.querySelector('.mascot-companion');
  if (gwPassInput && mascotEl) {
    gwPassInput.addEventListener('focus', () => {
      mascotEl.style.transform = 'translateY(-14px) rotate(-8deg) scale(1.08)';
    });
    gwPassInput.addEventListener('blur', () => {
      mascotEl.style.transform = '';
    });
  }

  // -------------------------------------------------------------
  // 4. ORCHESTRATED LIVING HERO ANIMATION SEQUENCE & 3D PARALLAX
  // -------------------------------------------------------------
  function triggerHeroAnimationSequence() {
    const heroTitleWords = document.querySelectorAll('#hero-stagger-title .stagger-word');
    const userCard1 = document.querySelector('#user-card-1');
    const userCard2 = document.querySelector('#user-card-2');
    const centerHub = document.querySelector('#hero-center-hub');
    const networkSvg = document.querySelector('#hero-network-svg');
    const matchPanel = document.querySelector('#hero-match-panel');
    const connectBtn = document.querySelector('.connect-pulse-btn');

    // Stage 0: Initial states for choreography
    if (userCard1) {
      userCard1.style.opacity = '0';
      userCard1.style.transform = 'translateY(35px)';
      userCard1.style.transition = 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    if (userCard2) {
      userCard2.style.opacity = '0';
      userCard2.style.transform = 'translateY(35px)';
      userCard2.style.transition = 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    if (centerHub) {
      centerHub.style.opacity = '0';
      centerHub.style.transform = 'translate(-50%, -50%) scale(0.65)';
      centerHub.style.transition = 'opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    if (networkSvg) {
      networkSvg.style.opacity = '0';
      networkSvg.style.transition = 'opacity 0.9s ease';
    }
    if (matchPanel) {
      matchPanel.style.opacity = '0';
      matchPanel.style.transform = 'translateX(50px)';
      matchPanel.style.transition = 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    // Step 1: Heading words cascade in (0ms - 550ms)
    heroTitleWords.forEach((word, index) => {
      word.style.animation = 'none';
      word.offsetHeight; // trigger reflow
      word.style.animation = `wordRevealCascade 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards ${(index + 1) * 70}ms`;
    });

    // Step 2: User Cards Float In (380ms)
    setTimeout(() => {
      if (userCard1) {
        userCard1.style.opacity = '1';
        userCard1.style.transform = 'translateY(0)';
      }
      if (userCard2) {
        userCard2.style.opacity = '1';
        userCard2.style.transform = 'translateY(0)';
      }
    }, 380);

    // Step 3: Center SkillSwap Object Activates (800ms)
    setTimeout(() => {
      if (centerHub) {
        centerHub.style.opacity = '1';
        centerHub.style.transform = 'translate(-50%, -50%) scale(1)';
        const aura = centerHub.querySelector('.hub-neon-aura');
        if (aura) {
          aura.style.animation = 'hubAuraPulse 3.8s ease-in-out infinite alternate';
        }
      }
    }, 800);

    // Step 4: Connection Lines Light Up & Photons Stream (1150ms)
    setTimeout(() => {
      if (networkSvg) {
        networkSvg.style.opacity = '1';
      }
    }, 1150);

    // Step 5: Match Panel Slides In + Fades In (1500ms)
    setTimeout(() => {
      if (matchPanel) {
        matchPanel.style.opacity = '1';
        matchPanel.style.transform = 'translateX(0)';
      }
    }, 1500);

    // Step 6: Connect Button Pulse & Continuous Living Floating (2100ms)
    setTimeout(() => {
      if (connectBtn) {
        connectBtn.classList.add('pulse-active');
      }
      // Re-enable smooth hovering / 3D transform transitions
      if (userCard1) userCard1.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      if (userCard2) userCard2.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      if (centerHub) centerHub.style.transition = '';
      if (matchPanel) matchPanel.style.transition = 'box-shadow 0.3s ease';
    }, 2100);
  }

  // 3D Cursor Parallax on Hero Visual Stage
  const heroVisual = document.querySelector('#hero-interactive-stage');
  if (heroVisual && !prefersReducedMotion) {
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let isHovering = false;

    heroVisual.addEventListener('pointermove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      targetY = (e.clientY - rect.top) / rect.height - 0.5;
      isHovering = true;
    });

    heroVisual.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      isHovering = false;
    });

    function applyParallax() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      const userCard1 = document.querySelector('#user-card-1');
      const userCard2 = document.querySelector('#user-card-2');
      const centerHub = document.querySelector('#hero-center-hub');
      const matchPanel = document.querySelector('#hero-match-panel');

      if (isHovering || Math.abs(currentX) > 0.001 || Math.abs(currentY) > 0.001) {
        if (centerHub) {
          centerHub.style.transform = `translate(calc(-50% + ${currentX * -20}px), calc(-50% + ${currentY * -20}px)) rotateY(${currentX * 14}deg) rotateX(${-currentY * 14}deg)`;
        }
        if (userCard1) {
          userCard1.style.transform = `translate3d(${currentX * 24}px, ${currentY * 24}px, 0) rotateY(${currentX * 12}deg) rotateX(${-currentY * 12}deg)`;
        }
        if (userCard2) {
          userCard2.style.transform = `translate3d(${currentX * -18}px, ${currentY * -18}px, 0) rotateY(${currentX * 10}deg) rotateX(${-currentY * 10}deg)`;
        }
        if (matchPanel) {
          matchPanel.style.transform = `translate3d(${currentX * 12}px, ${currentY * 12}px, 0) rotateY(${currentX * 6}deg) rotateX(${-currentY * 6}deg)`;
        }
      }

      requestAnimationFrame(applyParallax);
    }
    requestAnimationFrame(applyParallax);
  }

  // UNLOCK WEBSITE ACCESS & TRIGGER ANIMATION SEQUENCE
  function unlockWebsiteAccess(userData = 'Alex Chen', userEmail = 'alex.chen@skillswap.io') {
    let user = typeof userData === 'object' && userData !== null
      ? userData
      : { fullName: userData, email: userEmail };

    const firstName = (user.fullName || 'Member').split(' ')[0];
    if (headerUserName) headerUserName.textContent = firstName;
    if (dropdownUserName) dropdownUserName.textContent = user.fullName || 'Member';
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';
    
    const myProfileName = document.querySelector('#my-profile-name');
    if (myProfileName) myProfileName.textContent = user.fullName || firstName;

    // Update avatar if provided
    if (user.avatarUrl) {
      const headerImg = document.querySelector('.user-avatar-btn img');
      if (headerImg) {
        const root = (window.SkillSwapAPI && window.SkillSwapAPI.SERVER_ROOT) || '';
        headerImg.src = user.avatarUrl.startsWith('/uploads') ? root + user.avatarUrl : user.avatarUrl;
      }
    }

    // Update user goals if available in user object
    if (user.learnSkill || user.teachSkill || user.targetProject || user.cadence) {
      const goals = {
        learning: user.learnSkill || 'Full-Stack Next.js & AI Agents',
        project: user.targetProject || 'Building an AI Agent Developer Platform',
        teach: user.teachSkill || 'UI/UX Design, Figma & Design Systems',
        cadence: user.cadence || 'Weekly Google Meet Sessions'
      };
      saveLearningGoals(goals, false);
    } else {
      updateGoalsDisplay(loadLearningGoals());
    }

    // Animate Gateway out
    authGateway.classList.add('gateway-unlocked');
    mainApp.hidden = false;
    body.classList.remove('modal-open');

    // Trigger Choreographed Sequence
    triggerHeroAnimationSequence();

    showToast(`Welcome to SkillSwap, ${firstName}!`, '🎉');
  }

  // Quick Live Preview / Guest Demo
  if (gwTopDemoBtn) {
    gwTopDemoBtn.addEventListener('click', () => {
      unlockWebsiteAccess({ fullName: 'Guest Explorer', email: 'guest@skillswap.io' });
    });
  }
  if (gwDemoBtn) {
    gwDemoBtn.addEventListener('click', () => {
      unlockWebsiteAccess({ fullName: 'Guest Explorer', email: 'guest@skillswap.io' });
    });
  }

  // LOCK WEBSITE ACCESS (Log Out)
  function lockWebsiteAccess() {
    if (window.SkillSwapAPI && typeof window.SkillSwapAPI.logout === 'function') {
      window.SkillSwapAPI.logout();
    }
    authGateway.classList.remove('gateway-unlocked');
    mainApp.hidden = true;
    if (userDropdownMenu) userDropdownMenu.classList.remove('show');
    showToast('Session ended. SkillSwap locked.', '🔒');
  }

  // Site Header Top Navigation: Log In & Sign Up Buttons
  if (siteNavLoginBtn) {
    siteNavLoginBtn.addEventListener('click', () => {
      lockWebsiteAccess();
      setGatewayMode(false);
      const card = document.querySelector('.gateway-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (gwEmailInput) setTimeout(() => gwEmailInput.focus(), 150);
    });
  }
  if (siteNavSignupBtn) {
    siteNavSignupBtn.addEventListener('click', () => {
      lockWebsiteAccess();
      setGatewayMode(true);
      const card = document.querySelector('.gateway-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (gwNameInput) setTimeout(() => gwNameInput.focus(), 150);
    });
  }

  if (gatewayAuthForm) {
    gatewayAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = (gwNameInput && gwNameInput.value.trim()) || 'New Member';
      const email = gwEmailInput ? gwEmailInput.value.trim() : '';
      const password = gwPassInput ? gwPassInput.value : '';
      const skillInput = document.querySelector('#field-signup-skill input');
      const teachSkill = skillInput ? skillInput.value.trim() : '';

      gwSubmitBtn.disabled = true;
      gwSubmitBtn.textContent = 'Authenticating...';

      try {
        const result = isSignUpMode
          ? await window.SkillSwapAPI.signup({ fullName: name, email, password, teachSkill })
          : await window.SkillSwapAPI.login({ email, password });

        gwSubmitBtn.disabled = false;
        gwSubmitBtn.textContent = isSignUpMode ? 'Create Your Free Account →' : 'Login';

        if (result.ok) {
          unlockWebsiteAccess(result.user);
          if (typeof window.SkillSwapAPI.onUnlock === 'function') {
            window.SkillSwapAPI.onUnlock(result.user);
          }
        } else {
          showToast(result.error || 'Authentication failed', '⚠️');
        }
      } catch (err) {
        gwSubmitBtn.disabled = false;
        gwSubmitBtn.textContent = isSignUpMode ? 'Create Your Free Account →' : 'Login';
        unlockWebsiteAccess({ fullName: name, email });
      }
    });
  }

  // Google Account Sign-In Modal Flow
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

  if (gwGoogleBtn) {
    gwGoogleBtn.addEventListener('click', () => {
      openGoogleModal();
    });
  }

  if (googleModalClose) {
    googleModalClose.addEventListener('click', closeGoogleModal);
  }

  if (googleLoginModal) {
    googleLoginModal.addEventListener('click', (e) => {
      if (e.target === googleLoginModal) closeGoogleModal();
    });
  }

  if (googleAccAlex) {
    googleAccAlex.addEventListener('click', () => {
      closeGoogleModal();
      unlockWebsiteAccess('Alex Chen', 'alex.chen@gmail.com');
      showToast('Signed in with Google as Alex Chen (alex.chen@gmail.com)', '✓');
    });
  }

  if (googleCustomSubmit) {
    googleCustomSubmit.addEventListener('click', () => {
      const email = (googleCustomEmail && googleCustomEmail.value.trim()) || 'alex.chen@gmail.com';
      const namePart = email.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      closeGoogleModal();
      unlockWebsiteAccess(formattedName, email);
      showToast(`Signed in with Google as ${formattedName} (${email})`, '✓');
    });
  }

  if (gwForgotLink) {
    gwForgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password reset link sent to your email address.', '✉️');
    });
  }

  // User Profile Dropdown in Main App Header
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

  if (appLogoutBtn) {
    appLogoutBtn.addEventListener('click', lockWebsiteAccess);
  }

  // -------------------------------------------------------------
  // 4. FIND YOUR PEOPLE & DISCOVER SEARCH PIPELINE
  // -------------------------------------------------------------
  const quickSkillSelect = document.querySelector('#quick-skill-select');
  const quickSearchBtn = document.querySelector('#quick-search-btn');
  const quickPills = document.querySelectorAll('.quick-pill');

  const searchInput = document.querySelector('#skill-search');
  const searchButton = document.querySelector('#search-button');
  const searchClear = document.querySelector('#search-clear');
  const cards = [...document.querySelectorAll('.person-card')];
  const filterButtons = [...document.querySelectorAll('.filter')];
  const statusText = document.querySelector('#search-status');
  const emptyState = document.querySelector('#empty-state');
  const activeChipContainer = document.querySelector('#active-chip-container');
  const activeChipText = document.querySelector('#active-chip-text');
  const activeChipClear = document.querySelector('#active-chip-clear');

  let selectedCategory = 'all';

  function filterPeople(highlightSkill = null) {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let count = 0;

    if (searchClear) searchClear.hidden = !query;

    cards.forEach((card) => {
      const categories = (card.dataset.category || '').split(' ');
      const searchData = (card.dataset.search || '').toLowerCase();
      const matchesCategory = selectedCategory === 'all' || categories.includes(selectedCategory);
      const matchesQuery = !query || searchData.includes(query);
      const show = matchesCategory && matchesQuery;

      card.hidden = !show;

      if (show && highlightSkill && searchData.includes(highlightSkill.toLowerCase())) {
        card.classList.remove('search-highlight');
        void card.offsetWidth;
        card.classList.add('search-highlight');
      }

      if (show) count += 1;
    });

    if (statusText) {
      if (query) {
        statusText.textContent = `${count} match${count === 1 ? '' : 'es'} for “${searchInput.value.trim()}”`;
      } else if (selectedCategory !== 'all') {
        statusText.textContent = `Showing ${count} peer${count === 1 ? '' : 's'} in ${selectedCategory}`;
      } else {
        statusText.textContent = `Showing ${count} featured peer${count === 1 ? '' : 's'}`;
      }
    }

    if (activeChipContainer && activeChipText) {
      if (query || selectedCategory !== 'all') {
        activeChipContainer.hidden = false;
        activeChipText.textContent = query ? `Skill: ${searchInput.value.trim()}` : `Category: ${selectedCategory}`;
      } else {
        activeChipContainer.hidden = true;
      }
    }

    if (emptyState) emptyState.hidden = count !== 0;
  }

  function executeFindYourPeople(skill) {
    if (!skill) skill = 'Brand strategy';
    if (searchInput) searchInput.value = skill;

    const lower = skill.toLowerCase();
    let targetCat = 'all';
    if (lower.includes('python') || lower.includes('web') || lower.includes('react') || lower.includes('html')) {
      targetCat = 'tech';
    } else if (lower.includes('brand') || lower.includes('motion') || lower.includes('design') || lower.includes('figma')) {
      targetCat = 'design';
    } else if (lower.includes('illustration') || lower.includes('guitar') || lower.includes('music')) {
      targetCat = 'creative';
    } else if (lower.includes('photography') || lower.includes('ux writing') || lower.includes('business')) {
      targetCat = 'business';
    }

    selectedCategory = targetCat;
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === targetCat));

    const discoverSection = document.querySelector('#discover');
    if (discoverSection) {
      discoverSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
      filterPeople(skill);
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

  quickPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const skill = pill.dataset.skill;
      if (quickSkillSelect) quickSkillSelect.value = skill;
      quickPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      executeFindYourPeople(skill);
    });
  });

  if (searchButton) searchButton.addEventListener('click', () => filterPeople());
  if (searchInput) {
    searchInput.addEventListener('input', () => filterPeople());
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); filterPeople(); }
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      filterPeople();
      searchInput.focus();
    });
  }
  if (activeChipClear) {
    activeChipClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      selectedCategory = 'all';
      filterButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === 'all'));
      filterPeople();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.dataset.filter || 'all';
      filterPeople();
    });
  });

  document.querySelectorAll('.skill-pills span').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      executeFindYourPeople(pill.dataset.skill || pill.textContent.trim());
    });
  });

  // -------------------------------------------------------------
  // 5. INTERACTIVE CHAT SIMULATION WITH PEER REPLY
  // -------------------------------------------------------------
  const chatForm = document.querySelector('#chat-form');
  const chatInput = document.querySelector('#chat-input');
  const chatMessages = document.querySelector('#chat-messages');

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      const outgoing = document.createElement('div');
      outgoing.className = 'message outgoing';
      outgoing.textContent = message;
      chatMessages.appendChild(outgoing);
      chatInput.value = '';
      outgoing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const typingEl = document.createElement('div');
      typingEl.className = 'typing-indicator';
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      chatMessages.appendChild(typingEl);
      typingEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => {
        typingEl.remove();
        const incoming = document.createElement('div');
        incoming.className = 'message incoming';
        const replies = [
          "That sounds brilliant! I've added those items to our shared board.",
          "Awesome point! Let's definitely workshop that in our Meet session on Friday.",
          "Perfect! Looking forward to trading feedback and learning together.",
          "Great question! I'll prepare sample files and notes for us to review."
        ];
        incoming.textContent = replies[Math.floor(Math.random() * replies.length)];
        chatMessages.appendChild(incoming);
        incoming.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 1400);
    });
  }

  const openChatBtn = document.querySelector('#open-chat');
  if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
      const chatCard = document.querySelector('#chat-card');
      if (chatCard) {
        chatCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => chatInput && chatInput.focus(), 300);
      }
    });
  }

  // -------------------------------------------------------------
  // GOOGLE MEET SESSION MANAGEMENT & DIRECT JOIN
  // -------------------------------------------------------------
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
  let currentMeetUrl = localStorage.getItem('skillswap_meet_url') || DEFAULT_MEET_URL;

  function updateActiveMeet(url) {
    currentMeetUrl = url || DEFAULT_MEET_URL;
    localStorage.setItem('skillswap_meet_url', currentMeetUrl);
    if (activeMeetUrlEl) {
      activeMeetUrlEl.href = currentMeetUrl;
      activeMeetUrlEl.textContent = currentMeetUrl.replace(/^https?:\/\//, '');
    }
    if (inputMeetUrl) {
      inputMeetUrl.value = currentMeetUrl;
    }
  }

  // Initialize active Google Meet URL
  updateActiveMeet(currentMeetUrl);

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
    meetShareForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUrl = inputMeetUrl ? inputMeetUrl.value.trim() : currentMeetUrl;
      if (newUrl) {
        updateActiveMeet(newUrl);
        closeMeetModal();
        showToast('Google Meet link shared! Ready for all participants to join.', '📹');

        // Broadcast new Google Meet link to the live simulated peer chat
        const chatMessages = document.querySelector('#chat-messages');
        if (chatMessages) {
          const meetMsg = document.createElement('div');
          meetMsg.className = 'message incoming';
          meetMsg.innerHTML = `📹 <strong>Miraz Montasir:</strong> Shared our session Google Meet link: <a href="${newUrl}" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline; font-weight: 700;">${newUrl}</a>. Ready to join!`;
          chatMessages.appendChild(meetMsg);
          meetMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }

  if (joinSessionBtn) {
    joinSessionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Opening Google Meet room: ${currentMeetUrl}...`, '📹');
      window.open(currentMeetUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // -------------------------------------------------------------
  // 6. PROPOSAL MODAL & BOOKMARKING
  // -------------------------------------------------------------
  const requestModal = document.querySelector('#request-modal');
  const requestPerson = document.querySelector('#request-person');
  const requestForm = document.querySelector('#request-form');
  const requestClose = document.querySelector('#request-modal-close');

  let requestTargetUserId = null;

  function openRequest(person = 'your skill partner', userId = null) {
    if (!requestModal) return;
    requestTargetUserId = userId;
    if (requestPerson) requestPerson.textContent = person;
    requestModal.classList.add('open');
    requestModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    setTimeout(() => {
      const input = requestModal.querySelector('input');
      if (input) input.focus();
    }, 160);
  }

  function closeRequest() {
    if (!requestModal) return;
    requestModal.classList.remove('open');
    requestModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  document.querySelectorAll('.open-request').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRequest(btn.dataset.person || 'your new skill partner', btn.dataset.userId || null);
    });
  });
  // Re-runs when SkillSwapAPI adds new (dynamic) cards to #people-grid.
  window.SkillSwapRebindRequestButtons = function () {
    document.querySelectorAll('.open-request').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openRequest(btn.dataset.person || 'your new skill partner', btn.dataset.userId || null);
      });
    });
  };

  if (requestClose) requestClose.addEventListener('click', closeRequest);
  if (requestModal) {
    requestModal.addEventListener('click', (e) => {
      if (e.target === requestModal) closeRequest();
    });
  }

  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const person = requestPerson ? requestPerson.textContent : 'your peer';
      const learnInput = requestForm.querySelector('[name="learn"]');
      const teachInput = requestForm.querySelector('[name="teach"]');
      const messageInput = requestForm.querySelector('[name="message"]');

      const learn = learnInput ? learnInput.value.trim() : '';
      const teach = teachInput ? teachInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (window.SkillSwapAPI) {
        const result = await window.SkillSwapAPI.sendExchangeRequest({
          recipientId: requestTargetUserId || 1,
          offerSkill: teach,
          requestSkill: learn,
          message: message
        });
        if (!result.ok && result.error) {
          showToast(result.error, '⚠️');
        } else {
          showToast(`Your skill exchange proposal to ${person} is on its way!`, '💌');
        }
      } else {
        showToast(`Your skill exchange proposal to ${person} is on its way!`, '💌');
      }

      closeRequest();
      requestForm.reset();
    });
  }

  // -------------------------------------------------------------
  // 7. LEARNING GOALS & PROFILE SKILL INTEREST MANAGEMENT
  // -------------------------------------------------------------
  const DEFAULT_GOALS = {
    learning: 'Full-Stack Next.js & AI Agents',
    project: 'Building an AI Agent Developer Platform',
    teach: 'UI/UX Design, Figma & Design Systems',
    cadence: 'Weekly Google Meet Sessions'
  };

  function loadLearningGoals() {
    try {
      const saved = localStorage.getItem('skillswap_user_goals');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { ...DEFAULT_GOALS };
  }

  function updateGoalsDisplay(goals) {
    const menuLearning = document.querySelector('#menu-user-learning');
    const menuProject = document.querySelector('#menu-user-project');
    const dispLearning = document.querySelector('#display-my-learning');
    const dispProject = document.querySelector('#display-my-project');
    const dispTeach = document.querySelector('#display-my-teach');
    const dispCadence = document.querySelector('#display-my-cadence');

    if (menuLearning) menuLearning.textContent = goals.learning;
    if (menuProject) menuProject.textContent = goals.project;
    if (dispLearning) dispLearning.textContent = goals.learning;
    if (dispProject) dispProject.textContent = goals.project;
    if (dispTeach) dispTeach.textContent = goals.teach;
    if (dispCadence) dispCadence.textContent = goals.cadence;

    const inputLearning = document.querySelector('#input-user-learning');
    const inputProject = document.querySelector('#input-user-project');
    const inputTeach = document.querySelector('#input-user-teach');
    const inputCadence = document.querySelector('#input-user-cadence');

    if (inputLearning) inputLearning.value = goals.learning;
    if (inputProject) inputProject.value = goals.project;
    if (inputTeach) inputTeach.value = goals.teach;
    if (inputCadence) inputCadence.value = goals.cadence;
  }

  function saveLearningGoals(goals, syncBackend = true) {
    try {
      localStorage.setItem('skillswap_user_goals', JSON.stringify(goals));
    } catch (e) {}
    updateGoalsDisplay(goals);

    if (syncBackend && window.SkillSwapAPI && typeof window.SkillSwapAPI.updateProfile === 'function') {
      window.SkillSwapAPI.updateProfile({
        learnSkill: goals.learning,
        targetProject: goals.project,
        teachSkill: goals.teach,
        cadence: goals.cadence
      }).then((res) => {
        if (res && res.ok) {
          showToast('Profile updated and saved to database!', '🎯');
        }
      });
    }
  }

  const goalsModal = document.querySelector('#learning-goals-modal');
  const goalsModalClose = document.querySelector('#goals-modal-close');
  const goalsModalCancel = document.querySelector('#goals-modal-cancel');
  const goalsForm = document.querySelector('#learning-goals-form');
  const triggerGoalsModalBtn = document.querySelector('#trigger-goals-modal-btn');
  const menuEditGoalsBtn = document.querySelector('#menu-edit-goals-btn');

  function openGoalsModal() {
    if (!goalsModal) return;
    const currentGoals = loadLearningGoals();
    updateGoalsDisplay(currentGoals);
    goalsModal.classList.add('open');
    goalsModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    const input = document.querySelector('#input-user-learning');
    if (input) setTimeout(() => input.focus(), 150);
  }

  function closeGoalsModal() {
    if (!goalsModal) return;
    goalsModal.classList.remove('open');
    goalsModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  if (triggerGoalsModalBtn) triggerGoalsModalBtn.addEventListener('click', openGoalsModal);
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
    goalsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedGoals = {
        learning: document.querySelector('#input-user-learning')?.value.trim() || DEFAULT_GOALS.learning,
        project: document.querySelector('#input-user-project')?.value.trim() || DEFAULT_GOALS.project,
        teach: document.querySelector('#input-user-teach')?.value.trim() || DEFAULT_GOALS.teach,
        cadence: document.querySelector('#input-user-cadence')?.value || DEFAULT_GOALS.cadence
      };
      saveLearningGoals(updatedGoals);
      closeGoalsModal();
      showToast('Learning goals saved! Your SkillSwap profile has been updated.', '🎯');
    });
  }

  // Restore Theme Preference
  try {
    const savedTheme = localStorage.getItem('skillswap_theme');
    if (savedTheme === 'dark') {
      body.dataset.theme = 'dark';
    }
  } catch (e) {}

  // Initialize Learning Goals on load
  updateGoalsDisplay(loadLearningGoals());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeRequest();
      closeMeetModal();
      closeGoogleModal();
      closeGoalsModal();
    }
  });

  document.querySelectorAll('.heart-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      btn.textContent = isLiked ? '♥' : '♡';
      showToast(isLiked ? 'Saved peer to favorites' : 'Removed from favorites', isLiked ? '💖' : '🤍');
    });
  });

  // Dark/Light Theme Toggle in Main App
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

  // Smooth scroll target links
  document.querySelectorAll('[data-scroll-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scrollTarget);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 3D Tilt on Cards
  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion;
  if (canTilt) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
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

  // Scroll Reveal Animations
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // Auto-restore session from stored token if available
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.SkillSwapAPI && window.SkillSwapAPI.isAuthenticated()) {
      const stored = window.SkillSwapAPI.getStoredUser();
      if (stored) {
        unlockWebsiteAccess(stored);
      }
      try {
        const res = await window.SkillSwapAPI.fetchMe();
        if (res.ok && res.user) {
          unlockWebsiteAccess(res.user);
        }
      } catch (e) {}
    }
  });

  // Auto-trigger sequence on load if main app is visible or in demo mode
  if (mainApp && !mainApp.hidden) {
    triggerHeroAnimationSequence();
  }
  if (window.location.hash === '#demo') {
    unlockWebsiteAccess('Guest Explorer', 'demo@skillswap.io');
  }

  console.log('%c SkillSwap %c Learn • Share • Grow ',
    'background:#3B66FF;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;',
    'background:#10B981;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
  );
})();
