// src/App.jsx
// 라우팅 설정

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage   from "./pages/HomePage";
import LoginPage  from "./pages/LoginPage";
import WritePage  from "./pages/WritePage";
import PostPage   from "./pages/PostPage";

// 로그인해야만 접근 가능한 라우트
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<HomePage />} />
    <Route path="/login"     element={<LoginPage />} />
    <Route path="/post/:postId" element={<PostPage />} />
    <Route
      path="/write"
      element={
        <PrivateRoute>
          <WritePage />
        </PrivateRoute>
      }
    />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
