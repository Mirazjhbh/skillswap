/**
 * SkillSwap Fullstack API Client
 * Seamlessly connects the frontend to the Node.js/Express + MySQL API backend.
 * Provides resilient fallbacks and graceful degradation.
 */
(function () {
  'use strict';

  const API_BASE = window.SKILLSWAP_API_BASE || 'http://localhost:4000/api';
  const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, '');

  function token() {
    return localStorage.getItem('skillswap_token');
  }
  function setToken(t) {
    if (t) localStorage.setItem('skillswap_token', t);
  }
  function clearToken() {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
  }

  function getStoredUser() {
    try {
      const u = localStorage.getItem('skillswap_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredUser(u) {
    if (u) localStorage.setItem('skillswap_user', JSON.stringify(u));
  }

  async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = Object.assign({}, options.headers || {});
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const t = token();
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      // non-JSON body
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // Auth Operations
  async function signup({ fullName, email, password, teachSkill, learnSkill }) {
    try {
      const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, teachSkill, learnSkill })
      });
      setToken(data.token);
      setStoredUser(data.user);
      return { ok: true, user: data.user, token: data.token };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function login({ email, password }) {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      setStoredUser(data.user);
      return { ok: true, user: data.user, token: data.token };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function logout() {
    try {
      if (token()) await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      clearToken();
    }
    return { ok: true };
  }

  async function fetchMe() {
    try {
      const data = await request('/auth/me');
      setStoredUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Profile Operations
  async function updateProfile(profileData) {
    try {
      const data = await request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setStoredUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await request('/users/me/avatar', {
        method: 'POST',
        body: formData
      });
      if (data.user) setStoredUser(data.user);
      return { ok: true, avatarUrl: data.avatarUrl, user: data.user };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // User Discovery & Partners
  async function fetchPeople(params = {}) {
    try {
      let queryStr = '';
      if (typeof params === 'string') {
        queryStr = `?sort=${encodeURIComponent(params)}&limit=24`;
      } else {
        const q = new URLSearchParams();
        if (params.sort) q.set('sort', params.sort);
        if (params.limit) q.set('limit', params.limit);
        if (params.search) q.set('search', params.search);
        if (params.category && params.category !== 'all') q.set('category', params.category);
        if (params.excludeSelf) q.set('excludeSelf', 'true');
        queryStr = `?${q.toString()}`;
      }
      const data = await request(`/users${queryStr}`);
      return { ok: true, users: data.users || [] };
    } catch (err) {
      return { ok: false, error: err.message, users: [] };
    }
  }

  // Exchange Requests
  async function sendExchangeRequest({ recipientId, offerSkill, requestSkill, message }) {
    try {
      const data = await request('/exchanges', {
        method: 'POST',
        body: JSON.stringify({ recipientId, offerSkill, requestSkill, message })
      });
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function getMyExchanges() {
    try {
      const data = await request('/exchanges/mine');
      return { ok: true, exchanges: data.exchanges || [] };
    } catch (err) {
      return { ok: false, error: err.message, exchanges: [] };
    }
  }

  async function updateExchangeStatus(exchangeId, status) {
    try {
      const data = await request(`/exchanges/${exchangeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Groups & Messaging
  async function getMyGroups() {
    try {
      const data = await request('/messages/groups/mine');
      return { ok: true, groups: data.groups || [] };
    } catch (err) {
      return { ok: false, error: err.message, groups: [] };
    }
  }

  async function getGroupMessages(groupId) {
    try {
      const data = await request(`/messages/groups/${groupId}/messages`);
      return { ok: true, messages: data.messages || [] };
    } catch (err) {
      return { ok: false, error: err.message, messages: [] };
    }
  }

  async function sendGroupMessage(groupId, { body, hashtags, meetLink }) {
    try {
      const data = await request(`/messages/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, hashtags, meetLink })
      });
      return { ok: true, id: data.id };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Notifications
  async function myNotifications() {
    try {
      const data = await request('/notifications');
      return { ok: true, notifications: data.notifications || [] };
    } catch (err) {
      return { ok: false, error: err.message, notifications: [] };
    }
  }

  async function markNotificationRead(id) {
    try {
      const data = await request(`/notifications/${id}/read`, { method: 'PATCH' });
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // Reviews
  async function fetchReviews(limit = 10) {
    try {
      const data = await request(`/reviews?limit=${limit}`);
      return { ok: true, reviews: data.reviews || [] };
    } catch (err) {
      return { ok: false, error: err.message, reviews: [] };
    }
  }

  async function submitReview({ exchangeId, rating, comment }) {
    try {
      const data = await request('/reviews', {
        method: 'POST',
        body: JSON.stringify({ exchangeId, rating, comment })
      });
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function resolveAvatar(avatarUrl, name = '?') {
    if (!avatarUrl) {
      const letters = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
      return `<div class="avatar-fallback" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;background:linear-gradient(135deg,#3B66FF,#8B5CF6);color:#fff;">${letters}</div>`;
    }
    const src = avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.includes('.')
      ? (avatarUrl.startsWith('/uploads') ? `${SERVER_ROOT}${avatarUrl}` : avatarUrl)
      : avatarUrl;
    return `<img src="${src}" alt="${name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'avatar-fallback\\' style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;background:#3B66FF;color:#fff;\\'>${name[0]||'?'}</div>'" />`;
  }

  function buildPersonCard(user) {
    const article = document.createElement('article');
    article.className = 'person-card tilt-card reveal';
    article.dataset.category = 'dynamic ' + (user.teachSkill || '').toLowerCase();
    article.dataset.search = `${user.fullName} ${user.teachSkill || ''} ${user.learnSkill || ''} ${user.tagline || ''}`.toLowerCase();
    article.dataset.userId = user.id;

    const avatarHtml = resolveAvatar(user.avatarUrl, user.fullName);
    const ratingDisplay = Number(user.ratingAvg || 5.0).toFixed(1);

    article.innerHTML = `
      <div class="person-top">
        <div class="profile-portrait">${avatarHtml}<i>●</i></div>
        <button class="heart-button" type="button" aria-label="Save to favorites">♡</button>
      </div>
      <div class="person-name">
        <h3>${user.fullName} <span class="verified">✓</span></h3>
        <span>${ratingDisplay} ★</span>
      </div>
      <p>${user.bio || user.tagline || 'Passionate learner and mentor on SkillSwap.'}</p>
      <div class="skill-pills">
        ${user.teachSkill ? `<span data-skill="${user.teachSkill}">${user.teachSkill}</span>` : '<span data-skill="General Skills">General Skills</span>'}
      </div>
      <div class="peer-exchange-needs">
        <div class="wants">
          <span>🎯 Wants to learn:</span>
          <strong>${user.learnSkill || 'Open to collaborative suggestions'}</strong>
        </div>
        ${user.targetProject ? `
        <div class="project-interest">
          <span>🚀 Project interest:</span>
          <strong>${user.targetProject}</strong>
        </div>` : ''}
      </div>
      <button class="button button-card open-request" type="button" data-person="${user.fullName}" data-user-id="${user.id}">
        Send exchange request <span aria-hidden="true">→</span>
      </button>
    `;
    return article;
  }

  async function renderDynamicPeople(filterParams = {}) {
    const grid = document.querySelector('#people-grid');
    if (!grid) return;
    const result = await fetchPeople(filterParams);
    if (!result.ok || !result.users || !result.users.length) return;

    // Retain clean display by populating dynamic cards
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();
    result.users.forEach((u) => frag.appendChild(buildPersonCard(u)));
    grid.appendChild(frag);

    if (typeof window.SkillSwapRebindRequestButtons === 'function') {
      window.SkillSwapRebindRequestButtons();
    }
  }

  async function renderCommunityReviews() {
    const reviewStack = document.querySelector('#community .review-stack');
    if (!reviewStack) return;
    const result = await fetchReviews(4);
    if (!result.ok || !result.reviews || !result.reviews.length) return;

    const cards = result.reviews.slice(0, 2);
    if (!cards.length) return;

    reviewStack.innerHTML = '';
    cards.forEach((rev, idx) => {
      const art = document.createElement('article');
      art.className = `review-card ${idx === 0 ? 'review-front' : 'review-back'}`;
      const stars = '★'.repeat(Math.max(1, Math.min(5, rev.rating || 5)));
      const avatarHtml = rev.reviewer_avatar
        ? `<img src="${rev.reviewer_avatar.startsWith('/uploads') ? SERVER_ROOT + rev.reviewer_avatar : rev.reviewer_avatar}" alt="${rev.reviewer_name}" />`
        : `<div style="width:100%;height:100%;background:#3B66FF;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${rev.reviewer_name ? rev.reviewer_name[0] : '?'}</div>`;

      art.innerHTML = `
        <span class="rating">${stars}</span>
        <p>“${rev.comment || 'Great exchange experience on SkillSwap!'}”</p>
        <div>
          <span class="mini-portrait">${avatarHtml}</span>
          <div>
            <strong>${rev.reviewer_name}</strong>
            ${rev.reviewer_teach ? `<small>${rev.reviewer_teach} ⇄ ${rev.reviewee_teach || 'Peer'}</small>` : ''}
          </div>
        </div>
      `;
      reviewStack.appendChild(art);
    });

    const statBubble = document.createElement('span');
    statBubble.className = 'stat-bubble';
    statBubble.innerHTML = `<b>4.9/5</b><small>rating</small>`;
    reviewStack.appendChild(statBubble);
  }

  window.SkillSwapAPI = {
    API_BASE,
    SERVER_ROOT,
    signup,
    login,
    logout,
    fetchMe,
    getStoredUser,
    setStoredUser,
    updateProfile,
    uploadAvatar,
    fetchPeople,
    sendExchangeRequest,
    getMyExchanges,
    updateExchangeStatus,
    getMyGroups,
    getGroupMessages,
    sendGroupMessage,
    myNotifications,
    markNotificationRead,
    fetchReviews,
    submitReview,
    buildPersonCard,
    renderDynamicPeople,
    renderCommunityReviews,
    isAuthenticated: () => !!token(),
    onUnlock: (user) => {
      renderDynamicPeople();
      renderCommunityReviews();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderDynamicPeople();
    renderCommunityReviews();
  });
})();
