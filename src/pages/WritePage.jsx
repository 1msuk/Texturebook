// src/pages/WritePage.jsx
// 글쓰기 페이지

import { useNavigate } from "react-router-dom";
import PostEditor from "../components/PostEditor";

const WritePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-stone-400 hover:text-stone-700 text-sm transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="font-semibold text-stone-900">새 글 작성</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PostEditor onSuccess={() => navigate("/")} />
      </main>
    </div>
  );
};

export default WritePage;
