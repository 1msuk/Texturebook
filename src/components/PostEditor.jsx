// src/components/PostEditor.jsx
// 텍스트 퍼스트 게시물 작성 컴포넌트

import { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { uploadMultipleMedia } from "../utils/uploadMedia";
import BadgeTag from "./BadgeTag";

// 기본 XSS 방지 (운영 시 dompurify 사용 권장)
const sanitize = (str) =>
  str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();

const PostEditor = ({ onSuccess }) => {
  const { currentUser, userProfile } = useAuth();

  const [title,     setTitle]     = useState("");
  const [body,      setBody]      = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [files,     setFiles]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState("");

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (!title.trim() || !body.trim()) {
      setError("제목과 본문을 모두 입력해 주세요.");
      return;
    }
    if (title.length > 100) {
      setError("제목은 100자 이하로 작성해 주세요.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      // 미디어 업로드 (선택)
      let mediaURLs = [], mediaTypes = [];
      if (files.length > 0) {
        const results = await uploadMultipleMedia(
          files,
          currentUser.uid,
          (idx, pct) => setProgress(Math.round(((idx + pct / 100) / files.length) * 100))
        );
        mediaURLs  = results.map((r) => r.url);
        mediaTypes = results.map((r) => r.type);
      }

      // Firestore 저장
      await addDoc(collection(db, "posts"), {
        authorUid:    currentUser.uid,
        authorName:   userProfile?.displayName || "독서가",
        authorPhotoURL: userProfile?.photoURL || null,
        authorBadges: userProfile?.badges || [],
        title:        sanitize(title),
        body:         sanitize(body),
        hasSpoiler,
        mediaURLs,
        mediaTypes,
        bookInfo:     null,
        reactions:    { delicious: 0, deep: 0, discuss: 0, bitter: 0 },
        commentCount: 0,
        createdAt:    serverTimestamp(),
        updatedAt:    serverTimestamp(),
      });

      // 작성자 postCount 증가
      await updateDoc(doc(db, "users", currentUser.uid), {
        postCount: increment(1),
      });

      // 초기화
      setTitle("");
      setBody("");
      setFiles([]);
      setHasSpoiler(false);
      setProgress(0);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[게시물 작성 오류]", err);
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
      {/* 작성자 */}
      <div className="flex items-center gap-3">
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt="프로필"
            className="w-10 h-10 rounded-full object-cover border border-stone-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-stone-300 flex items-center justify-center text-white font-bold text-sm">
            {userProfile?.displayName?.[0] || "?"}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-stone-800 text-sm">
            {userProfile?.displayName}
          </span>
          {userProfile?.badges?.map((b) => <BadgeTag key={b} badge={b} />)}
        </div>
      </div>

      {/* 제목 */}
      <input
        type="text"
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full text-xl font-bold text-stone-900 placeholder-stone-300 border-none outline-none bg-transparent"
      />

      {/* 본문 */}
      <textarea
        rows={6}
        maxLength={10000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="책에 대한 생각을 자유롭게 적어보세요..."
        className="w-full text-stone-700 placeholder-stone-300 border-none outline-none resize-none bg-transparent text-base leading-relaxed"
      />

      <hr className="border-stone-100" />

      {/* 옵션 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer text-stone-400 hover:text-stone-600 text-sm transition-colors">
            📎 미디어
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 4))}
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSpoiler}
              onChange={(e) => setHasSpoiler(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <span className="text-sm text-stone-500">스포일러 포함</span>
          </label>
        </div>

        {files.length > 0 && (
          <span className="text-xs text-stone-400">{files.length}개 파일 선택됨</span>
        )}

        <button
          onClick={handleSubmit}
          disabled={uploading || !title.trim() || !body.trim()}
          className="px-5 py-2 rounded-full bg-stone-900 text-white text-sm font-medium
                     hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? `업로드 중 ${progress}%...` : "발행하기"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default PostEditor;
