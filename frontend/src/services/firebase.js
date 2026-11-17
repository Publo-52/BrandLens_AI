// Re-export initialized Firebase app, auth, and storage singletons from lib/firebase.js
export {
  app,
  auth,
  storage,
  analytics,
  googleProvider,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logOut,
  onAuthStateChanged,
} from '../lib/firebase.js';

export { app as default } from '../lib/firebase.js';
