// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('role',  res.data.role);
      localStorage.setItem('name',  res.data.name);
      if (res.data.role === 'admin') navigate('/admin');
      else navigate('/main');
    } catch {
      setError('이메일 또는 비밀번호가 틀렸어요!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans">

      {/* ── 왼쪽: 브랜드 패널 ── */}
      <div
        className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

        {/* 브랜드 콘텐츠 */}
        <div className="relative z-10 text-white text-center px-12">
          <h1 className="text-6xl font-black tracking-[10px] text-white mb-4">
            BREWY
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-10">
            당신의 하루를 향기롭게,<br />
            브루이 카페 픽업 주문 서비스
          </p>
          <div className="flex flex-col gap-3 items-center">
            {['간편한 사전 주문', '대기 없이 바로 픽업', '스탬프 적립 & 쿠폰 혜택'].map(f => (
              <div
                key={f}
                className="px-5 py-2 rounded-full text-sm text-white/90 bg-white/15 backdrop-blur-md border border-white/20"
              >
                ✓ {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 오른쪽: 로그인 폼 ── */}
      <div className="w-full lg:w-[460px] flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-[360px]">

          {/* 모바일 로고 */}
          <div className="lg:hidden text-center text-2xl font-black tracking-widest text-[#1D1D1F] mb-8">
            BREWY
          </div>

          {/* 타이틀 */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1D1D1F] mb-2">로그인</h2>
            <p className="text-sm text-[#86868B]">계정에 로그인하여 주문을 시작하세요</p>
          </div>

          {/* 이메일 */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">
              이메일
            </label>
            <input
              type="email"
              placeholder="example@brewy.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3.5 rounded-xl border border-[#D2D2D7] text-sm text-[#1D1D1F] outline-none transition-all duration-200 focus:border-[#6F4E37] focus:ring-4 focus:ring-[#6F4E37]/10 bg-[#F5F5F7] placeholder:text-[#AEAEB2]"
            />
          </div>

          {/* 비밀번호 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3.5 rounded-xl border border-[#D2D2D7] text-sm text-[#1D1D1F] outline-none transition-all duration-200 focus:border-[#6F4E37] focus:ring-4 focus:ring-[#6F4E37]/10 bg-[#F5F5F7] placeholder:text-[#AEAEB2]"
            />
          </div>

          {/* 에러 */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-[#6F4E37] hover:bg-[#5C3D28] active:bg-[#4A2C17] text-white font-semibold text-base rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mb-6 shadow-sm"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#D2D2D7]" />
            <span className="text-xs text-[#AEAEB2] font-medium">테스트 계정</span>
            <div className="flex-1 h-px bg-[#D2D2D7]" />
          </div>

          {/* 테스트 버튼 */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => { setEmail('test@brewy.com'); setPassword('12341234'); }}
              className="flex-1 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#D2D2D7] transition-all duration-200"
            >
              👨‍💼 관리자로 체험
            </button>
            <button
              onClick={() => { setEmail('user1@brewy.com'); setPassword('12341234'); }}
              className="flex-1 py-2.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#D2D2D7] transition-all duration-200"
            >
              👤 일반 유저로 체험
            </button>
          </div>

          <p className="text-center text-xs text-[#AEAEB2]">© 2026 BREWY. 박용희</p>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;
