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
  getDoc,
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

// ── Konstanta limit harian ───────────────────────────────────────────────────
export const LIMIT_VIDEO = 10;
export const LIMIT_IMAGE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────
function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface UsageQuota {
  videoUsed: number;
  imageUsed: number;
  resetDate: string; // "YYYY-MM-DD"
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
  quotaLoading: boolean; // true selama menunggu Firestore load pertama kali
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
  return { videoUsed: 0, imageUsed: 0, resetDate: todayDateString() };
}

function isQuotaStale(quota: UsageQuota | undefined): boolean {
  if (!quota?.resetDate) return true;
  return quota.resetDate !== todayDateString();
}

// Simpan ke Firestore pakai setDoc+merge supaya SELALU berhasil (create atau update)
async function saveToFirestore(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaLoading, setQuotaLoading] = useState(true); // tunggu Firestore load pertama

  // Simpan ref supaya increment bisa baca nilai terbaru tanpa closure stale
  const userProfileRef = useRef<UserProfile | null>(null);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

  const userRef = useRef<User | null>(null);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    let firestoreUnsub: Unsubscribe | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Bersihkan listener Firestore sebelumnya
      if (firestoreUnsub) { firestoreUnsub(); firestoreUnsub = null; }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        setQuotaLoading(false);
        return;
      }

      // Auth resolved → app bisa tampil (tanpa data Firestore dulu)
      setLoading(false);
      setQuotaLoading(true); // masih nunggu quota dari Firestore

      const docRef = doc(db, 'users', firebaseUser.uid);

      // Subscribe realtime — setiap perubahan Firestore langsung update state
      firestoreUnsub = onSnapshot(docRef, async (snap) => {
        if (!snap.exists()) {
          // Dokumen belum ada → buat sekarang
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
            createdAt: serverTimestamp(),
            plan: 'free',
            jobCount: 0,
            quota: defaultQuota(),
          };
          try {
            await setDoc(docRef, newProfile);
            // onSnapshot akan trigger lagi dengan data baru
          } catch (e: any) {
            console.warn('[Auth] gagal buat dokumen user:', e?.code ?? e?.message);
            setQuotaLoading(false);
          }
          return;
        }

        const data = snap.data() as UserProfile;

        // Cek apakah quota perlu di-reset (beda hari)
        if (isQuotaStale(data.quota)) {
          const resetQuota = defaultQuota();
          const updated = { ...data, quota: resetQuota };
          setUserProfile(updated);
          setQuotaLoading(false);
          // Simpan reset ke Firestore
          try {
            await setDoc(docRef, { quota: resetQuota }, { merge: true });
          } catch (e: any) {
            console.warn('[Auth] gagal reset quota:', e?.code);
          }
        } else {
          setUserProfile(data);
          setQuotaLoading(false);
        }
      }, (err) => {
        console.warn('[Auth] onSnapshot error:', err?.code ?? err?.message);
        setQuotaLoading(false);
      });
    });

    return () => {
      authUnsub();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const profile: UserProfile = {
      uid: credential.user.uid,
      email,
      displayName: name,
      createdAt: serverTimestamp(),
      plan: 'free',
      jobCount: 0,
      quota: defaultQuota(),
    };

    // Pakai setDoc biasa (bukan merge) karena ini create pertama
    await setDoc(doc(db, 'users', credential.user.uid), profile);
    // onAuthStateChanged + onSnapshot akan auto-update state
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
  const getEffectiveQuota = (): UsageQuota => {
    const profile = userProfileRef.current;
    if (!profile?.quota || isQuotaStale(profile.quota)) return defaultQuota();
    return profile.quota;
  };

  const canGenerateVideo = () => getEffectiveQuota().videoUsed < LIMIT_VIDEO;
  const canGenerateImage = () => getEffectiveQuota().imageUsed < LIMIT_IMAGE;
  const remainingVideo = () => Math.max(0, LIMIT_VIDEO - getEffectiveQuota().videoUsed);
  const remainingImage = () => Math.max(0, LIMIT_IMAGE - getEffectiveQuota().imageUsed);

  const incrementVideoUsage = async () => {
    const currentUser = userRef.current;
    const profile = userProfileRef.current;
    if (!currentUser || !profile) return;

    const quota = getEffectiveQuota();
    const newQuota: UsageQuota = { ...quota, videoUsed: quota.videoUsed + 1 };

    // Optimistic update lokal dulu
    const updated = { ...profile, quota: newQuota, jobCount: (profile.jobCount || 0) + 1 };
    setUserProfile(updated);
    userProfileRef.current = updated;

    // Simpan ke Firestore — pakai setDoc+merge (SELALU berhasil, tidak peduli dok ada atau tidak)
    try {
      await saveToFirestore(currentUser.uid, { quota: newQuota, jobCount: updated.jobCount });
      console.log('[Quota] Video usage saved to Firestore:', newQuota);
    } catch (e: any) {
      console.warn('[Quota] Gagal simpan video quota:', e?.code ?? e?.message);
    }
  };

  const incrementImageUsage = async () => {
    const currentUser = userRef.current;
    const profile = userProfileRef.current;
    if (!currentUser || !profile) return;

    const quota = getEffectiveQuota();
    const newQuota: UsageQuota = { ...quota, imageUsed: quota.imageUsed + 1 };

    const updated = { ...profile, quota: newQuota, jobCount: (profile.jobCount || 0) + 1 };
    setUserProfile(updated);
    userProfileRef.current = updated;

    try {
      await saveToFirestore(currentUser.uid, { quota: newQuota, jobCount: updated.jobCount });
      console.log('[Quota] Image usage saved to Firestore:', newQuota);
    } catch (e: any) {
      console.warn('[Quota] Gagal simpan image quota:', e?.code ?? e?.message);
    }
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
