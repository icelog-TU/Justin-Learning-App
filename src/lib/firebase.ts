import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCBOJFM--hbDyZ10KUgMuTytSwz7HKQZU8',
  authDomain: 'justin-learning-app.firebaseapp.com',
  projectId: 'justin-learning-app',
  storageBucket: 'justin-learning-app.firebasestorage.app',
  messagingSenderId: '467505680007',
  appId: '1:467505680007:web:aa9f81ceef0c2b65667222',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

let signInPromise: Promise<User | null> | null = null;

/** Anonymous sign-in (no email/password needed) — required by the Firestore security rules. */
export function ensureSignedIn(): Promise<User | null> {
  if (!signInPromise) {
    signInPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(auth)
            .then((cred) => resolve(cred.user))
            .catch(() => resolve(null));
        }
      });
    });
  }
  return signInPromise;
}
