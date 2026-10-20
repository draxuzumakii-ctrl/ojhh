/* ============================================================
   RYEDZ PROMPT VAULT — Firebase Init v3.0
   Project: website-berita-fe11b
   ============================================================
   Requires:
   - Firebase SDK 10.14.0 compat (di <head>)
   - firebase-config.js (loaded before this)

   Exposes: window.RyedzFB
   ============================================================ */
(function (global) {
  'use strict';

  // ---- Cek SDK ----
  if (typeof firebase === 'undefined') {
    console.error('[RyedzFB] ❌ Firebase SDK belum di-load. Tambahkan <script> Firebase SDK di <head>.');
    return;
  }

  const cfg = global.RyedzFirebase?.config;
  if (!cfg || !cfg.projectId) {
    console.error('[RyedzFB] ❌ firebase-config.js belum diisi.');
    return;
  }

  // ---- Init Firebase ----
  let app;
  try {
    app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
  } catch (e) {
    console.error('[RyedzFB] ❌ Init error:', e);
    return;
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---- Enable offline persistence ----
  db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('[RyedzFB] Persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[RyedzFB] Persistence: not supported in this browser');
    }
  });

  console.log('[RyedzFB] ✅ Firebase initialized:', cfg.projectId);

  /* ============================================================
     AUTH
     ============================================================ */

  async function register(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName && cred.user.updateProfile) {
      await cred.user.updateProfile({ displayName });
    }
    const isSuperDev = email === global.RyedzFirebase.superDevEmail;
    const role = isSuperDev ? 'developer' : 'user';

    await db.collection('users').doc(cred.user.uid).set({
      uid: cred.user.uid,
      email: email,
      displayName: displayName || email.split('@')[0],
      role: role,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('[RyedzFB] Registered:', email, '→ role:', role);
    return { user: cred.user, role };
  }

  async function login(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    console.log('[RyedzFB] Logged in:', email);
    return cred.user;
  }

  async function logout() {
    await auth.signOut();
  }

  async function getUserRole(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) return doc.data().role || 'user';
    } catch (e) {
      console.warn('[RyedzFB] getUserRole error:', e);
    }
    return 'user';
  }

  async function getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? { uid, ...doc.data() } : null;
  }

  function onAuthChange(callback) {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) return callback(null, null);
      const role = await getUserRole(user.uid);
      const profile = await getUserProfile(user.uid);
      callback(user, profile || {
        uid: user.uid,
        email: user.email,
        role,
        displayName: user.displayName || user.email.split('@')[0]
      });
    });
  }

  async function sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email);
  }

  /* ============================================================
     PROMPTS CRUD
     ============================================================ */

  async function createPrompt(data) {
    const user = auth.currentUser;
    if (!user) throw new Error('Login required');

    const ref = db.collection('prompts').doc();
    const payload = {
      title: data.title,
      content: data.content,
      aiModel: data.aiModel || 'ChatGPT',
      category: data.category || 'General AI',
      ownerUid: user.uid,
      ownerEmail: user.email,
      status: 'pending',
      isFeatured: false,
      copiedCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      version: 1
    };

    await ref.set(payload);
    await addAuditLog('PROMPT_SUBMITTED', 'Submitted "' + data.title + '"');
    return ref.id;
  }

  async function updatePrompt(id, data, resubmit) {
    if (resubmit === undefined) resubmit = true;
    const updates = {
      title: data.title,
      content: data.content,
      aiModel: data.aiModel,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (resubmit) {
      updates.status = 'pending';
      updates.moderationReason = firebase.firestore.FieldValue.delete();
    }
    await db.collection('prompts').doc(id).update(updates);
    await addAuditLog('PROMPT_EDITED', 'Edited prompt ' + id);
  }

  async function deletePrompt(id) {
    await db.collection('prompts').doc(id).delete();
    await addAuditLog('PROMPT_DELETED', 'Deleted prompt ' + id);
  }

  async function getMyPrompts(uid) {
    const snap = await db.collection('prompts')
      .where('ownerUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getPublishedPrompts() {
    const snap = await db.collection('prompts')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getPendingPrompts() {
    const snap = await db.collection('prompts')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function getAllPrompts() {
    const snap = await db.collection('prompts')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function approvePrompt(id) {
    await db.collection('prompts').doc(id).update({
      status: 'published',
      publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
      moderationReason: firebase.firestore.FieldValue.delete()
    });
    await addAuditLog('PROMPT_APPROVED', 'Approved prompt ' + id);
  }

  async function rejectPrompt(id, reason) {
    await db.collection('prompts').doc(id).update({
      status: 'rejected',
      moderationReason: reason,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await addAuditLog('PROMPT_REJECTED', 'Rejected prompt ' + id + ': ' + reason);
  }

  async function incrementCopiedCount(id) {
    try {
      await db.collection('prompts').doc(id).update({
        copiedCount: firebase.firestore.FieldValue.increment(1)
      });
    } catch (e) {}
  }

  function listenPublishedPrompts(callback) {
    return db.collection('prompts')
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .onSnapshot(snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error('[RyedzFB] listenPublishedPrompts:', err));
  }

  function listenPendingPrompts(callback) {
    return db.collection('prompts')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error('[RyedzFB] listenPendingPrompts:', err));
  }

  function listenMyPrompts(uid, callback) {
    return db.collection('prompts')
      .where('ownerUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error('[RyedzFB] listenMyPrompts:', err));
  }

  /* ============================================================
     FAVORITES
     ============================================================ */

  async function addFavorite(uid, prompt) {
    await db.collection('users').doc(uid).collection('favorites').doc(prompt.id).set({
      promptId: prompt.id,
      title: prompt.title,
      aiModel: prompt.aiModel,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  async function removeFavorite(uid, promptId) {
    await db.collection('users').doc(uid).collection('favorites').doc(promptId).delete();
  }

  async function getFavorites(uid) {
    const snap = await db.collection('users').doc(uid).collection('favorites').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function listenFavorites(uid, callback) {
    return db.collection('users').doc(uid).collection('favorites').onSnapshot(snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  /* ============================================================
     NOTIFICATIONS
     ============================================================ */

  async function broadcastNotification(title, message, targetAudience) {
    const user = auth.currentUser;
    await db.collection('notifications').add({
      targetUid: null,
      targetAudience: targetAudience || 'all',
      title,
      message,
      isRead: false,
      senderUid: user?.uid || 'system',
      senderEmail: user?.email || 'system',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function listenNotifications(uid, callback) {
    // Firestore doesn't support `in` with null + uid easily; use two queries
    const q1 = db.collection('notifications')
      .where('targetUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50);

    const q2 = db.collection('notifications')
      .where('targetUid', '==', null)
      .orderBy('createdAt', 'desc')
      .limit(50);

    let unsub1, unsub2;
    let list1 = [], list2 = [];

    function emit() {
      const merged = [...list1, ...list2].sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(merged);
    }

    unsub1 = q1.onSnapshot(snap => {
      list1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      emit();
    });
    unsub2 = q2.onSnapshot(snap => {
      list2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      emit();
    });

    return () => { unsub1(); unsub2(); };
  }

  async function markNotificationRead(id) {
    await db.collection('notifications').doc(id).update({ isRead: true });
  }

  /* ============================================================
     AUDIT LOGS
     ============================================================ */

  async function addAuditLog(action, details) {
    try {
      const user = auth.currentUser;
      await db.collection('audit_logs').add({
        action,
        details,
        actorUid: user?.uid || 'system',
        actorEmail: user?.email || 'system',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.warn('[RyedzFB] addAuditLog failed:', e);
    }
  }

  async function getAuditLogs(limit) {
    limit = limit || 100;
    const snap = await db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  function listenAuditLogs(callback) {
    return db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .onSnapshot(snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
  }

  /* ============================================================
     USERS
     ============================================================ */

  async function getAllUsers() {
    const snap = await db.collection('users').get();
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }

  async function promoteToAdmin(uid) {
    await db.collection('users').doc(uid).update({ role: 'admin' });
    await addAuditLog('ROLE_PROMOTED', 'Promoted user ' + uid);
  }

  async function demoteAdmin(uid) {
    await db.collection('users').doc(uid).update({ role: 'user' });
    await addAuditLog('ROLE_DEMOTED', 'Demoted admin ' + uid);
  }

  /* ============================================================
     SETTINGS
     ============================================================ */

  async function getSettings() {
    const doc = await db.collection('settings').doc('site').get();
    return doc.exists ? doc.data() : {};
  }

  async function updateSettings(data) {
    await db.collection('settings').doc('site').set(data, { merge: true });
    await addAuditLog('SETTINGS_UPDATED', 'Updated site settings');
  }

  function listenSettings(callback) {
    return db.collection('settings').doc('site').onSnapshot(doc => {
      callback(doc.exists ? doc.data() : {});
    });
  }

  /* ============================================================
     EXPORT
     ============================================================ */

  global.RyedzFB = {
    app, auth, db,
    // Auth
    register, login, logout, getUserRole, getUserProfile, onAuthChange, sendPasswordReset,
    // Prompts
    createPrompt, updatePrompt, deletePrompt,
    getMyPrompts, getPublishedPrompts, getPendingPrompts, getAllPrompts,
    approvePrompt, rejectPrompt, incrementCopiedCount,
    listenPublishedPrompts, listenPendingPrompts, listenMyPrompts,
    // Favorites
    addFavorite, removeFavorite, getFavorites, listenFavorites,
    // Notifications
    broadcastNotification, listenNotifications, markNotificationRead,
    // Audit
    addAuditLog, getAuditLogs, listenAuditLogs,
    // Users
    getAllUsers, promoteToAdmin, demoteAdmin,
    // Settings
    getSettings, updateSettings, listenSettings
  };

  console.log('[RyedzFB] ✅ Ready — all functions exported');
})(window);