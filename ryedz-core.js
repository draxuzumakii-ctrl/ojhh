/* ============================================================
   RYEDZ PROMPT VAULT — Core Utilities
   Load SEBELUM script halaman di semua HTML
   Exposes: window.Ryedz
   Version: 3.0
   ============================================================ */
(function (global) {
  'use strict';

  /* ============================================================
     SECTION 1: STRING UTILITIES
     ============================================================ */

  function escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe).replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  function escapeHtml(unsafe) {
    return escapeXml(unsafe);
  }

  function hashString(str) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function truncate(text, max, suffix) {
    const s = String(text || '');
    suffix = suffix || '...';
    if (s.length <= max) return s;
    return s.substring(0, max - suffix.length) + suffix;
  }

  function formatDate(ts) {
    if (!ts) return '-';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  }

  function formatDateTime(ts) {
    if (!ts) return '-';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '-';
    }
  }

  function timeAgo(ts) {
    if (!ts) return '-';
    try {
      const d = typeof ts === 'number' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return 'Baru saja';
      if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
      if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
      if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
      return formatDate(ts);
    } catch (e) {
      return '-';
    }
  }

  /* ============================================================
     SECTION 2: THUMBNAIL GENERATOR
     ============================================================ */

  const PALETTES = [
    { c1: '#8b5cf6', c2: '#38bdf8', bg1: '#0e101a', bg2: '#07080c' },
    { c1: '#ec4899', c2: '#8b5cf6', bg1: '#120d1c', bg2: '#06060a' },
    { c1: '#06b6d4', c2: '#3b82f6', bg1: '#09131d', bg2: '#05070a' },
    { c1: '#10b981', c2: '#06b6d4', bg1: '#071612', bg2: '#050a08' },
    { c1: '#f59e0b', c2: '#ef4444', bg1: '#19110a', bg2: '#080605' },
    { c1: '#a855f7', c2: '#ec4899', bg1: '#15091a', bg2: '#07040a' }
  ];

  const VARIANT_LABELS = {
    vault: 'RYEDZ VAULT',
    admin: 'ADMIN VAULT',
    dev: 'RYEDZ DEV'
  };

  /**
   * Generate deterministic 16:9 SVG thumbnail.
   * @param {string} id - unique prompt id
   * @param {string} title - prompt title
   * @param {string} aiModel - AI model name
   * @param {object} [opts] - { variant: 'vault'|'admin'|'dev' }
   * @returns {string} data URI
   */
  function generateThumbnail(id, title, aiModel, opts) {
    opts = opts || {};
    const variant = opts.variant || 'vault';
    const label = VARIANT_LABELS[variant] || VARIANT_LABELS.vault;

    const seed = (id || 'ryedz-vault') + '::' + (title || '');
    const hash = hashString(seed);
    const palette = PALETTES[hash % PALETTES.length];

    const cleanTitle = String(title || 'AI PROMPT').trim();
    const displayTitle = truncate(cleanTitle, 38, '...');
    const safeTitle = escapeXml(displayTitle);
    const safeAi = escapeXml(aiModel || 'ChatGPT');

    const sx1 = 120 + (hash % 180);
    const sy1 = 80 + ((hash >> 2) % 100);
    const sx2 = 420 + ((hash >> 4) % 150);
    const sy2 = 200 + ((hash >> 6) % 90);

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">' +
      '<defs>' +
        '<linearGradient id="bg_' + hash + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="' + palette.bg1 + '"/>' +
          '<stop offset="100%" stop-color="' + palette.bg2 + '"/>' +
        '</linearGradient>' +
        '<radialGradient id="g1_' + hash + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="' + palette.c1 + '" stop-opacity="0.35"/>' +
          '<stop offset="100%" stop-color="' + palette.c1 + '" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="g2_' + hash + '" cx="50%" cy="50%" r="50%">' +
          '<stop offset="0%" stop-color="' + palette.c2 + '" stop-opacity="0.35"/>' +
          '<stop offset="100%" stop-color="' + palette.c2 + '" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<linearGradient id="ac_' + hash + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
          '<stop offset="0%" stop-color="' + palette.c1 + '"/>' +
          '<stop offset="100%" stop-color="' + palette.c2 + '"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="640" height="360" fill="url(#bg_' + hash + ')"/>' +
      '<circle cx="' + sx1 + '" cy="' + sy1 + '" r="170" fill="url(#g1_' + hash + ')"/>' +
      '<circle cx="' + sx2 + '" cy="' + sy2 + '" r="190" fill="url(#g2_' + hash + ')"/>' +
      '<g stroke="rgba(255,255,255,0.04)" stroke-width="1">' +
        '<line x1="0" y1="90" x2="640" y2="90"/>' +
        '<line x1="0" y1="180" x2="640" y2="180"/>' +
        '<line x1="0" y1="270" x2="640" y2="270"/>' +
        '<line x1="160" y1="0" x2="160" y2="360"/>' +
        '<line x1="320" y1="0" x2="320" y2="360"/>' +
        '<line x1="480" y1="0" x2="480" y2="360"/>' +
      '</g>' +
      '<rect x="40" y="40" width="560" height="280" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>' +
      '<rect x="65" y="65" width="130" height="26" rx="13" fill="rgba(255,255,255,0.05)" stroke="url(#ac_' + hash + ')" stroke-width="1"/>' +
      '<text x="130" y="82" fill="#e2e8f0" font-family="Plus Jakarta Sans, sans-serif" font-size="10" font-weight="700" letter-spacing="1" text-anchor="middle">' + escapeXml(label) + '</text>' +
      '<rect x="420" y="65" width="155" height="26" rx="13" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.4)"/>' +
      '<text x="497" y="82" fill="#38bdf8" font-family="Plus Jakarta Sans, sans-serif" font-size="10" font-weight="700" text-anchor="middle">' + safeAi + '</text>' +
      '<text x="65" y="165" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-size="25" font-weight="800" letter-spacing="-0.5">' + safeTitle + '</text>' +
      '<rect x="65" y="250" width="280" height="4" rx="2" fill="url(#ac_' + hash + ')"/>' +
      '<circle cx="360" cy="252" r="4" fill="' + palette.c1 + '"/>' +
      '<circle cx="380" cy="252" r="4" fill="' + palette.c2 + '"/>' +
      '<text x="575" y="295" fill="rgba(255,255,255,0.3)" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="end">AI // PROMPT</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ============================================================
     SECTION 3: STORAGE (localStorage, namespaced)
     ============================================================ */

  function getLocalData(key, fallback) {
    try {
      const val = localStorage.getItem('RYEDZ_' + key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setLocalData(key, val) {
    try {
      localStorage.setItem('RYEDZ_' + key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.warn('[Ryedz] setLocalData error:', e);
      return false;
    }
  }

  function removeLocalData(key) {
    try {
      localStorage.removeItem('RYEDZ_' + key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAllLocalData() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('RYEDZ_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ============================================================
     SECTION 4: SEED DATA
     ============================================================ */

  const SEED_PROMPTS = [
    {
      id: 'seed-1',
      title: 'Senior Full-Stack Architect & Code Reviewer',
      content: 'Act as a Principal Staff Engineer. Review the following code architecture for scalability, memory leaks, OWASP top 10 vulnerabilities, and maintainability. Propose atomic refactoring steps.',
      ownerUid: 'system-admin',
      ownerEmail: 'ryedzoffc@gmail.com',
      aiModel: 'ChatGPT',
      category: 'Coding & Dev',
      status: 'published',
      isFeatured: true,
      copiedCount: 0,
      createdAt: Date.now() - 86400000,
      publishedAt: Date.now() - 72000000
    },
    {
      id: 'seed-2',
      title: 'High-Converting SaaS Landing Page Copywriter',
      content: 'Generate a conversion-optimized SaaS landing page copy. Include Hero headline with curiosity hook, problem agitation, 3 value pillars with quantified proof, testimonial layout, and sticky CTA.',
      ownerUid: 'system-admin',
      ownerEmail: 'ryedzoffc@gmail.com',
      aiModel: 'Claude',
      category: 'Marketing',
      status: 'published',
      isFeatured: true,
      copiedCount: 0,
      createdAt: Date.now() - 172800000,
      publishedAt: Date.now() - 129600000
    },
    {
      id: 'seed-3',
      title: 'Midjourney Photorealistic Product Photography',
      content: 'A sleek modern luxury perfume bottle on an obsidian glass surface, soft violet and cyan rim light, subtle water droplets, 8k resolution, macro shot, photorealistic, cinematic volumetric lighting --ar 16:9 --v 6.0',
      ownerUid: 'system-admin',
      ownerEmail: 'ryedzoffc@gmail.com',
      aiModel: 'DeepSeek',
      category: 'Creative AI',
      status: 'published',
      isFeatured: false,
      copiedCount: 0,
      createdAt: Date.now() - 259200000,
      publishedAt: Date.now() - 180000000
    }
  ];

  const DEFAULT_CATEGORIES = [
    { id: 'c1', name: 'Coding & Dev', keywords: 'code, javascript, python, rust, docker, api, sql, react, dev' },
    { id: 'c2', name: 'Creative AI', keywords: 'art, image, story, poetry, video, audio, midjourney, design, photorealistic' },
    { id: 'c3', name: 'Marketing', keywords: 'seo, copywriting, ads, email, social, conversion, sales, marketing' },
    { id: 'c4', name: 'Writing & Copy', keywords: 'article, blog, resume, academic, summary, write, essay, novel' },
    { id: 'c5', name: 'Admin Verified', keywords: 'architecture, enterprise, secure, verified' },
    { id: 'c6', name: 'General AI', keywords: 'general, misc' }
  ];

  function ensureSeed() {
    if (!localStorage.getItem('RYEDZ_prompts')) {
      setLocalData('prompts', SEED_PROMPTS);
    }
    if (!localStorage.getItem('RYEDZ_website_settings')) {
      setLocalData('website_settings', {
        heroTitle: 'YOUR AI PROMPT LIBRARY',
        heroDesc: 'Discover, save, and share powerful AI prompts in one premium workspace.',
        footerText: '© 2026 RYEDZ PROMPT VAULT. Built with Super Glassmorphism Architecture.',
        maintenance: {
          mode: 'NORMAL',
          title: 'RYEDZ PROMPT VAULT SEDANG DALAM PEMELIHARAAN',
          desc: 'Kami sedang meningkatkan sistem. Silakan kembali beberapa saat lagi.',
          reason: 'Scheduled upgrade & security hardening',
          active: false
        }
      });
    }
    if (!localStorage.getItem('RYEDZ_users')) {
      setLocalData('users', [{
        uid: 'dev-master',
        email: 'ryedzoffc@gmail.com',
        displayName: 'Ryedz Dev',
        role: 'developer',
        status: 'active',
        createdAt: Date.now() - 2592000000
      }]);
    }
    if (!localStorage.getItem('RYEDZ_categories')) {
      setLocalData('categories', DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem('RYEDZ_audit_logs')) {
      setLocalData('audit_logs', []);
    }
  }

  /* ============================================================
     SECTION 5: CATEGORY DETECTION
     ============================================================ */

  function autoDetectCategory(title, content) {
    const text = ((title || '') + ' ' + (content || '')).toLowerCase();
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const c = DEFAULT_CATEGORIES[i];
      const kws = c.keywords.split(',').map(k => k.trim()).filter(Boolean);
      for (let j = 0; j < kws.length; j++) {
        if (text.indexOf(kws[j]) !== -1) return c.name;
      }
    }
    return 'General AI';
  }

  /* ============================================================
     SECTION 6: CLIPBOARD
     ============================================================ */

  async function copyText(text) {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback untuk browser lama
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      console.warn('[Ryedz] copyText error:', e);
      return false;
    }
  }

  /* ============================================================
     SECTION 7: AUDIT LOG
     ============================================================ */

  function addAuditLog(action, details, actor) {
    const logs = getLocalData('audit_logs', []);
    logs.unshift({
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      action: action,
      details: details,
      actorEmail: (actor && (actor.email || actor)) || 'system',
      timestamp: Date.now()
    });
    if (logs.length > 500) logs.length = 500;
    setLocalData('audit_logs', logs);
  }

  /* ============================================================
     SECTION 8: TOAST NOTIFICATIONS
     ============================================================ */

  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3400;

    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';

    let color = '#7dd3fc';
    let icon = 'ℹ';
    if (type === 'success') { icon = '✓'; color = '#6ee7b7'; }
    else if (type === 'error') { icon = '✕'; color = '#fda4af'; }
    else if (type === 'warning') { icon = '⚠'; color = '#fcd34d'; }

    toast.innerHTML =
      '<span style="color:' + color + ';font-weight:700;font-size:1.1rem;flex-shrink:0;">' + icon + '</span>' +
      '<span style="flex:1;">' + escapeXml(message) + '</span>';

    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px) scale(0.96)';
      toast.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(function () { toast.remove(); }, 250);
    }, duration);
  }

  /* ============================================================
     SECTION 9: MAINTENANCE MODE
     ============================================================ */

  function checkMaintenance() {
    const sess = getLocalData('session_user', null);
    const role = sess && sess.role ? sess.role : 'user';
    const settings = getLocalData('website_settings', {});
    const m = settings.maintenance || {};
    const overlay = document.getElementById('maintenance-banner-view');

    if (!overlay) return;

    if (m.active && m.mode === 'MAINTENANCE' && role !== 'developer') {
      overlay.style.display = 'flex';
      const tEl = document.getElementById('maint-title');
      const dEl = document.getElementById('maint-desc');
      const rEl = document.getElementById('maint-reason-box');
      if (tEl) tEl.textContent = m.title || 'MAINTENANCE';
      if (dEl) dEl.textContent = m.desc || '';
      if (rEl) rEl.textContent = 'Reason: ' + (m.reason || '-');
    } else {
      overlay.style.display = 'none';
    }
  }

  /* ============================================================
     SECTION 10: UI HELPERS
     ============================================================ */

  function showLoading(button, text) {
    if (!button) return;
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = text || 'Loading...';
  }

  function hideLoading(button) {
    if (!button) return;
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  function debounce(fn, delay) {
    let timer;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const ctx = this;
      if (!inThrottle) {
        fn.apply(ctx, args);
        inThrottle = true;
        setTimeout(function () { inThrottle = false; }, limit);
      }
    };
  }

  function getSessionUser() {
    return getLocalData('session_user', null);
  }

  function setSessionUser(user) {
    if (user) setLocalData('session_user', user);
    else removeLocalData('session_user');
  }

  function logout() {
    removeLocalData('session_user');
  }

  function getRedirectForRole(role) {
    if (role === 'developer') return 'develover.html';
    if (role === 'admin') return 'admin.html';
    return 'user.html';
  }

  function getRoleLabel(role) {
    if (role === 'developer') return 'Developer';
    if (role === 'admin') return 'Admin';
    return 'User';
  }

  /* ============================================================
     SECTION 11: EXPORT
     ============================================================ */

  global.Ryedz = {
    // String utilities
    escapeXml: escapeXml,
    escapeHtml: escapeHtml,
    hashString: hashString,
    slugify: slugify,
    truncate: truncate,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    timeAgo: timeAgo,

    // Thumbnails
    generateThumbnail: generateThumbnail,
    PALETTES: PALETTES,

    // Storage
    getLocalData: getLocalData,
    setLocalData: setLocalData,
    removeLocalData: removeLocalData,
    clearAllLocalData: clearAllLocalData,

    // Seed
    ensureSeed: ensureSeed,
    SEED_PROMPTS: SEED_PROMPTS,
    DEFAULT_CATEGORIES: DEFAULT_CATEGORIES,

    // Category
    autoDetectCategory: autoDetectCategory,

    // Clipboard
    copyText: copyText,

    // Audit
    addAuditLog: addAuditLog,

    // Toast
    showToast: showToast,

    // Maintenance
    checkMaintenance: checkMaintenance,

    // UI
    showLoading: showLoading,
    hideLoading: hideLoading,
    debounce: debounce,
    throttle: throttle,

    // Session
    getSessionUser: getSessionUser,
    setSessionUser: setSessionUser,
    logout: logout,
    getRedirectForRole: getRedirectForRole,
    getRoleLabel: getRoleLabel
  };

  // Auto-bootstrap seed saat load
  try { ensureSeed(); } catch (e) {
    console.warn('[Ryedz] ensureSeed error:', e);
  }

  console.log('[Ryedz] Core loaded v3.0');
})(window);