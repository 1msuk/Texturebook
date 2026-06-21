// src/pages/LoginPage.jsx
// 로그인 / 회원가입 페이지

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const [mode,     setMode]     = useState("login"); // "login" | "register"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (e) {
      setError("구글 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력하세요."); return; }
    if (mode === "register" && !name) { setError("닉네임을 입력하세요."); return; }

    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
      navigate("/");
    } catch (e) {
      const msg = {
        "auth/user-not-found":    "존재하지 않는 이메일입니다.",
        "auth/wrong-password":    "비밀번호가 틀렸습니다.",
        "auth/email-already-in-use": "이미 사용 중인 이메일입니다.",
        "auth/weak-password":     "비밀번호는 6자 이상이어야 합니다.",
      }[e.code] || "오류가 발생했습니다. 다시 시도해 주세요.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-5">
        {/* 브랜드 */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Texturebook</h1>
          <p className="text-xs text-stone-400 mt-1">책의 질감을 음미하다</p>
        </div>

        {/* 탭 */}
        <div className="flex rounded-xl bg-stone-100 p-1">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {/* 입력 필드 */}
        <div className="space-y-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="닉네임"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm
                         outline-none focus:border-stone-400 bg-stone-50"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm
                       outline-none focus:border-stone-400 bg-stone-50"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm
                       outline-none focus:border-stone-400 bg-stone-50"
          />
        </div>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium
                     hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-stone-200" />
          <span className="text-xs text-stone-400">또는</span>
          <hr className="flex-1 border-stone-200" />
        </div>

        {/* Google 로그인 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium
                     text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors
                     flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
