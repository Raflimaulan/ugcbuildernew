import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD4t70kPmV8zy8Rk0lNRZmyiQ5DO7StpvA",
  authDomain: "studio-2740779394-e22ec.firebaseapp.com",
  projectId: "studio-2740779394-e22ec",
  storageBucket: "studio-2740779394-e22ec.firebasestorage.app",
  messagingSenderId: "702621865024",
  appId: "1:702621865024:web:58d2a86d28a8eed5d17ba5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export type { User };
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
};
