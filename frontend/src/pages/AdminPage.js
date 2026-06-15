// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BROWN = '#6F4E37';
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
  const STATUS_TW    = { pending:'bg-amber-50 text-amber-600', paid:'bg-blue-50 text-blue-600', making:'bg-purple-50 text-purple-600', ready:'bg-cyan-50 text-cyan-600', done:'bg-green-50 text-green-600', cancelled:'bg-gray-100 text-gray-400' };

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
      // MySQL SUM() 결과가 문자열로 올 수 있어서 숫자로 변환
      const data = r.data.data.map(d => ({
        ...d,
        매출: Number(d.매출) || 0,
        주문수: Number(d.주문수) || 0,
        주문수량: Number(d.주문수량) || 0,
      }));
      setStatsData(data);
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

  const inputCls = "w-full px-3 py-2.5 text-sm bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl outline-none focus:border-[#6F4E37] focus:ring-2 focus:ring-[#6F4E37]/10 transition-all";

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#D2D2D7]/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-widest text-[#1D1D1F]">BREWY</h1>
            <span className="hidden sm:block text-xs font-medium text-[#86868B] bg-[#F5F5F7] px-2.5 py-1 rounded-full">
              관리자 대시보드
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#6F4E37] rounded-full flex items-center justify-center text-white text-sm font-bold">
                {adminName.charAt(0)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#1D1D1F]">{adminName}</span>
            </div>
            <button onClick={() => navigate('/main')} className="px-3 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-colors">
              ← 메인
            </button>
            <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 rounded-full transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* ── 요약 카드 ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: '🍵', label: '전체 메뉴', value: `${products.length}개`, color: 'text-[#6F4E37]' },
            { icon: '📋', label: '전체 주문', value: `${orders.length}건`, color: 'text-blue-500' },
            { icon: '✅', label: '완료 주문', value: `${orders.filter(o=>o.status==='done').length}건`, color: 'text-green-500' },
            { icon: '💰', label: '총 매출', value: `${totalRevenue.toLocaleString()}원`, color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0F0F0] flex items-center gap-4">
              <div className="w-11 h-11 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-xl">{s.icon}</div>
              <div>
                <p className="text-xs text-[#86868B]">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 탭 ── */}
        <div className="flex gap-2 mb-6">
          {[{ key:'menu', label:'메뉴 관리' }, { key:'orders', label:'주문 관리' }, { key:'stats', label:'매출 통계' }].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'bg-white text-[#86868B] border border-[#D2D2D7] hover:text-[#1D1D1F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ 메뉴 관리 ══ */}
        {tab === 'menu' && (
          <div className="space-y-5">
            {/* 신규 등록 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
              <h3 className="font-bold text-[#1D1D1F] mb-4">신규 메뉴 등록</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                  className="px-4 py-2.5 bg-[#6F4E37] hover:bg-[#5C3D28] text-white text-sm font-semibold rounded-xl transition-colors">
                  등록하기
                </button>
              </div>
            </div>

            {/* 메뉴 목록 */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
                <h3 className="font-bold text-[#1D1D1F]">메뉴 목록</h3>
                <span className="text-sm text-[#86868B]">{products.length}개</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F5F5F7]">
                    <tr>
                      {['이미지','카테고리','메뉴명','가격','상태','관리'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-[#86868B] text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.product_id} className={`border-t border-[#F0F0F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1.5">
                            {p.image_url ? (
                              <img src={p.image_url.startsWith('/uploads') ? `${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'}${p.image_url}` : p.image_url}
                                alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                            ) : (
                              <div className="w-12 h-12 bg-[#F5F5F7] rounded-xl flex items-center justify-center text-xl">☕</div>
                            )}
                            <label className="text-xs cursor-pointer text-[#6F4E37] hover:underline">
                              {uploadingId === p.product_id ? '⏳' : '📷 변경'}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={e => handleImageUpload(p.product_id, e.target.files[0])} />
                            </label>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-[#F5F5F7] text-[#86868B] text-xs rounded-lg">{p.category_name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1D1D1F]">
                          {editId === p.product_id
                            ? <input className={inputCls + ' w-32'} defaultValue={p.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                            : p.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#1D1D1F]">
                          {editId === p.product_id
                            ? <input className={inputCls + ' w-24'} type="number" defaultValue={p.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} />
                            : `${p.price?.toLocaleString()}원`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.is_sold_out ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                            {p.is_sold_out ? '품절' : '판매중'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {editId === p.product_id ? (
                              <>
                                <button onClick={() => handleUpdateProduct(p.product_id)} className="px-3 py-1.5 bg-[#6F4E37] text-white text-xs rounded-lg hover:bg-[#5C3D28] transition-colors">저장</button>
                                <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-[#F5F5F7] text-[#86868B] text-xs rounded-lg transition-colors">취소</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditId(p.product_id); setEditProduct(p); }} className="px-3 py-1.5 bg-[#F5F5F7] text-[#1D1D1F] text-xs rounded-lg hover:bg-[#E8E8ED] transition-colors">수정</button>
                                <button onClick={() => handleDeleteProduct(p.product_id, p.name)} className="px-3 py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100 transition-colors">삭제</button>
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
        )}

        {/* ══ 주문 관리 ══ */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#F0F0F0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <h3 className="font-bold text-[#1D1D1F]">전체 주문 목록</h3>
              <span className="text-sm text-[#86868B]">{orders.length}건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F5F7]">
                  <tr>
                    {['주문번호','금액','픽업시간','상태 변경'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-[#86868B] text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.order_id} className={`border-t border-[#F0F0F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                      <td className="px-4 py-3 text-xs text-[#86868B] font-mono">{o.order_number}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1D1D1F]">{o.total_price?.toLocaleString()}원</td>
                      <td className="px-4 py-3 text-xs text-[#86868B]">{new Date(o.pickup_time).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={e => handleStatusChange(o.order_id, e.target.value)}
                          className="px-2.5 py-1.5 text-xs border border-[#D2D2D7] rounded-lg bg-white outline-none focus:border-[#6F4E37] transition-colors"
                        >
                          {ORDER_STATUS.map(s => (
                            <option key={s} value={s}>{STATUS_KR[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ 매출 통계 ══ */}
        {tab === 'stats' && (
          <div className="space-y-5">
            {/* 서브탭 */}
            <div className="flex gap-2">
              {[{ key:'daily',label:'일별' },{ key:'monthly',label:'월별' },{ key:'branch',label:'지점별' },{ key:'menu',label:'메뉴별' }].map(t => (
                <button key={t.key} onClick={() => setStatsTab(t.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statsTab === t.key ? 'bg-[#6F4E37] text-white' : 'bg-white text-[#86868B] border border-[#D2D2D7] hover:text-[#1D1D1F]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F0F0]">
              {statsData.length === 0 ? (
                <p className="text-sm text-[#AEAEB2] py-8 text-center">데이터가 없어요</p>
              ) : (
                <>
                  {statsTab === 'daily' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="날짜" tick={{ fontSize: 11, fill: '#86868B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#86868B' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F0F0F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey="매출" fill={BROWN} radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {statsTab === 'monthly' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis dataKey="월" tick={{ fontSize: 11, fill: '#86868B' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#86868B' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F0F0F0' }} />
                        <Line type="monotone" dataKey="매출" stroke={BROWN} strokeWidth={2.5} dot={{ fill: BROWN, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {statsTab === 'branch' && (
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={statsData} dataKey="매출" nameKey="지점명" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {statsData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 min-w-[200px]">
                        {statsData.map((d, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-sm text-[#1D1D1F]">{d.지점명}</span>
                            <span className="text-sm font-semibold text-[#6F4E37] ml-auto">{d.매출?.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {statsTab === 'menu' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#86868B' }} />
                        <YAxis dataKey="메뉴명" type="category" width={90} tick={{ fontSize: 11, fill: '#86868B' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #F0F0F0' }} />
                        <Bar dataKey="주문수량" fill={BROWN} radius={[0,6,6,0]} />
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
