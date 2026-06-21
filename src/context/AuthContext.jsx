// src/context/AuthContext.jsx
// 로그인 상태를 앱 전역에서 관리하는 Context

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null); // Firestore 유저 문서
  const [loading, setLoading]           = useState(true);

  // 유저 문서 초기 생성 (첫 로그인 시)
  const createUserDocument = async (firebaseUser) => {
    const userRef  = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid:                    firebaseUser.uid,
        email:                  firebaseUser.email,
        displayName:            firebaseUser.displayName || "독서가",
        photoURL:               firebaseUser.photoURL || null,
        bio:                    "",
        postCount:              0,
        totalPositiveReactions: 0,
        commentCount:           0,
        totalCommentLikes:      0,
        badges:                 [],
        followingCount:         0,
        followersCount:         0,
        createdAt:              serverTimestamp(),
      });
    }

    const snap = await getDoc(userRef);
    return snap.data();
  };

  // Google 소셜 로그인
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await createUserDocument(result.user);
    setUserProfile(profile);
    return result;
  };

  // 이메일 회원가입
  const registerWithEmail = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    const profile = await createUserDocument(result.user);
    setUserProfile(profile);
    return result;
  };

  // 이메일 로그인
  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 로그아웃
  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  // 인증 상태 구독
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await createUserDocument(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 커스텀 훅
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다");
  return ctx;
};
