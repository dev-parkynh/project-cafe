// src/pages/MainPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ChatBot from '../components/ChatBot';

function MainPage() {
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [branches,  setBranches]  = useState([]);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('전체');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [userRes, productsRes, branchesRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/products'),
        api.get('/api/branches')
      ]);
      setUser(userRes.data.user);
      setProducts(productsRes.data.products);
      setBranches(branchesRes.data.branches);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/login');
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/uploads')) {
      return process.env.NODE_ENV === 'production'
        ? url : `http://localhost:8080${url}`;
    }
    return url;
  };

  const categories = ['전체', '커피', '논커피', '디저트'];
  const filteredProducts = activeTab === '전체'
    ? products
    : products.filter(p => p.category_name === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F5F5F7]">
        <div className="text-center">
          <div className="text-3xl font-black tracking-widest text-[#1D1D1F] mb-3">BREWY</div>
          <p className="text-sm text-[#86868B]">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#D2D2D7]/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-widest text-[#1D1D1F]">BREWY</h1>
          <nav className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-[#86868B]">
              안녕하세요, <span className="font-semibold text-[#1D1D1F]">{user?.name}</span>님
            </span>
            <button
              onClick={() => navigate('/mypage')}
              className="px-4 py-1.5 text-sm font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-colors"
            >
              마이페이지
            </button>
            {localStorage.getItem('role') === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-1.5 text-sm font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-full transition-colors"
              >
                관리자
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 text-sm font-medium text-[#86868B] hover:bg-[#F5F5F7] rounded-full transition-colors"
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <div
        className="relative h-72 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center text-white px-6">
          <p className="text-xs font-semibold tracking-[4px] text-white/70 mb-3 uppercase">BREWY CAFE</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            오늘의 한 잔,<br />미리 주문하고 바로 픽업
          </h2>
          <p className="text-sm text-white/70">대기 없이 편리하게, 브루이 카페의 시그니처 메뉴를 만나보세요</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ── 지점 안내 ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1D1D1F]">지점 안내</h2>
            <span className="text-sm text-[#86868B]">{branches.length}개 지점 운영중</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map(b => (
              <div
                key={b.branch_id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0F0F0] hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1D1D1F] text-sm">{b.name}</h3>
                    <p className="text-xs text-[#86868B] mt-0.5">{b.address}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[#86868B] flex items-center gap-1.5">
                    <span>📞</span> {b.phone}
                  </span>
                  <span className="text-xs text-[#86868B] flex items-center gap-1.5">
                    <span>🕐</span> {b.open_time} ~ {b.close_time}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="inline-block px-2.5 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                    영업중
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 메뉴 ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#1D1D1F]">메뉴</h2>
            <span className="text-sm text-[#86868B]">{filteredProducts.length}개</span>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === cat
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'bg-white text-[#86868B] border border-[#D2D2D7] hover:border-[#1D1D1F] hover:text-[#1D1D1F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 메뉴 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div
                key={p.product_id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0F0F0] transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                  p.is_sold_out === 1 ? 'opacity-50' : ''
                }`}
              >
                {/* 이미지 */}
                <div className="relative">
                  {getImageUrl(p.image_url) ? (
                    <img
                      src={getImageUrl(p.image_url)}
                      alt={p.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-[#F5F5F7] flex items-center justify-center text-4xl">
                      ☕
                    </div>
                  )}
                  {p.is_sold_out === 1 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-[#1D1D1F] text-xs font-bold px-3 py-1 rounded-full">
                        품절
                      </span>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 bg-[#F5F5F7] text-[#86868B] text-xs rounded-md mb-2">
                    {p.category_name}
                  </span>
                  <h3 className="font-semibold text-[#1D1D1F] text-sm mb-1">{p.name}</h3>
                  <p className="text-xs text-[#AEAEB2] mb-2 line-clamp-2">{p.description}</p>
                  <p className="font-bold text-[#1D1D1F] text-base">
                    {p.price?.toLocaleString()}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <ChatBot />
    </div>
  );
}

export default MainPage;
