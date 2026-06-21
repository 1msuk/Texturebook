// src/components/PostDetail.jsx
// 게시물 상세 — 스포일러 블라인드 + 4가지 리액션 + 댓글 + 칭호

import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import BadgeTag from "./BadgeTag";

// 4가지 리액션 설정
const REACTIONS = [
  { key: "delicious", label: "맛있어요",   emoji: "😋", positive: true  },
  { key: "deep",      label: "심오해요",   emoji: "🌊", positive: true  },
  { key: "discuss",   label: "이야기해요", emoji: "💬", positive: false },
  { key: "bitter",    label: "안 맞아요",  emoji: "😬", positive: false },
];

const PostDetail = ({ postId }) => {
  const { currentUser } = useAuth();

  const [post,            setPost]            = useState(null);
  const [comments,        setComments]        = useState([]);
  const [myReaction,      setMyReaction]      = useState(null);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [commentInput,    setCommentInput]    = useState("");
  const [replyTo,         setReplyTo]         = useState(null); // { id, authorName }
  const [loading,         setLoading]         = useState(true);

  // 게시물 + 내 리액션 불러오기
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      const snap = await getDoc(doc(db, "posts", postId));
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });

      // 내 리액션 확인
      if (currentUser) {
        const rSnap = await getDoc(
          doc(db, "posts", postId, "userReactions", currentUser.uid)
        );
        if (rSnap.exists()) setMyReaction(rSnap.data().reactionType);
      }
      setLoading(false);
    };

    fetchPost();

    // 댓글 실시간 구독
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [postId, currentUser]);

  // ── 리액션 핸들러 ──────────────────────────────────
  const handleReaction = async (key) => {
    if (!currentUser || !post) return;

    const postRef      = doc(db, "posts", postId);
    const reactionRef  = doc(db, "posts", postId, "userReactions", currentUser.uid);
    const authorRef    = doc(db, "users", post.authorUid);
    const isPositive   = REACTIONS.find((r) => r.key === key)?.positive;

    // 같은 리액션 재클릭 → 취소
    if (myReaction === key) {
      await deleteDoc(reactionRef);
      await updateDoc(postRef, { [`reactions.${key}`]: increment(-1) });
      if (isPositive) await updateDoc(authorRef, { totalPositiveReactions: increment(-1) });
      setPost((p) => ({ ...p, reactions: { ...p.reactions, [key]: p.reactions[key] - 1 } }));
      setMyReaction(null);
      return;
    }

    // 기존 리액션 취소
    if (myReaction) {
      const wasPositive = REACTIONS.find((r) => r.key === myReaction)?.positive;
      await updateDoc(postRef, { [`reactions.${myReaction}`]: increment(-1) });
      if (wasPositive) await updateDoc(authorRef, { totalPositiveReactions: increment(-1) });
    }

    // 새 리액션 저장
    await setDoc(reactionRef, { reactionType: key, reactedAt: serverTimestamp() });
    await updateDoc(postRef,  { [`reactions.${key}`]: increment(1) });
    if (isPositive) await updateDoc(authorRef, { totalPositiveReactions: increment(1) });

    setPost((p) => ({
      ...p,
      reactions: {
        ...p.reactions,
        ...(myReaction && { [myReaction]: p.reactions[myReaction] - 1 }),
        [key]: p.reactions[key] + 1,
      },
    }));
    setMyReaction(key);
  };

  // ── 댓글 작성 ──────────────────────────────────────
  const handleCommentSubmit = async () => {
    if (!currentUser || !commentInput.trim()) return;

    const commentData = {
      postId,
      parentCommentId:  replyTo?.id || null,
      authorUid:        currentUser.uid,
      authorName:       currentUser.displayName || "독서가",
      authorPhotoURL:   currentUser.photoURL || null,
      authorBadges:     [],
      body:             commentInput.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      likeCount:        0,
      createdAt:        serverTimestamp(),
    };

    await addDoc(collection(db, "comments"), commentData);
    await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
    await updateDoc(doc(db, "users", currentUser.uid), { commentCount: increment(1) });

    setCommentInput("");
    setReplyTo(null);
  };

  // ── 댓글 좋아요 ────────────────────────────────────
  const handleCommentLike = async (commentId) => {
    if (!currentUser) return;
    const likeRef    = doc(db, "comments", commentId, "likes", currentUser.uid);
    const commentRef = doc(db, "comments", commentId);
    const likeSnap   = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(commentRef, { likeCount: increment(-1) });
    } else {
      await setDoc(likeRef, { likedAt: serverTimestamp() });
      await updateDoc(commentRef, { likeCount: increment(1) });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-stone-400">
        불러오는 중...
      </div>
    );
  }
  if (!post) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center text-stone-400">
        게시물을 찾을 수 없습니다.
      </div>
    );
  }

  const isSpoilerHidden = post.hasSpoiler && !spoilerRevealed;
  const topComments     = comments.filter((c) => !c.parentCommentId);
  const getReplies      = (id) => comments.filter((c) => c.parentCommentId === id);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── 게시물 카드 ── */}
      <article className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">

        {/* 작성자 헤더 */}
        <header className="flex items-center gap-3 p-6 pb-4">
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              alt={post.authorName}
              className="w-11 h-11 rounded-full object-cover border border-stone-200 flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-stone-300 flex items-center justify-center
                            text-white font-bold text-sm flex-shrink-0">
              {post.authorName?.[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-900 text-sm">{post.authorName}</span>
              {/* 칭호 뱃지 — 신뢰도 마크 */}
              {post.authorBadges?.map((b) => <BadgeTag key={b} badge={b} />)}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {post.createdAt?.toDate?.().toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>

          {post.hasSpoiler && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-200">
              ⚠️ 스포일러
            </span>
          )}
        </header>

        {/* 콘텐츠 */}
        <div className="px-6 pb-4">
          <h1 className="text-xl font-bold text-stone-900 mb-3 leading-snug">{post.title}</h1>

          {/* 스포일러 블라인드 */}
          <div className="relative">
            <p className={`text-stone-700 leading-relaxed whitespace-pre-wrap text-sm
                           transition-all duration-300 ${isSpoilerHidden ? "blur-sm select-none" : ""}`}>
              {post.body}
            </p>
            {isSpoilerHidden && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setSpoilerRevealed(true)}
                  className="px-4 py-2 bg-stone-900 text-white text-sm rounded-full
                             hover:bg-stone-700 transition-colors shadow-lg"
                >
                  스포일러 보기
                </button>
              </div>
            )}
          </div>

          {/* 미디어 */}
          {post.mediaURLs?.length > 0 && (
            <div className={`mt-4 grid gap-2 ${post.mediaURLs.length === 1 ? "grid-cols-1" : "grid-cols-2"}
                             transition-all duration-300 ${isSpoilerHidden ? "blur-sm" : ""}`}>
              {post.mediaURLs.map((url, i) =>
                post.mediaTypes?.[i]?.startsWith("video") ? (
                  <video key={i} src={url} controls className="w-full rounded-xl object-cover max-h-72" />
                ) : (
                  <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-72" />
                )
              )}
            </div>
          )}

          {/* 책 카드 */}
          {post.bookInfo && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50">
              {post.bookInfo.coverURL && (
                <img src={post.bookInfo.coverURL} alt={post.bookInfo.title}
                     className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-stone-900 text-sm">{post.bookInfo.title}</p>
                <p className="text-stone-500 text-xs">{post.bookInfo.author}</p>
                <p className="text-stone-400 text-xs mt-0.5">ISBN {post.bookInfo.isbn}</p>
              </div>
            </div>
          )}
        </div>

        {/* 리액션 버튼 */}
        <div className="px-6 py-4 border-t border-stone-100">
          <p className="text-xs text-stone-400 mb-3 font-medium tracking-wide uppercase">이 글의 맛은?</p>
          <div className="flex items-center gap-2 flex-wrap">
            {REACTIONS.map(({ key, label, emoji }) => {
              const isActive = myReaction === key;
              const count    = post.reactions?.[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  disabled={!currentUser}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border
                              transition-all duration-150 active:scale-95
                              ${isActive
                                ? "bg-stone-900 text-white border-stone-900 scale-105"
                                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50"}
                              disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs">{label}</span>
                  {count > 0 && (
                    <span className={`text-xs tabular-nums ${isActive ? "text-stone-300" : "text-stone-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!currentUser && (
            <p className="mt-2 text-xs text-stone-400">리액션은 로그인 후 남길 수 있습니다.</p>
          )}
        </div>
      </article>

      {/* ── 댓글 섹션 ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">댓글 {comments.length}개</h2>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {topComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onLike={handleCommentLike}
                onReply={() =>
                  setReplyTo(
                    replyTo?.id === comment.id
                      ? null
                      : { id: comment.id, authorName: comment.authorName }
                  )
                }
              />
              {/* 대댓글 */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-10 mt-2">
                  <CommentItem comment={reply} onLike={handleCommentLike} onReply={null} />
                </div>
              ))}
              {/* 답글 입력창 */}
              {replyTo?.id === comment.id && (
                <div className="ml-10 mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                    placeholder={`@${comment.authorName}에게 답글...`}
                    className="flex-1 text-sm px-4 py-2 rounded-full border border-stone-200
                               outline-none focus:border-stone-400 bg-stone-50"
                  />
                  <button
                    onClick={handleCommentSubmit}
                    className="px-3 py-2 rounded-full bg-stone-900 text-white text-xs font-medium
                               hover:bg-stone-700 transition-colors"
                  >
                    등록
                  </button>
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-4">
              첫 번째 댓글을 남겨보세요 📖
            </p>
          )}
        </div>

        {/* 최상위 댓글 입력 */}
        {!replyTo && (
          <div className="flex gap-3 mt-5 pt-4 border-t border-stone-100">
            <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center
                            text-white text-xs font-bold flex-shrink-0">
              {currentUser?.displayName?.[0] || "?"}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
                placeholder={
                  currentUser
                    ? "이 책에 대한 생각을 나눠보세요..."
                    : "로그인 후 댓글을 남길 수 있어요"
                }
                disabled={!currentUser}
                className="flex-1 text-sm px-4 py-2.5 rounded-full border border-stone-200
                           outline-none focus:border-stone-400 bg-stone-50
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || !currentUser}
                className="px-4 py-2 rounded-full bg-stone-900 text-white text-sm font-medium
                           hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed
                           transition-colors"
              >
                등록
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

// ── 댓글 단일 아이템 ──────────────────────────────────
const CommentItem = ({ comment, onLike, onReply }) => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center
                    text-stone-600 font-bold text-xs flex-shrink-0">
      {comment.authorName?.[0]}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-sm font-semibold text-stone-800">{comment.authorName}</span>
        {comment.authorBadges?.map((b) => <BadgeTag key={b} badge={b} />)}
        <span className="text-xs text-stone-400">
          {comment.createdAt?.toDate?.().toLocaleDateString("ko-KR")}
        </span>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed">{comment.body}</p>
      <div className="flex items-center gap-3 mt-1.5">
        <button
          onClick={() => onLike(comment.id)}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-rose-500 transition-colors"
        >
          🤍 {comment.likeCount}
        </button>
        {onReply && (
          <button
            onClick={onReply}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            답글
          </button>
        )}
      </div>
    </div>
  </div>
);

export default PostDetail;
