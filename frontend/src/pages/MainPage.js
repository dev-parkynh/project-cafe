// src/pages/MainPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ChatBot from '../components/ChatBot';

const BRANCH_COORDS = {
  '테스트 지점 A': { lat: 37.5498, lng: 126.9137 },
  '테스트 지점 B': { lat: 37.5566, lng: 126.9239 },
  '테스트 지점 C': { lat: 37.5479, lng: 126.9229 },
};

const TEST_BRANCH_NAMES = ['테스트 지점 A', '테스트 지점 B', '테스트 지점 C'];
const TEST_BRANCH_ADDR  = '임의의 장소 (테스트용)';
const TEST_BRANCH_PHONE = '000-0000-0000 (테스트)';

const ALLERGY_INFO = {
  '커피':   '카페인, 우유(milk) 함유 · 견과류 제조 시설 사용',
  '논커피': '우유(milk), 대두 함유 · 견과류 제조 시설 사용',
  '디저트': '밀(gluten), 달걀, 우유, 견과류 함유',
};

function MainPage() {
  const navigate  = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [branches,  setBranches]  = useState([]);
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('전체');

  // 장바구니
  const [cart,           setCart]           = useState([]);
  const [showCart,       setShowCart]       = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [pickupTime,     setPickupTime]     = useState('');
  const [ordering,       setOrdering]       = useState(false);
  const [orderSuccess,   setOrderSuccess]   = useState(null); // 주문 완료 결과

  // 모달
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mapModalBranch,  setMapModalBranch]  = useState(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!mapModalBranch) return;
    const coords = BRANCH_COORDS[mapModalBranch.name] || { lat: 37.5498, lng: 126.9137 };

    const renderMap = () => {
      const container = document.getElementById('kakao-map');
      if (!container) return;
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(coords.lat, coords.lng),
        level: 4,
      });
      const pos = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      const marker = new window.kakao.maps.Marker({ map, position: pos });
      const info = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;font-weight:600;">${mapModalBranch.name}<br/><span style="font-size:12px;font-weight:400;color:#6E6E73;">${mapModalBranch.address || ''}</span></div>`,
      });
      info.open(map, marker);
    };

    if (window.kakao?.maps) {
      renderMap();
    } else {
      const existing = document.getElementById('kakao-map-script');
      if (existing) {
        existing.addEventListener('load', () => window.kakao.maps.load(renderMap));
      } else {
        const script = document.createElement('script');
        script.id  = 'kakao-map-script';
        script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=48ebe7ee28ce3da4bb7c5d6e2d32763f&autoload=false';
        script.async = true;
        script.onload = () => window.kakao.maps.load(renderMap);
        document.head.appendChild(script);
      }
    }
  }, [mapModalBranch]);

  const fetchData = async () => {
    try {
      const [userRes, productsRes, branchesRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/products'),
        api.get('/api/branches'),
      ]);
      setUser(userRes.data.user);
      setProducts(productsRes.data.products);
      setBranches(branchesRes.data.branches.map((b, i) => ({
        ...b,
        name:    TEST_BRANCH_NAMES[i] ?? b.name,
        address: TEST_BRANCH_ADDR,
        phone:   TEST_BRANCH_PHONE,
      })));
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
      return process.env.NODE_ENV === 'production' ? url : `http://localhost:8080${url}`;
    }
    return url;
  };

  // ── 장바구니 함수 ──────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product_id === product.product_id);
      if (exists) return prev.map(i => i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQty = (product_id, delta) => {
    setCart(prev =>
      prev.map(i => i.product_id === product_id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  };

  const removeFromCart = (product_id) => {
    setCart(prev => {
      const next = prev.filter(i => i.product_id !== product_id);
      if (next.length === 0) setShowCart(false);
      return next;
    });
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ── 픽업 시간 빠른 선택 ────────────────────────────────────
  const pickupOptions = [30, 60, 90, 120].map(min => {
    const d = new Date(Date.now() + min * 60000);
    const pad = n => String(n).padStart(2, '0');
    const label = `${pad(d.getHours())}:${pad(d.getMinutes())} (+${min}분)`;
    const value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { label, value };
  });

  // ── 주문하기 ───────────────────────────────────────────────
  const handleOrder = async () => {
    if (!selectedBranch) { alert('지점을 선택해주세요!'); return; }
    if (!pickupTime)     { alert('픽업 시간을 선택해주세요!'); return; }
    setOrdering(true);
    try {
      const res = await api.post('/api/orders', {
        branchId:   Number(selectedBranch),
        pickupTime: new Date(pickupTime).toISOString(),
        items: cart.map(i => ({ productId: i.product_id, quantity: i.quantity })),
      });
      setOrderSuccess(res.data.order);
      setCart([]);
      setSelectedBranch('');
      setPickupTime('');
    } catch (err) {
      alert(err.response?.data?.message || '주문에 실패했어요. 다시 시도해주세요.');
    } finally {
      setOrdering(false);
    }
  };

  const categories       = ['전체', '커피', '논커피', '디저트'];
  const filteredProducts = activeTab === '전체' ? products : products.filter(p => p.category_name === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="text-[22px] font-black tracking-[10px] text-[#1D1D1F] mb-2">BREWY</div>
          <p className="text-[13px] text-[#AEAEB2]">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  // ── 주문 완료 화면 ─────────────────────────────────────────
  if (orderSuccess) {
    const branchName = branches.find(b => b.branch_id === Number(selectedBranch || 0))?.name || '선택 지점';
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-[360px]">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight mb-2">주문 완료!</h2>
          <p className="text-[15px] text-[#6E6E73] mb-8">픽업 준비가 되면 알려드릴게요.</p>

          <div className="bg-[#F5F5F7] rounded-[20px] p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-[13px] text-[#AEAEB2]">주문번호</span>
              <span className="text-[13px] font-semibold text-[#1D1D1F] font-mono">{orderSuccess.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[13px] text-[#AEAEB2]">결제금액</span>
              <span className="text-[15px] font-bold text-[#6F4E37]">{orderSuccess.total_price?.toLocaleString()}원</span>
            </div>
          </div>

          <button onClick={() => setOrderSuccess(null)}
            className="w-full py-4 bg-[#1D1D1F] text-white text-[15px] font-semibold rounded-2xl mb-3">
            계속 주문하기
          </button>
          <button onClick={() => navigate('/mypage')}
            className="w-full py-4 bg-[#F5F5F7] text-[#1D1D1F] text-[15px] font-semibold rounded-2xl">
            주문 내역 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── 네비게이션 ── */}
      <header className="sticky top-0 z-50 h-11 bg-[rgba(255,255,255,0.72)] backdrop-blur-2xl border-b border-[#D2D2D7]/30"
        style={{ WebkitBackdropFilter: 'saturate(180%) blur(20px)', backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <span className="text-[13px] font-black tracking-[6px] text-[#1D1D1F]">BREWY</span>
          <nav className="flex items-center gap-5">
            <span className="hidden sm:block text-[13px] text-[#6E6E73]">{user?.name}님</span>
            <button onClick={() => navigate('/mypage')} className="text-[13px] text-[#1D1D1F] hover:text-[#6F4E37] transition-colors">마이페이지</button>
            {localStorage.getItem('role') === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-[13px] text-[#0071E3] hover:opacity-70 transition-opacity">관리자</button>
            )}
            <button onClick={handleLogout} className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">로그아웃</button>
            {/* 장바구니 아이콘 */}
            {cartCount > 0 && (
              <button onClick={() => setShowCart(true)}
                className="relative text-[13px] text-[#1D1D1F] font-medium">
                🛒
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#6F4E37] text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <div className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '620px', backgroundImage: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1800&q=80&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/40 to-black/70" />
        <div className="relative z-10 text-center text-white px-6 py-28">
          <p className="text-[11px] font-semibold tracking-[6px] text-white/40 uppercase mb-8">BREWY CAFE</p>
          <h2 className="text-[64px] sm:text-[80px] md:text-[96px] font-bold leading-[1.02] tracking-tight mb-6">오늘의 한 잔.</h2>
          <p className="text-[19px] text-white/55 font-light mb-12 max-w-[500px] mx-auto leading-relaxed">
            미리 주문하고 대기 없이<br className="sm:hidden" /> 바로 픽업하세요
          </p>
          <a href="#menu" className="inline-flex items-center gap-1.5 text-[17px] text-white/70 hover:text-white transition-colors group">
            메뉴 보기 <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">›</span>
          </a>
        </div>
      </div>

      {/* ── 지점 안내 ── */}
      <section className="bg-white py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-[34px] font-bold text-[#1D1D1F] tracking-tight mb-2">지점 안내</h2>
            <p className="text-[16px] text-[#6E6E73]">브루이 카페 전국 지점에서 픽업 주문이 가능합니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {branches.map(b => (
              <div key={b.branch_id}
                onClick={() => setMapModalBranch(b)}
                className="bg-[#F5F5F7] rounded-[20px] p-8 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                <h3 className="text-[16px] font-semibold text-[#1D1D1F] mb-1.5">{b.name}</h3>
                <p className="text-[13px] text-[#6E6E73] leading-relaxed mb-4">{b.address}</p>
                <div className="space-y-1 mb-5">
                  <p className="text-[13px] text-[#AEAEB2]">{b.phone}</p>
                  <p className="text-[13px] text-[#AEAEB2]">{b.open_time} – {b.close_time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-[12px] font-medium rounded-full">영업중</span>
                  <span className="text-[12px] text-[#AEAEB2] group-hover:text-[#6F4E37] transition-colors">지도 보기 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 메뉴 ── */}
      <section id="menu" className="bg-[#F5F5F7] py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-[34px] font-bold text-[#1D1D1F] tracking-tight mb-2">메뉴</h2>
            <p className="text-[16px] text-[#6E6E73]">브루이의 시그니처 메뉴를 만나보세요.</p>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-10 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 ${
                  activeTab === cat ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#6E6E73] hover:text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* 메뉴 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map(p => (
              <div key={p.product_id}
                onClick={() => setSelectedProduct(p)}
                className={`bg-white rounded-[20px] overflow-hidden transition-all duration-300 cursor-pointer ${
                  p.is_sold_out === 1 ? 'opacity-50' : 'hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]'
                }`}>

                {/* 이미지 */}
                <div className="relative h-44 overflow-hidden">
                  {getImageUrl(p.image_url) ? (
                    <img src={getImageUrl(p.image_url)} alt={p.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-[#F5F5F7] flex items-center justify-center">
                      <span className="text-4xl opacity-20">☕</span>
                    </div>
                  )}
                  {p.is_sold_out === 1 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="bg-[#1D1D1F] text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-wide">SOLD OUT</span>
                    </div>
                  )}
                </div>

                {/* 정보 + 담기 버튼 */}
                <div className="p-4">
                  <h3 className="text-[14px] font-semibold text-[#1D1D1F] mb-1 leading-snug">{p.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[14px] font-bold text-[#1D1D1F]">{p.price?.toLocaleString()}원</p>
                    <button
                      disabled={p.is_sold_out === 1}
                      onClick={e => { e.stopPropagation(); addToCart(p); }}
                      className="px-3 py-1.5 bg-[#1D1D1F] hover:bg-[#3D3D3F] active:scale-95 text-white text-[12px] font-medium rounded-full transition-all disabled:opacity-30">
                      담기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="bg-[#F5F5F7] border-t border-[#D2D2D7]/30 py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <span className="text-[12px] font-black tracking-[6px] text-[#1D1D1F]">BREWY</span>
          <p className="text-[12px] text-[#AEAEB2]">© 2026 BREWY. 박용희</p>
        </div>
      </footer>

      {/* ── 하단 고정 장바구니 바 ── */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2">
          <button onClick={() => setShowCart(true)}
            className="w-full max-w-[600px] mx-auto flex items-center justify-between bg-[#1D1D1F] text-white px-6 py-4 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] block">
            <span className="text-[14px]">🛒 {cartCount}개</span>
            <span className="text-[15px] font-semibold">장바구니 보기</span>
            <span className="text-[14px] font-bold text-[#E8C9A0]">{cartTotal.toLocaleString()}원</span>
          </button>
        </div>
      )}

      {/* ── 장바구니 바텀 시트 ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 배경 딤 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />

          {/* 시트 */}
          <div className="relative bg-white rounded-t-[28px] max-h-[85vh] overflow-y-auto">
            {/* 핸들 */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 bg-[#D2D2D7] rounded-full" />
            </div>

            <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[22px] font-bold text-[#1D1D1F]">장바구니</h3>
                <button onClick={() => setShowCart(false)} className="text-[#AEAEB2] text-[24px] leading-none">×</button>
              </div>

              {/* 담긴 상품 목록 */}
              <div className="space-y-4 mb-6">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F5F5F7] flex-shrink-0">
                      {getImageUrl(item.image_url)
                        ? <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="w-full h-full flex items-center justify-center text-xl">☕</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1D1D1F] truncate">{item.name}</p>
                      <p className="text-[13px] text-[#6F4E37] font-medium">{(item.price * item.quantity).toLocaleString()}원</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product_id, -1)}
                        className="w-7 h-7 bg-[#F5F5F7] rounded-full text-[16px] font-bold text-[#1D1D1F] flex items-center justify-center hover:bg-[#E8E8ED]">−</button>
                      <span className="text-[14px] font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, 1)}
                        className="w-7 h-7 bg-[#F5F5F7] rounded-full text-[16px] font-bold text-[#1D1D1F] flex items-center justify-center hover:bg-[#E8E8ED]">+</button>
                      <button onClick={() => removeFromCart(item.product_id)}
                        className="w-7 h-7 text-[#AEAEB2] text-[18px] flex items-center justify-center hover:text-[#FF3B30] ml-1">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-[#F5F5F7] mb-6" />

              {/* 지점 선택 */}
              <div className="mb-4">
                <label className="text-[13px] font-semibold text-[#1D1D1F] mb-2 block">픽업 지점</label>
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[14px] text-[#1D1D1F] outline-none focus:border-[#6F4E37] focus:bg-white transition-all">
                  <option value="">지점을 선택하세요</option>
                  {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.name}</option>)}
                </select>
              </div>

              {/* 픽업 시간 */}
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-[#1D1D1F] mb-2 block">픽업 시간</label>
                <div className="grid grid-cols-4 gap-2">
                  {pickupOptions.map(opt => (
                    <button key={opt.value} onClick={() => setPickupTime(opt.value)}
                      className={`py-2 text-[12px] font-medium rounded-xl transition-all ${
                        pickupTime === opt.value ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 합계 */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[15px] font-semibold text-[#1D1D1F]">합계</span>
                <span className="text-[22px] font-bold text-[#6F4E37]">{cartTotal.toLocaleString()}원</span>
              </div>

              {/* 주문하기 버튼 */}
              <button onClick={handleOrder} disabled={ordering}
                className="w-full py-4 bg-[#6F4E37] hover:bg-[#5C3D28] active:scale-[0.99] text-white text-[16px] font-bold rounded-2xl transition-all disabled:opacity-50">
                {ordering ? '주문 중...' : `${cartTotal.toLocaleString()}원 주문하기`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 메뉴 상세 모달 ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white rounded-[28px] w-full max-w-[400px] overflow-hidden shadow-2xl">
            {/* 이미지 */}
            <div className="relative h-56">
              {getImageUrl(selectedProduct.image_url) ? (
                <img src={getImageUrl(selectedProduct.image_url)} alt={selectedProduct.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F5F5F7] flex items-center justify-center">
                  <span className="text-6xl opacity-20">☕</span>
                </div>
              )}
              <button onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-xl leading-none transition-colors">
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            {/* 내용 */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-[22px] font-bold text-[#1D1D1F] tracking-tight">{selectedProduct.name}</h2>
                <span className="text-[22px] font-bold text-[#6F4E37] ml-4 whitespace-nowrap">{selectedProduct.price?.toLocaleString()}원</span>
              </div>
              <span className="inline-block px-2.5 py-1 bg-[#F5F5F7] text-[#6E6E73] text-[12px] rounded-full mb-3">{selectedProduct.category_name}</span>
              {selectedProduct.description && (
                <p className="text-[14px] text-[#6E6E73] mb-4 leading-relaxed">{selectedProduct.description}</p>
              )}
              {/* 알레르기 */}
              <div className="bg-amber-50 rounded-[14px] p-4 mb-5">
                <p className="text-[11px] font-semibold text-amber-700 mb-1">⚠ 알레르기 정보</p>
                <p className="text-[12px] text-amber-600 leading-relaxed">
                  {ALLERGY_INFO[selectedProduct.category_name] || '밀(gluten), 우유(milk) 함유 · 제조 시설 내 견과류 사용'}
                </p>
              </div>
              {/* 버튼 */}
              <button
                disabled={selectedProduct.is_sold_out === 1}
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                className="w-full py-4 bg-[#6F4E37] hover:bg-[#5C3D28] active:scale-[0.99] text-white text-[15px] font-bold rounded-2xl transition-all disabled:opacity-30">
                {selectedProduct.is_sold_out === 1 ? '품절' : '장바구니 담기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 카카오맵 지점 모달 ── */}
      {mapModalBranch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMapModalBranch(null)} />
          <div className="relative bg-white rounded-[28px] w-full max-w-[520px] overflow-hidden shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5F5F7]">
              <div>
                <p className="text-[11px] text-amber-600 font-medium mb-1">※ 테스트용 지점 정보입니다</p>
                <h3 className="text-[18px] font-bold text-[#1D1D1F]">{mapModalBranch.name}</h3>
                <p className="text-[13px] text-[#6E6E73] mt-0.5">{mapModalBranch.address}</p>
              </div>
              <button onClick={() => setMapModalBranch(null)}
                className="w-8 h-8 bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-full flex items-center justify-center text-[#6E6E73] text-xl leading-none transition-colors">
                ×
              </button>
            </div>
            {/* 지도 */}
            <div id="kakao-map" style={{ width: '100%', height: '300px' }} />
            {/* 정보 */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              <div className="bg-[#F5F5F7] rounded-[14px] p-4">
                <p className="text-[11px] text-[#AEAEB2] mb-1">전화</p>
                <p className="text-[13px] font-semibold text-[#1D1D1F]">{mapModalBranch.phone || '-'}</p>
              </div>
              <div className="bg-[#F5F5F7] rounded-[14px] p-4">
                <p className="text-[11px] text-[#AEAEB2] mb-1">영업시간</p>
                <p className="text-[13px] font-semibold text-[#1D1D1F]">{mapModalBranch.open_time} – {mapModalBranch.close_time}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatBot />
    </div>
  );
}

export default MainPage;
