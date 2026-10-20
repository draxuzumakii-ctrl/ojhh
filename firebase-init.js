// Ganti isi firebase-init.js lu dengan ini:
(function (global) {
  'use strict';
  if (typeof firebase === 'undefined') return;
  const cfg = global.RyedzFirebase?.config;
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const FV = firebase.firestore.FieldValue;

  // AUTH LISTENER (Ini kunci keamanannya)
  function onAuthChange(callback) {
    return auth.onAuthStateChanged(async (user) => {
      if (!user) return callback(null, null);
      // Ambil data role langsung dari database, BUKAN dari browser
      const doc = await db.collection('users').doc(user.uid).get();
      let profile = doc.exists ? doc.data() : null;
      
      if (!profile) {
        // Kalo belum ada di DB, daftarin sebagai 'user' biasa
        profile = {
          uid: user.uid, email: user.email, displayName: user.displayName,
          photoURL: user.photoURL, role: 'user', createdAt: FV.serverTimestamp()
        };
        await db.collection('users').doc(user.uid).set(profile);
      }
      callback(user, profile);
    });
  }

  async function logout() { await auth.signOut(); }
  
  function listenPublishedPrompts(callback) {
    return db.collection('prompts').where('status', '==', 'published').orderBy('createdAt', 'desc').limit(100)
      .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  async function createPrompt(data) {
    const user = auth.currentUser;
    if (!user) throw new Error('Harus login');
    return await db.collection('prompts').add({
      title: data.title, content: data.content, aiModel: data.aiModel, category: data.category || 'General AI', 
      ownerUid: user.uid, ownerEmail: user.email, status: 'pending', createdAt: FV.serverTimestamp()
    });
  }

  function listenMyPrompts(uid, callback) {
    return db.collection('prompts').where('ownerUid', '==', uid).orderBy('createdAt', 'desc')
      .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  function listenPendingPrompts(callback) {
    return db.collection('prompts').where('status', '==', 'pending').orderBy('createdAt', 'desc')
      .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }

  async function approvePrompt(id) { await db.collection('prompts').doc(id).update({ status: 'published', publishedAt: FV.serverTimestamp() }); }
  async function rejectPrompt(id, reason) { await db.collection('prompts').doc(id).update({ status: 'rejected', moderationReason: reason }); }

  global.RyedzFB = { auth, db, onAuthChange, logout, listenPublishedPrompts, createPrompt, listenMyPrompts, listenPendingPrompts, approvePrompt, rejectPrompt };
})(window);
