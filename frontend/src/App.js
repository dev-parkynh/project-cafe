import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import LoginPage     from './pages/LoginPage';
import MainPage      from './pages/MainPage';
import MyPage        from './pages/MyPage';
import AdminPage     from './pages/AdminPage';
import KakaoCallback from './pages/KakaoCallback';

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token
              ? <Navigate to="/main" />
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/main"
          element={<MainPage />}
        />
        <Route
          path="/mypage"
          element={<MyPage />}
        />
        <Route
          path="/admin"
          element={<AdminPage />}
        />
        {/* 카카오 로그인 콜백 */}
        <Route
          path="/auth/kakao/success"
          element={<KakaoCallback />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;