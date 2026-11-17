import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC19wnx3pmGA7y0AWR6vmWq5H8LQ9bUmxg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "brandlens-ai-7de68.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "brandlens-ai-7de68",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "brandlens-ai-7de68.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "634667438066",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:634667438066:web:4cfccce8c80a2f6bf1656b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TXWDD9M7TL"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (conditionally checks if supported in the browser)
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

// Export Auth & Storage services for app usage
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
