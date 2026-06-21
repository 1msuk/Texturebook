// src/utils/uploadMedia.js
// UUID 기반 중복 방지 미디어 업로드 유틸리티

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../firebase/firebase";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_SIZE = 5  * 1024 * 1024;  // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB

/**
 * 단일 파일 업로드
 * @param {File}     file       - 업로드할 파일
 * @param {string}   uid        - 현재 유저 UID
 * @param {string}   folder     - 'posts' | 'profiles'
 * @param {Function} onProgress - 진행률 콜백 (0~100)
 * @returns {Promise<{url: string, type: string}>}
 */
export const uploadMedia = (file, uid, folder = "posts", onProgress = null) => {
  return new Promise((resolve, reject) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return reject(new Error("허용되지 않는 파일 형식입니다. (JPG, PNG, WEBP, GIF, MP4, WEBM만 가능)"));
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return reject(new Error(`파일 크기 초과: ${isImage ? "이미지 5MB" : "동영상 50MB"} 이하만 가능`));
    }

    // UUID 파일명 — 중복 및 경로 추측 방지
    const ext          = file.name.split(".").pop().toLowerCase();
    const uniqueName   = `${uuidv4()}.${ext}`;
    const storageRef   = ref(storage, `${folder}/${uid}/${uniqueName}`);
    const uploadTask   = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        if (onProgress) onProgress(pct);
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, type: file.type });
      }
    );
  });
};

/**
 * 다중 파일 업로드 (최대 4개)
 */
export const uploadMultipleMedia = async (files, uid, onProgress = null) => {
  if (files.length > 4) throw new Error("파일은 최대 4개까지 업로드 가능합니다.");
  return Promise.all(
    files.map((file, idx) =>
      uploadMedia(file, uid, "posts", (p) => { if (onProgress) onProgress(idx, p); })
    )
  );
};
