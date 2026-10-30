import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Dedicated app for Cloud Firestore:
// In project 983794514212, the Google Secure Token API (securetoken.googleapis.com) may not be active,
// which causes Firestore to fail with "Fetching auth token failed" when attached to the Auth instance.
// Using a dedicated app instance for Firestore bypasses securetoken.googleapis.com and connects
// directly to Cloud Firestore without token errors.
const firestoreApp =
  getApps().find((a) => a.name === 'firestore-app') ||
  initializeApp(firebaseConfig, 'firestore-app');

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firestoreApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firestoreApp);

// Test connection on boot defensively per guidelines
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    console.warn('Firestore connection check notice:', error?.message || 'ready');
  }
}
testFirestoreConnection().catch(() => {});

// Base Google Auth Provider (uses standard email & profile - NEVER blocked by Google App Verification)
const baseProvider = new GoogleAuthProvider();
baseProvider.setCustomParameters({
  prompt: 'select_account',
});

// Google Drive Provider (requests drive.file scope for workspace files)
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveProvider.setCustomParameters({
  prompt: 'consent',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged in via Firebase session; Drive token can be acquired interactively
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface SignInResult {
  user: User;
  accessToken: string | null;
  isDriveConnected: boolean;
  driveNotice?: string;
}

/**
 * Standard Google Sign-In.
 * Authenticates with standard Google Auth (profile and email) which is never blocked
 * by Google Cloud's sensitive scope verification, then attempts Drive token acquisition.
 */
export const googleSignIn = async (): Promise<SignInResult | null> => {
  try {
    isSigningIn = true;
    // 1. Sign in with standard Google auth (profile + email)
    const result = await signInWithPopup(auth, baseProvider);
    const user = result.user;

    // 2. Attempt to acquire Drive access token if permitted
    let driveToken: string | null = null;
    let driveNotice: string | undefined = undefined;

    try {
      const driveResult = await signInWithPopup(auth, driveProvider);
      const credential = GoogleAuthProvider.credentialFromResult(driveResult);
      if (credential?.accessToken) {
        driveToken = credential.accessToken;
        cachedAccessToken = driveToken;
      }
    } catch (dErr: any) {
      console.warn('Google Drive scope skipped or restricted:', dErr);
      if (
        dErr.message?.includes('access_denied') ||
        dErr.message?.includes('verification process') ||
        dErr.code === 'auth/unauthorized-domain'
      ) {
        driveNotice =
          'Signed in! Google Drive sync is currently in Testing Mode on Google Cloud. You can use Sesh@ with full persistent Local Storage (IndexedDB), or add your email to Test Users in GCP Console.';
      }
    }

    return {
      user,
      accessToken: driveToken,
      isDriveConnected: !!driveToken,
      driveNotice,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups or use Offline Mode.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before completion.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Interactive connection for Google Drive storage
 */
export const connectGoogleDrive = async (): Promise<string | null> => {
  try {
    const driveResult = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(driveResult);
    if (!credential?.accessToken) {
      throw new Error('Drive access token not returned');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (err: any) {
    console.warn('Failed to connect Drive:', err);
    if (
      err.message?.includes('access_denied') ||
      err.message?.includes('verification process')
    ) {
      throw new Error(
        'Google Cloud OAuth is in Testing mode. To sync notes directly to Drive, add your email to "Test Users" in Google Cloud Console > OAuth Consent Screen, or enjoy full local storage in Sesh@.'
      );
    }
    throw err;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
