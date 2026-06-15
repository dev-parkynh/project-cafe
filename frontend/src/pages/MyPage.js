// src/pages/MyPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function MyPage() {
  const navigate = useNavigate();
  const [user,       setUser]       = useState(null);
  const [stampCount, setStampCount] = useState(null);
  const [coupons,    setCoupons]    = useState([]);
  const [orders,     setOrders]     = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [userRes, stampCountRes, couponsRes, ordersRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/stamps/count'),
        api.get('/api/coupons'),
        api.get('/api/orders')
      ]);
      setUser(userRes.data.user);
      setStampCount(stampCountRes.data.data);
      setCoupons(couponsRes.data.coupons);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('주문을 취소할까요?')) return;
    try {
      await api.patch(`/api/orders/${orderId}/cancel`);
      alert('주문이 취소됐어요!');
      fetchData();
    } catch {
      alert('취소 실패했어요!');
    }
  };

  const statusMap = {
    pending:   { label: '대기중',   tw: 'bg-amber-50 text-amber-600' },
    paid:      { label: '결제완료', tw: 'bg-blue-50 text-blue-600' },
    making:    { label: '제조중',   tw: 'bg-purple-50 text-purple-600' },
    ready:     { label: '픽업대기', tw: 'bg-cyan-50 text-cyan-600' },
    done:      { label: '완료',     tw: 'bg-green-50 text-green-600' },
    cancelled: { label: '취소됨',   tw: 'bg-gray-100 text-gray-400' }
  };

  const stampNum     = stampCount?.stampCount || 0;
  const progress     = Math.min((stampNum / 10) * 100, 100);
  const initials     = user?.name?.charAt(0) || '?';
  const activeCoupons = coupons.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#D2D2D7]/50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/main')}
            className="flex items-center gap-1.5 text-sm font-medium text-[#6F4E37] hover:text-[#5C3D28] transition-colors"
          >
            ← 메인으로
          </button>
          <h1 className="text-base font-bold text-[#1D1D1F]">마이페이지</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* ── 프로필 카드 ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#6F4E37] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">{user?.name}님</h2>
                <p className="text-sm text-[#86868B]">{user?.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#F5F5F7] text-[#86868B] text-xs rounded-full">일반회원</span>
              </div>
            </div>
            <div className="flex gap-6">
              {[
                { num: stampNum, label: '스탬프' },
                { num: activeCoupons, label: '사용가능 쿠폰' },
                { num: orders.filter(o => o.status === 'done').length, label: '완료 주문' }
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-[#1D1D1F]">{s.num}</div>
                  <div className="text-xs text-[#86868B] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 스탬프 카드 ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1D1D1F]">스탬프 카드</h3>
            <span className="text-sm font-semibold text-[#6F4E37]">{stampNum} / 10</span>
          </div>

          {/* 스탬프 도트 */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-full flex items-center justify-center text-sm transition-all ${
                  i < stampNum
                    ? 'bg-[#6F4E37] text-white shadow-sm'
                    : 'bg-[#F5F5F7] border-2 border-[#E8E8ED]'
                }`}
              >
                {i < stampNum ? '☕' : ''}
              </div>
            ))}
          </div>

          {/* 프로그레스바 */}
          <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6F4E37] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#AEAEB2] mt-2">
            {stampNum >= 10 ? '🎉 쿠폰 발급 완료!' : `${10 - stampNum}개 더 모으면 쿠폰 증정!`}
          </p>
        </div>

        {/* ── 쿠폰 ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
          <h3 className="font-bold text-[#1D1D1F] mb-4">
            쿠폰 <span className="text-[#6F4E37]">{activeCoupons}장 사용가능</span>
          </h3>
          {coupons.length === 0 ? (
            <p className="text-sm text-[#AEAEB2] py-4 text-center">보유한 쿠폰이 없어요</p>
          ) : (
            <div className="space-y-3">
              {coupons.map(c => (
                <div
                  key={c.coupon_id}
                  className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${
                    c.status === 'active'
                      ? 'bg-[#FFF8F5] border-[#6F4E37]'
                      : 'bg-[#F5F5F7] border-[#D2D2D7] opacity-60'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1D1D1F]">무료 음료 쿠폰</p>
                    <p className="text-xs text-[#86868B] mt-0.5">{c.coupon_code}</p>
                    <p className="text-xs text-[#AEAEB2]">
                      만료: {new Date(c.expired_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    c.status === 'active' ? 'bg-[#6F4E37] text-white' :
                    c.status === 'used'   ? 'bg-gray-200 text-gray-500' :
                                            'bg-gray-200 text-gray-400'
                  }`}>
                    {c.status === 'active' ? '사용가능' : c.status === 'used' ? '사용완료' : '만료됨'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 주문 내역 ── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
          <h3 className="font-bold text-[#1D1D1F] mb-4">주문 내역</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-[#AEAEB2] py-4 text-center">주문 내역이 없어요</p>
          ) : (
            <div className="space-y-3">
              {orders.map(o => {
                const s = statusMap[o.status] || statusMap.pending;
                return (
                  <div
                    key={o.order_id}
                    className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-xl"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.tw}`}>
                          {s.label}
                        </span>
                        <span className="text-xs text-[#AEAEB2]">{o.order_number}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#1D1D1F]">
                        {o.total_price?.toLocaleString()}원
                      </p>
                      <p className="text-xs text-[#AEAEB2] mt-0.5">
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {o.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(o.order_id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        취소
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default MyPage;
