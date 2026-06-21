// src/pages/HomePage.jsx
// 메인 피드 페이지

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import BadgeTag from "../components/BadgeTag";
import { Link } from "react-router-dom";

const REACTIONS_META = [
  { key: "delicious", emoji: "😋" },
  { key: "deep",      emoji: "🌊" },
  { key: "discuss",   emoji: "💬" },
  { key: "bitter",    emoji: "😬" },
];

// 피드 카드 아이템
const FeedCard = ({ post }) => {
  const isSpoiler = post.hasSpoiler;

  return (
    <Link
      to={`/post/${post.id}`}
      className="block bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-sm
                 transition-shadow cursor-pointer"
    >
      {/* 작성자 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center
                        text-stone-600 font-bold text-xs flex-shrink-0">
          {post.authorName?.[0]}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-stone-800">{post.authorName}</span>
          {post.authorBadges?.map((b) => <BadgeTag key={b} badge={b} />)}
        </div>
        {isSpoiler && (
          <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-400 border border-red-100 flex-shrink-0">
            스포일러
          </span>
        )}
      </div>

      {/* 제목 */}
      <h2 className="font-bold text-stone-900 mb-1 leading-snug line-clamp-2">{post.title}</h2>

      {/* 본문 (스포일러면 블러) */}
      <p className={`text-sm text-stone-500 line-clamp-2 leading-relaxed transition-all
                     ${isSpoiler ? "blur-sm select-none" : ""}`}>
        {post.body}
      </p>

      {/* 책 카드 미니 */}
      {post.bookInfo && (
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
          📚 {post.bookInfo.title} · {post.bookInfo.author}
        </div>
      )}

      {/* 리액션 요약 */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100">
        {REACTIONS_META.map(({ key, emoji }) =>
          (post.reactions?.[key] ?? 0) > 0 ? (
            <span key={key} className="text-xs text-stone-400">
              {emoji} {post.reactions[key]}
            </span>
          ) : null
        )}
        <span className="text-xs text-stone-400 ml-auto">💬 {post.commentCount ?? 0}</span>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const { currentUser, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 최신 게시물 20개 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-stone-900 tracking-tight">Texturebook</h1>
            <p className="text-xs text-stone-400">책의 질감을 음미하다</p>
          </div>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  to="/write"
                  className="px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-medium
                             hover:bg-stone-700 transition-colors"
                >
                  ✏️ 글쓰기
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-full border border-stone-200 text-xs text-stone-600
                             hover:bg-stone-50 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-medium
                           hover:bg-stone-700 transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 피드 */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading && (
          <div className="text-center py-12 text-stone-400">피드를 불러오는 중...</div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 text-stone-400">
            <p className="text-3xl mb-2">📖</p>
            <p className="text-sm">아직 게시물이 없습니다.</p>
            <p className="text-xs mt-1">첫 번째 글을 남겨보세요!</p>
          </div>
        )}

        {posts.map((post) => <FeedCard key={post.id} post={post} />)}
      </main>
    </div>
  );
};

export default HomePage;
