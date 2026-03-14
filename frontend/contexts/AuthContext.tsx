import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD4t70kPmV8zy8Rk0lNRZmyiQ5DO7StpvA",
  authDomain: "studio-2740779394-e22ec.firebaseapp.com",
  projectId: "studio-2740779394-e22ec",
  storageBucket: "studio-2740779394-e22ec.firebasestorage.app",
  messagingSenderId: "702621865024",
  appId: "1:702621865024:web:58d2a86d28a8eed5d17ba5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── Limit harian ─────────────────────────────────────────────────────────────
export const LIMIT_VIDEO = 10;
export const LIMIT_IMAGE = 20;

// ── Helper tanggal ────────────────────────────────────────────────────────────
function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface UsageQuota {
  videoUsed: number;
  imageUsed: number;
  resetDate: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
  plan: 'free' | 'pro';
  jobCount: number;
  quota: UsageQuota;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  quotaLoading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canGenerateVideo: () => boolean;
  canGenerateImage: () => boolean;
  incrementVideoUsage: () => Promise<void>;
  incrementImageUsage: () => Promise<void>;
  remainingVideo: () => number;
  remainingImage: () => number;
}

const AuthContext = createContext<AuthContextType | null>(null);

function defaultQuota(): UsageQuota {
  return { videoUsed: 0, imageUsed: 0, resetDate: todayString() };
}

function isStale(quota?: UsageQuota): boolean {
  return !quota?.resetDate || quota.resetDate !== todayString();
}

// setDoc+merge — works for both create and update, never fails on missing doc
async function saveFirestore(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(true);

  // Refs so increment functions always read latest values without stale closures
  const profileRef = useRef<UserProfile | null>(null);
  const userRef = useRef<User | null>(null);
  useEffect(() => { profileRef.current = userProfile; }, [userProfile]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    let firestoreUnsub: Unsubscribe | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firestoreUnsub) { firestoreUnsub(); firestoreUnsub = null; }
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        setQuotaLoading(false);
        return;
      }

      setLoading(false);
      setQuotaLoading(true);

      const docRef = doc(db, 'users', firebaseUser.uid);

      firestoreUnsub = onSnapshot(docRef, async (snap) => {
        if (!snap.exists()) {
          // Dokumen belum ada — buat sekarang (misal user lama sebelum ada Firestore)
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
            createdAt: serverTimestamp(),
            plan: 'free',
            jobCount: 0,
            quota: defaultQuota(),
          };
          try { await setDoc(docRef, newProfile); } catch (_) {}
          return;
        }

        const data = snap.data() as UserProfile;

        if (isStale(data.quota)) {
          // Hari berganti — reset quota
          const resetQuota = defaultQuota();
          setUserProfile({ ...data, quota: resetQuota });
          setQuotaLoading(false);
          try { await saveFirestore(firebaseUser.uid, { quota: resetQuota }); } catch (_) {}
        } else {
          setUserProfile(data);
          setQuotaLoading(false);
        }
      }, (err) => {
        console.warn('[Auth] Firestore error:', err?.code);
        setQuotaLoading(false);
      });
    });

    return () => { authUnsub(); if (firestoreUnsub) firestoreUnsub(); };
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName: name,
      createdAt: serverTimestamp(),
      plan: 'free',
      jobCount: 0,
      quota: defaultQuota(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  // ── Quota helpers ─────────────────────────────────────────────────────────
  const effectiveQuota = (): UsageQuota => {
    const p = profileRef.current;
    if (!p?.quota || isStale(p.quota)) return defaultQuota();
    return p.quota;
  };

  const canGenerateVideo = () => effectiveQuota().videoUsed < LIMIT_VIDEO;
  const canGenerateImage = () => effectiveQuota().imageUsed < LIMIT_IMAGE;
  const remainingVideo = () => Math.max(0, LIMIT_VIDEO - effectiveQuota().videoUsed);
  const remainingImage = () => Math.max(0, LIMIT_IMAGE - effectiveQuota().imageUsed);

  const incrementVideoUsage = async () => {
    const u = userRef.current; const p = profileRef.current;
    if (!u || !p) return;
    const q = effectiveQuota();
    const newQuota = { ...q, videoUsed: q.videoUsed + 1 };
    const updated = { ...p, quota: newQuota, jobCount: (p.jobCount || 0) + 1 };
    setUserProfile(updated); profileRef.current = updated;
    try {
      await saveFirestore(u.uid, { quota: newQuota, jobCount: updated.jobCount });
    } catch (e: any) { console.warn('[Quota] video save failed:', e?.code); }
  };

  const incrementImageUsage = async () => {
    const u = userRef.current; const p = profileRef.current;
    if (!u || !p) return;
    const q = effectiveQuota();
    const newQuota = { ...q, imageUsed: q.imageUsed + 1 };
    const updated = { ...p, quota: newQuota, jobCount: (p.jobCount || 0) + 1 };
    setUserProfile(updated); profileRef.current = updated;
    try {
      await saveFirestore(u.uid, { quota: newQuota, jobCount: updated.jobCount });
    } catch (e: any) { console.warn('[Quota] image save failed:', e?.code); }
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading, quotaLoading,
      register, login, logout,
      canGenerateVideo, canGenerateImage,
      incrementVideoUsage, incrementImageUsage,
      remainingVideo, remainingImage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
