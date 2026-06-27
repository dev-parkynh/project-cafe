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
      const [userRes, stampRes, couponsRes, ordersRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/stamps/count'),
        api.get('/api/coupons'),
        api.get('/api/orders'),
      ]);
      setUser(userRes.data.user);
      setStampCount(stampRes.data.data);
      setCoupons(couponsRes.data.coupons);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setUser({ name: '김브루이', email: 'sample@brewy.com' });
        setStampCount({ stampCount: 7 });
        setCoupons([{
          coupon_id: 1,
          coupon_code: 'AMRC-2026-FREE1',
          status: 'active',
          expired_at: '2026-12-31T00:00:00Z',
        }]);
        setOrders([
          { order_id: 1, order_number: 'ORD-240628-001', status: 'done',  total_price: 9500,  created_at: '2026-06-27T10:30:00Z' },
          { order_id: 2, order_number: 'ORD-240628-002', status: 'ready', total_price: 5000,  created_at: '2026-06-28T09:15:00Z' },
          { order_id: 3, order_number: 'ORD-240628-003', status: 'paid',  total_price: 11000, created_at: '2026-06-28T11:00:00Z' },
        ]);
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('주문을 취소할까요?')) return;
    try {
      await api.patch(`/api/orders/${orderId}/cancel`);
      fetchData();
    } catch { alert('취소 실패했어요!'); }
  };

  const statusMap = {
    pending:   { label: '대기중',   color: 'bg-amber-50 text-amber-600' },
    paid:      { label: '결제완료', color: 'bg-blue-50 text-blue-600' },
    making:    { label: '제조중',   color: 'bg-purple-50 text-purple-600' },
    ready:     { label: '픽업대기', color: 'bg-cyan-50 text-cyan-600' },
    done:      { label: '완료',     color: 'bg-green-50 text-green-600' },
    cancelled: { label: '취소됨',   color: 'bg-[#F5F5F7] text-[#AEAEB2]' },
  };

  const stampNum      = stampCount?.stampCount || 0;
  const progress      = Math.min((stampNum / 10) * 100, 100);
  const initials      = user?.name?.charAt(0) || '?';
  const activeCoupons = coupons.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── 네비게이션 — 44px 극미니멀 ── */}
      <header className="sticky top-0 z-50 h-11 bg-[rgba(255,255,255,0.72)] border-b border-[#D2D2D7]/30"
        style={{ WebkitBackdropFilter: 'saturate(180%) blur(20px)', backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        <div className="max-w-[680px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => navigate('/main')}
            className="flex items-center gap-1 text-[13px] text-[#0071E3] hover:opacity-70 transition-opacity">
            ‹ 메인
          </button>
          <span className="text-[13px] font-semibold text-[#1D1D1F]">마이페이지</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-[680px] mx-auto px-6 py-16 space-y-6">

        {/* ── 프로필 ── */}
        <section className="bg-[#F5F5F7] rounded-[24px] p-8">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-[#6F4E37] rounded-full flex items-center justify-center text-white text-[26px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-[#1D1D1F] tracking-tight">{user?.name}</h2>
              <p className="text-[14px] text-[#6E6E73] mt-0.5">{user?.email}</p>
            </div>
          </div>
          {/* 스탯 row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { num: stampNum,      label: '스탬프' },
              { num: activeCoupons, label: '사용가능 쿠폰' },
              { num: orders.filter(o => o.status === 'done').length, label: '완료 주문' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-[16px] p-5 text-center">
                <div className="text-[32px] font-bold text-[#1D1D1F] leading-none">{s.num}</div>
                <div className="text-[12px] text-[#6E6E73] mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 스탬프 카드 ── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[20px] font-semibold text-[#1D1D1F]">스탬프 카드</h3>
            <span className="text-[14px] text-[#6F4E37] font-semibold">{stampNum} / 10</span>
          </div>
          <div className="bg-[#F5F5F7] rounded-[24px] p-8">
            <div className="grid grid-cols-5 gap-3 mb-7">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={`aspect-square rounded-full flex items-center justify-center text-[18px] transition-all duration-300 ${
                  i < stampNum
                    ? 'bg-[#6F4E37] shadow-[0_4px_12px_rgba(111,78,55,0.35)]'
                    : 'bg-white border-2 border-[#E8E8ED]'
                }`}>
                  {i < stampNum ? '☕' : ''}
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
              <div className="h-full bg-[#6F4E37] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[13px] text-[#AEAEB2] mt-3">
              {stampNum >= 10 ? '쿠폰이 발급됐어요!' : `${10 - stampNum}개 더 모으면 무료 음료 쿠폰`}
            </p>
          </div>
        </section>

        {/* ── 쿠폰 ── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[20px] font-semibold text-[#1D1D1F]">쿠폰</h3>
            {activeCoupons > 0 && (
              <span className="text-[14px] text-[#6F4E37] font-semibold">{activeCoupons}장 사용가능</span>
            )}
          </div>
          {coupons.length === 0 ? (
            <div className="bg-[#F5F5F7] rounded-[24px] p-10 text-center">
              <p className="text-[14px] text-[#AEAEB2]">보유한 쿠폰이 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map(c => (
                <div key={c.coupon_id}
                  className={`flex items-center justify-between p-6 rounded-[20px] transition-all ${
                    c.status === 'active' ? 'bg-[#FFF8F5]' : 'bg-[#F5F5F7] opacity-50'
                  }`}>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1D1D1F] mb-1">무료 음료 쿠폰</p>
                    <p className="text-[12px] text-[#AEAEB2] font-mono">{c.coupon_code}</p>
                    <p className="text-[12px] text-[#AEAEB2] mt-0.5">
                      만료 {new Date(c.expired_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold ${
                    c.status === 'active' ? 'bg-[#6F4E37] text-white' : 'bg-[#E8E8ED] text-[#AEAEB2]'
                  }`}>
                    {c.status === 'active' ? '사용가능' : c.status === 'used' ? '사용완료' : '만료됨'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 주문 내역 ── */}
        <section>
          <h3 className="text-[20px] font-semibold text-[#1D1D1F] mb-4 px-1">주문 내역</h3>
          {orders.length === 0 ? (
            <div className="bg-[#F5F5F7] rounded-[24px] p-10 text-center">
              <p className="text-[14px] text-[#AEAEB2]">주문 내역이 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => {
                const s = statusMap[o.status] || statusMap.pending;
                return (
                  <div key={o.order_id}
                    className="flex items-center justify-between p-6 bg-[#F5F5F7] rounded-[20px]">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${s.color}`}>
                          {s.label}
                        </span>
                        <span className="text-[12px] text-[#AEAEB2] font-mono">{o.order_number}</span>
                      </div>
                      <p className="text-[17px] font-bold text-[#1D1D1F]">
                        {o.total_price?.toLocaleString()}원
                      </p>
                      <p className="text-[12px] text-[#AEAEB2] mt-1">
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {o.status === 'pending' && (
                      <button onClick={() => handleCancelOrder(o.order_id)}
                        className="px-4 py-2 text-[13px] text-[#FF3B30] hover:bg-red-50 rounded-xl transition-colors">
                        취소
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default MyPage;
