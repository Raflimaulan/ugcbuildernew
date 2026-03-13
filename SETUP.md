# Nexus Studio — Panduan Setup

## Error yang umum & cara fixnya

### ❌ Error: "VITE_API_BASE_URL belum diset"
File `.env` di folder `frontend/` tidak ada atau belum dibuat.

**Fix:**
```bash
cd frontend/
cp .env.example .env
# Lalu edit .env sesuai kebutuhan
```

Isi default `.env`:
```
VITE_API_BASE_URL=http://localhost:5000
```

---

### ❌ FirebaseError: client is offline
Firestore Security Rules belum di-deploy ke Firebase Console.

**Fix — deploy rules dari Firebase Console:**
1. Buka https://console.firebase.google.com
2. Pilih project `studio-2740779394-e22ec`
3. Masuk ke **Firestore Database** → tab **Rules**
4. Paste rules berikut dan klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Cara Jalankan Lengkap

### 1. Setup Backend
```bash
cd backend/
npm install
cp .env.example .env
# Edit .env — isi GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, PROXY_HEADER
node server.js
```

### 2. Setup Frontend (tab baru)
```bash
cd frontend/
npm install
cp .env.example .env
# .env sudah terisi VITE_API_BASE_URL=http://localhost:5000
npm run dev
```

### 3. Buka browser
```
http://localhost:5173
```

### 4. Isi API Token di sidebar
Klik **API Configuration** di sidebar kiri, isi dengan nilai `PROXY_HEADER` yang kamu set di backend `.env`.

---

## Struktur .env yang dibutuhkan

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000
```

**backend/.env**
```
GOOGLE_CLOUD_PROJECT=nama-project-gcp-kamu
GOOGLE_CLOUD_LOCATION=us-central1
PROXY_HEADER=token-rahasia-bebas
```
