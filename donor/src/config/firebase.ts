import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBFvGm29YqOnMu7l19FODPVfZE-htS0M5I",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "feedmeplzz-81b45.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "feedmeplzz-81b45",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "feedmeplzz-81b45.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "704321048981",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:704321048981:web:32e07cd20d2707b1aa269c",
};

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = initializeApp(firebaseConfig, "fallback");
  auth = getAuth(app);
  storage = getStorage(app);
}

export { auth, storage };
export default app;
