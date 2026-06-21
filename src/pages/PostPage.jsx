// src/pages/PostPage.jsx
// 게시물 상세 페이지

import { useParams, Link } from "react-router-dom";
import PostDetail from "../components/PostDetail";
import { useAuth } from "../context/AuthContext";

const PostPage = () => {
  const { postId } = useParams();
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
            ← 피드로
          </Link>
          {currentUser ? (
            <button
              onClick={logout}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="text-xs text-stone-600 hover:text-stone-900 transition-colors">
              로그인
            </Link>
          )}
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostDetail postId={postId} />
      </main>
    </div>
  );
};

export default PostPage;
