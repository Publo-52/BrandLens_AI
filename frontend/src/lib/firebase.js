import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC19wnx3pmGA7y0AWR6vmWq5H8LQ9bUmxg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'brandlens-ai-7de68.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'brandlens-ai-7de68',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'brandlens-ai-7de68.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '634667438066',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:634667438066:web:4cfccce8c80a2f6bf1656b',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-TXWDD9M7TL',
};

// Initialize Firebase App singleton safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Storage
export const storage = getStorage(app);

// Initialize Analytics conditionally
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {});
}

// ── Auth Helper Functions ──────────────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function logOut() {
  return await signOut(auth);
}

export async function getCurrentIdToken(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

export { onAuthStateChanged };
export default app;
