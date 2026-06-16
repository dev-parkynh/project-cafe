// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const BROWN      = '#6F4E37';
const PIE_COLORS = ['#6F4E37','#C49A6C','#E8C9A0','#A0522D','#D2691E'];

function AdminPage() {
  const navigate  = useNavigate();
  const adminName = localStorage.getItem('name') || '관리자';
  const [tab, setTab] = useState('menu');

  const [products,    setProducts]    = useState([]);
  const [editId,      setEditId]      = useState(null);
  const [newProduct,  setNewProduct]  = useState({ category_id: 1, name: '', description: '', price: '' });
  const [editProduct, setEditProduct] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [statsTab,    setStatsTab]    = useState('daily');
  const [statsData,   setStatsData]   = useState([]);

  const ORDER_STATUS = ['pending','paid','making','ready','done','cancelled'];
  const STATUS_KR    = { pending:'대기중', paid:'결제완료', making:'제조중', ready:'준비완료', done:'완료', cancelled:'취소' };

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'admin') { alert('관리자만 접근 가능해요!'); navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    if (tab === 'menu')   loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'stats')  loadStats(statsTab);
  }, [tab]);

  useEffect(() => {
    if (tab === 'stats') loadStats(statsTab);
  }, [statsTab]);

  const loadProducts = async () => {
    try { const r = await api.get('/api/admin/products'); setProducts(r.data.data); } catch {}
  };
  const loadOrders = async () => {
    try { const r = await api.get('/api/admin/orders'); setOrders(r.data.data); } catch {}
  };
  const loadStats = async (type) => {
    try {
      const r = await api.get(`/api/admin/stats/${type}`);
      setStatsData(r.data.data.map(d => ({ ...d, 매출: Number(d.매출)||0, 주문수: Number(d.주문수)||0, 주문수량: Number(d.주문수량)||0 })));
    } catch {}
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) { alert('이름과 가격은 필수예요!'); return; }
    try {
      await api.post('/api/admin/products', { ...newProduct, price: Number(newProduct.price) });
      setNewProduct({ category_id: 1, name: '', description: '', price: '' });
      loadProducts();
    } catch { alert('메뉴 등록 실패!'); }
  };

  const handleUpdateProduct = async (id) => {
    try {
      await api.put(`/api/admin/products/${id}`, { ...editProduct, price: editProduct.price ? Number(editProduct.price) : undefined });
      setEditId(null); loadProducts();
    } catch { alert('수정 실패!'); }
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    setUploadingId(productId);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await api.post(`/api/admin/products/${productId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadProducts();
    } catch { alert('이미지 업로드 실패!'); }
    finally { setUploadingId(null); }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`'${name}' 메뉴를 비활성화할까요?`)) return;
    try { await api.delete(`/api/admin/products/${id}`); loadProducts(); } catch {}
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status } : o));
    } catch {}
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_price, 0);

  const inputCls = "w-full px-4 py-3 text-[14px] bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl outline-none focus:border-[#6F4E37] focus:bg-white transition-all";
  const tooltipStyle = { borderRadius: '16px', border: '1px solid #E8E8ED', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: '13px' };
  const thCls = "px-4 py-3 text-[11px] font-semibold text-[#AEAEB2] text-left uppercase tracking-wide whitespace-nowrap";
  const tdCls = "px-4 py-3 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── 네비게이션 ── */}
      <header className="sticky top-0 z-50 h-11 bg-[rgba(255,255,255,0.72)] border-b border-[#D2D2D7]/30"
        style={{ WebkitBackdropFilter: 'saturate(180%) blur(20px)', backdropFilter: 'saturate(180%) blur(20px)' }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-[13px] font-black tracking-[4px] md:tracking-[6px] text-[#1D1D1F]">BREWY</span>
            <span className="hidden md:inline text-[12px] text-[#AEAEB2]">관리자 대시보드</span>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <span className="hidden sm:inline text-[13px] text-[#6E6E73]">{adminName}</span>
            <button onClick={() => navigate('/main')} className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors">메인</button>
            <button onClick={handleLogout} className="text-[13px] text-[#FF3B30] hover:opacity-70 transition-opacity">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-16">

        {/* ── 요약 통계 ── */}
        <div className="mb-10 md:mb-16">
          <h2 className="text-[26px] md:text-[34px] font-bold text-[#1D1D1F] tracking-tight mb-6 md:mb-10">개요</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[
              { label: '전체 메뉴',  value: products.length,                                     unit: '개', color: '#6F4E37' },
              { label: '전체 주문',  value: orders.length,                                        unit: '건', color: '#0071E3' },
              { label: '완료 주문',  value: orders.filter(o => o.status === 'done').length,       unit: '건', color: '#34C759' },
              { label: '누적 매출',  value: totalRevenue.toLocaleString(),                        unit: '원', color: '#FF9F0A' },
            ].map((s, i) => (
              <div key={i} className="bg-[#F5F5F7] rounded-[20px] p-4 md:p-7">
                <p className="text-[12px] md:text-[13px] text-[#6E6E73] mb-2">{s.label}</p>
                <p className="text-[24px] md:text-[36px] font-bold leading-none tracking-tight" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[12px] md:text-[14px] text-[#AEAEB2] mt-1">{s.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="overflow-x-auto mb-8">
          <div className="flex gap-1 border-b border-[#E8E8ED] min-w-max">
            {[{ key:'menu', label:'메뉴 관리' }, { key:'orders', label:'주문 관리' }, { key:'stats', label:'매출 통계' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 md:px-5 py-2.5 text-[14px] font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.key
                    ? 'border-[#1D1D1F] text-[#1D1D1F]'
                    : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ 메뉴 관리 ══ */}
        {tab === 'menu' && (
          <div className="space-y-8">

            {/* 신규 등록 */}
            <div>
              <h3 className="text-[18px] md:text-[22px] font-semibold text-[#1D1D1F] mb-4">신규 메뉴 등록</h3>
              <div className="bg-[#F5F5F7] rounded-[20px] p-4 md:p-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <select className={inputCls} value={newProduct.category_id}
                    onChange={e => setNewProduct({ ...newProduct, category_id: Number(e.target.value) })}>
                    <option value={1}>커피</option>
                    <option value={2}>논커피</option>
                    <option value={3}>디저트</option>
                  </select>
                  <input className={inputCls} placeholder="메뉴 이름 *" value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                  <input className={inputCls} placeholder="가격 *" type="number" value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                  <input className={inputCls} placeholder="설명 (선택)" value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                  <button onClick={handleCreateProduct}
                    className="px-4 py-3 bg-[#1D1D1F] hover:bg-[#3D3D3F] text-white text-[14px] font-medium rounded-xl transition-colors">
                    등록
                  </button>
                </div>
              </div>
            </div>

            {/* 메뉴 목록 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] md:text-[22px] font-semibold text-[#1D1D1F]">메뉴 목록</h3>
                <span className="text-[14px] text-[#AEAEB2]">{products.length}개</span>
              </div>
              <div className="bg-white border border-[#E8E8ED] rounded-[20px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px]">
                    <thead>
                      <tr className="bg-[#F5F5F7]">
                        {['이미지','카테고리','메뉴명','가격','상태',''].map(h => (
                          <th key={h} className={thCls}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p.product_id} className={`border-t border-[#F5F5F7] ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}`}>
                          <td className={tdCls}>
                            <div className="flex flex-col items-center gap-1">
                              {p.image_url ? (
                                <img src={p.image_url.startsWith('/uploads') ? `${process.env.NODE_ENV==='production'?'':'http://localhost:8080'}${p.image_url}` : p.image_url}
                                  alt={p.name} className="w-10 h-10 object-cover rounded-xl" />
                              ) : (
                                <div className="w-10 h-10 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-lg">☕</div>
                              )}
                              <label className="text-[11px] cursor-pointer text-[#6F4E37]">
                                {uploadingId === p.product_id ? '...' : '변경'}
                                <input type="file" accept="image/*" className="hidden"
                                  onChange={e => handleImageUpload(p.product_id, e.target.files[0])} />
                              </label>
                            </div>
                          </td>
                          <td className={tdCls}>
                            <span className="px-2 py-1 bg-[#F5F5F7] text-[#6E6E73] text-[12px] rounded-full">{p.category_name}</span>
                          </td>
                          <td className={`${tdCls} text-[14px] font-medium text-[#1D1D1F]`}>
                            {editId === p.product_id
                              ? <input className={inputCls + ' w-28'} defaultValue={p.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                              : p.name}
                          </td>
                          <td className={`${tdCls} text-[14px] text-[#1D1D1F]`}>
                            {editId === p.product_id
                              ? <input className={inputCls + ' w-20'} type="number" defaultValue={p.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} />
                              : `${p.price?.toLocaleString()}원`}
                          </td>
                          <td className={tdCls}>
                            <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${p.is_sold_out ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                              {p.is_sold_out ? '품절' : '판매중'}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <div className="flex gap-1.5">
                              {editId === p.product_id ? (
                                <>
                                  <button onClick={() => handleUpdateProduct(p.product_id)} className="px-3 py-1.5 bg-[#1D1D1F] text-white text-[12px] rounded-lg whitespace-nowrap">저장</button>
                                  <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-[#F5F5F7] text-[#6E6E73] text-[12px] rounded-lg">취소</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditId(p.product_id); setEditProduct(p); }} className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-[12px] rounded-lg transition-colors">수정</button>
                                  <button onClick={() => handleDeleteProduct(p.product_id, p.name)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-[12px] rounded-lg transition-colors">삭제</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ 주문 관리 ══ */}
        {tab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] md:text-[22px] font-semibold text-[#1D1D1F]">주문 목록</h3>
              <span className="text-[14px] text-[#AEAEB2]">{orders.length}건</span>
            </div>
            <div className="bg-white border border-[#E8E8ED] rounded-[20px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="bg-[#F5F5F7]">
                      {['주문번호','금액','픽업시간','상태'].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={o.order_id} className={`border-t border-[#F5F5F7] ${i%2===0?'':'bg-[#FAFAFA]'}`}>
                        <td className={`${tdCls} text-[12px] text-[#AEAEB2] font-mono`}>{o.order_number}</td>
                        <td className={`${tdCls} text-[14px] font-semibold text-[#1D1D1F]`}>{o.total_price?.toLocaleString()}원</td>
                        <td className={`${tdCls} text-[12px] text-[#6E6E73]`}>{new Date(o.pickup_time).toLocaleString()}</td>
                        <td className={tdCls}>
                          <select value={o.status} onChange={e => handleStatusChange(o.order_id, e.target.value)}
                            className="px-2 py-1.5 text-[13px] border border-[#E8E8ED] rounded-xl bg-white outline-none focus:border-[#6F4E37] transition-colors">
                            {ORDER_STATUS.map(s => <option key={s} value={s}>{STATUS_KR[s]}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ 매출 통계 ══ */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[{ key:'daily',label:'일별' },{ key:'monthly',label:'월별' },{ key:'branch',label:'지점별' },{ key:'menu',label:'메뉴별' }].map(t => (
                <button key={t.key} onClick={() => setStatsTab(t.key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
                    statsTab===t.key ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-[#F5F5F7] rounded-[20px] p-4 md:p-8">
              {statsData.length === 0 ? (
                <p className="text-[14px] text-[#AEAEB2] py-16 text-center">데이터가 없어요</p>
              ) : (
                <>
                  {statsTab === 'daily' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" vertical={false} />
                        <XAxis dataKey="날짜" tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} width={50} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="매출" fill={BROWN} radius={[6,6,0,0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {statsTab === 'monthly' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" vertical={false} />
                        <XAxis dataKey="월" tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} width={50} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="매출" stroke={BROWN} strokeWidth={2.5} dot={{ fill:BROWN, r:4, strokeWidth:0 }} activeDot={{ r:6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {statsTab === 'branch' && (
                    <div className="flex flex-col items-center gap-6">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={statsData} dataKey="매출" nameKey="지점명" cx="50%" cy="50%" outerRadius={90} innerRadius={36}
                            label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                            labelLine={false}>
                            {statsData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full space-y-2">
                        {statsData.map((d, i) => (
                          <div key={i} className="flex items-center gap-3 py-1">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-[14px] text-[#1D1D1F] flex-1 min-w-0 truncate">{d.지점명}</span>
                            <span className="text-[14px] font-semibold text-[#6F4E37] whitespace-nowrap">{d.매출?.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {statsTab === 'menu' && (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={statsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="메뉴명" type="category" width={80} tick={{ fontSize:10, fill:'#AEAEB2' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill:'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="주문수량" fill={BROWN} radius={[0,6,6,0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPage;
