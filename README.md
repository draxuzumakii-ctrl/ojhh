# RYEDZ PROMPT VAULT

Platform perpustakaan prompt AI modern dengan **iOS Glassmorphism**, role-based moderation, dan deterministic SVG thumbnails.

## 📂 Struktur File

| File | Fungsi |
|------|--------|
| `index.html` | Landing page + auth |
| `promt.html` | Public prompt vault |
| `user.html` | Dashboard user |
| `admin.html` | Dashboard admin |
| `develover.html` | Developer Control Center |
| `glassmorphism.css` | Shared premium stylesheet |
| `login-ios.css` | Login modal iOS style |
| `ryedz-core.js` | Core utilities (thumbnail, storage, toast) |
| `firebase-config.js` | Firebase config (opsional) |
| `firebase-init.js` | Firebase helpers (opsional) |
| `apikey.js` | Gemini API key (opsional) |

## 🚀 Cara Pakai

### Mode LocalStorage (default — tanpa backend)
1. Buka `index.html` di browser
2. Register akun baru, atau:
   - **Developer**: `ryedzoffc@gmail.com` (password bebas)
   - **Admin**: developer harus promote via Dev Center
   - **User**: akun biasa
3. Upload prompt → tunggu approve developer

### Mode Firebase (opsional)
1. Setup project di [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Auth (Email/Password) + Firestore
3. Copy config → paste ke `firebase-config.js`
4. Tambah 3 script SDK Firebase + `firebase-config.js` + `firebase-init.js` di `<head>` semua HTML
5. Ganti logic `R.getLocalData('prompts')` → `RyedzFB.getPublishedPrompts()`

## 🎨 Fitur

- ✅ **iOS Glassmorphism** — blur subtle, spring animation
- ✅ **Deterministic Thumbnails** — SVG 16:9 dari hash
- ✅ **25 AI Models** — ChatGPT, Claude, Gemini, dll
- ✅ **2-Input Upload** — Judul + Isi + AI model
- ✅ **Role System** — user → admin → developer
- ✅ **Moderation Queue** — approve/reject
- ✅ **Maintenance Mode** — 4 level
- ✅ **Audit Logs** — catat semua aksi
- ✅ **Export Backup** — JSON download
- ✅ **Mobile+Desktop** — responsive, safe-area
- ✅ **Aksesibilitas** — `prefers-reduced-motion`, focus ring

## 📱 Testing

- iPhone SE (375px) ✓
- iPhone 14 Pro (393px) ✓
- iPad (768px) ✓
- Desktop (1280px+) ✓

## 🔐 Keamanan

LocalStorage demo — untuk production wajib:
- Firebase Auth + Firestore rules
- Backend proxy untuk API keys
- Server-side validation

## 📝 Catatan

- Super Developer default: `ryedzoffc@gmail.com` (bisa diubah di `ryedz-core.js` → `ensureSeed()`)
- Tanpa backend — semua client-side
- Data hilang jika user clear browser data