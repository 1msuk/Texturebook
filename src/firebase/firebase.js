// src/firebase/firebase.js
// Firebase 앱 초기화 — 환경변수에서 키를 읽음 (하드코딩 금지)

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// 환경변수 누락 시 경고 (개발 안전망)
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("여기에")) {
  console.warn(
    "⚠️ [텍스처북] Firebase 환경변수가 설정되지 않았습니다.\n" +
    ".env 파일을 열어 Firebase 콘솔의 실제 값을 입력하세요."
  );
}

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const storage        = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
