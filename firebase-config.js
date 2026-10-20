/* ============================================================
   RYEDZ PROMPT VAULT — Firebase Config
   Project: website-berita-fe11b
   ============================================================
   Auto-generated dari Firebase Console kamu.
   JANGAN bagikan apiKey ke publik — walaupun Firebase apiKey
   bukan secret, tetap lindungi dengan Firestore Rules.

   Untuk production: setup App Check di Firebase Console.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDyf21UK4N6ZdmIW7iaGxlWoKFEcqhY5dY",
  authDomain: "website-berita-fe11b.firebaseapp.com",
  projectId: "website-berita-fe11b",
  storageBucket: "website-berita-fe11b.firebasestorage.app",
  messagingSenderId: "1066285796046",
  appId: "1:1066285796046:web:5834760c3f4841370ade9f"
};

// Email Super Developer (otomatis jadi role developer saat register)
const SUPER_DEVELOPER_EMAIL = "ryedzoffc@gmail.com";

window.RyedzFirebase = {
  config: firebaseConfig,
  superDevEmail: SUPER_DEVELOPER_EMAIL
};

console.log('[RyedzFirebase] Config loaded for project:', firebaseConfig.projectId);