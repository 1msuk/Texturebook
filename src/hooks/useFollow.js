// src/hooks/useFollow.js
// 유저 간 팔로우 / 언팔로우 훅

import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export const useFollow = (targetUserId) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing]   = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  // 팔로우 여부 확인
  useEffect(() => {
    if (!currentUser || !targetUserId) {
      setCheckLoading(false);
      return;
    }
    const followRef = doc(db, "users", currentUser.uid, "following", targetUserId);
    getDoc(followRef).then((snap) => {
      setIsFollowing(snap.exists());
      setCheckLoading(false);
    });
  }, [currentUser, targetUserId]);

  // 팔로우
  const follow = async () => {
    if (!currentUser || currentUser.uid === targetUserId) return;
    const myFollowingRef   = doc(db, "users", currentUser.uid, "following", targetUserId);
    const theirFollowerRef = doc(db, "users", targetUserId, "followers", currentUser.uid);

    await setDoc(myFollowingRef,   { followedAt: serverTimestamp() });
    await setDoc(theirFollowerRef, { followedAt: serverTimestamp(), followerUid: currentUser.uid });

    await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
    await updateDoc(doc(db, "users", targetUserId),    { followersCount: increment(1) });
    setIsFollowing(true);
  };

  // 언팔로우
  const unfollow = async () => {
    if (!currentUser) return;
    const myFollowingRef   = doc(db, "users", currentUser.uid, "following", targetUserId);
    const theirFollowerRef = doc(db, "users", targetUserId, "followers", currentUser.uid);

    await deleteDoc(myFollowingRef);
    await deleteDoc(theirFollowerRef);

    await updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
    await updateDoc(doc(db, "users", targetUserId),    { followersCount: increment(-1) });
    setIsFollowing(false);
  };

  const toggleFollow = () => (isFollowing ? unfollow() : follow());

  return { isFollowing, toggleFollow, checkLoading };
};
