import { useState, useEffect } from 'react';
import { BarChart, Search, Eye, Users, MousePointerClick, ShieldAlert, Activity, Filter, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const ComplaintsLogsTab = ({ disputes, logs, logStats, setResolvingDispute, setResolutionForm, fetchLogStats }) => {
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    if (fetchLogStats) {
      fetchLogStats(period);
    }
  }, [period]);

  const activeUsers = logStats?.activeUsers || 0;
  
  // Flatten actionCounts
  const actionsMap = {};
  logStats?.actionCounts?.forEach(s => actionsMap[s._id] = s.count);

  const roleMap = {};
  logStats?.roleBreakdown?.forEach(r => roleMap[r._id] = r.count);

  const funnelMap = {};
  logStats?.funnelStats?.forEach(f => funnelMap[f._id] = f.count);

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* TRANG CHẤP THUÊ ĐỒ */}
      <article className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Tranh chấp</p>
          <h2>Khiếu nại đơn thuê (Disputes)</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', padding: '10px' }}>
          {disputes.map((d) => (
            <div key={d._id} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <strong>Lý do: {d.reason}</strong>
                <span className={`status-pill ${d.status === 'Resolved' ? 'active' : 'inactive'}`} style={{ fontSize: '0.7rem' }}>{d.status}</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '6px 0' }}>{d.description}</p>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                Người tạo: <strong>{d.raisedBy?.fullName}</strong> • Bị khiếu nại: <strong>{d.against?.fullName}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '4px' }}>Yêu cầu đền bù: {money(d.requestedAmount)} đ</div>
              {d.resolution ? (
                <div style={{ marginTop: '10px', background: '#ecfdf5', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #bbf7d0', color: '#166534' }}>
                  <strong>Quyết định:</strong> {d.resolution.adminDecision}<br />
                  Đền bù cho Shop: {money(d.resolution.amountAwardedToLender)} đ<br />
                  Hoàn lại cho Khách: {money(d.resolution.amountRefundedToRenter)} đ
                </div>
              ) : (
                <button onClick={() => { setResolvingDispute(d); setResolutionForm({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 }); }} className="button" style={{ minHeight: '34px', fontSize: '0.78rem', marginTop: '10px' }}>
                  Phân xử tranh chấp
                </button>
              )}
            </div>
          ))}
          {disputes.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Chưa nhận được khiếu nại tranh chấp nào.</div>}
        </div>
      </article>

      {/* THỐNG KÊ HOẠT ĐỘNG */}
      <article className="card admin-table-card">
        <div className="section-heading compact-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eyebrow">Analytics</p>
            <h2>Thống kê & Giám sát hoạt động</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} style={{ color: 'var(--muted)' }}/>
            <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="month">Tháng này</option>
            </select>
          </div>
        </div>
        
        {logStats && (
          <div style={{ padding: '20px' }}>
            {/* OVERVIEW METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <div style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '800' }}>
                  <Activity size={16} /> Active Users (30 phút)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e3a8a', marginTop: '5px' }}>{activeUsers}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: '800' }}>Tổng Page Views</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', marginTop: '5px' }}>{actionsMap['PAGE_VIEW'] || 0}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: '800' }}>Lượt Tìm Kiếm</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', marginTop: '5px' }}>{actionsMap['SEARCH'] || 0}</div>
              </div>
              <div style={{ background: '#f0fdfa', padding: '15px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ color: '#047857', fontSize: '0.85rem', fontWeight: '800' }}>Tổng Đơn Tạo</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#064e3b', marginTop: '5px' }}>{actionsMap['PLACE_ORDER'] || 0}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* FUNNEL */}
              <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 15px' }}>Phễu chuyển đổi (Funnel)</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700' }}>XEM SẢN PHẨM</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{funnelMap['VIEW_PRODUCT'] || 0}</div>
                  </div>
                  <ArrowRight size={20} style={{ color: '#cbd5e1' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700' }}>THÊM GIỎ HÀNG</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary)' }}>{funnelMap['ADD_TO_CART'] || 0}</div>
                  </div>
                  <ArrowRight size={20} style={{ color: '#cbd5e1' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700' }}>ĐẶT ĐƠN</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent)' }}>{funnelMap['PLACE_ORDER'] || 0}</div>
                  </div>
                </div>
              </div>

              {/* ROLE BREAKDOWN */}
              <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 15px' }}>Traffic theo phân quyền</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Khách Hàng</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>{roleMap['customer'] || 0}</div>
                  </div>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Chủ Shop</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>{roleMap['lender'] || 0}</div>
                  </div>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Khách vãng lai</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>{roleMap['guest'] || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CHART */}
            <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 15px' }}>Biểu đồ Tương tác (Page Views)</h3>
              <div style={{ height: '300px', width: '100%' }}>
                {logStats.dailyTrend && logStats.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={logStats.dailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Không đủ dữ liệu để vẽ biểu đồ.</div>
                )}
              </div>
            </div>

            {/* TOP LISTS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '12px', color: 'var(--primary-strong)' }}>
                  <Search size={16} /> Top Từ Khoá Tìm Kiếm
                </strong>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                  {logStats.topSearches?.map((s, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', marginBottom: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontWeight: '600' }}>{s._id}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '800' }}>{s.count} lượt</span>
                    </li>
                  ))}
                  {(!logStats.topSearches || logStats.topSearches.length === 0) && <li className="empty-state" style={{ padding: '20px 0' }}>Chưa có lượt tìm kiếm nào.</li>}
                </ul>
              </div>
              <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', marginBottom: '12px', color: 'var(--primary-strong)' }}>
                  <Eye size={16} /> Top Sản Phẩm Được Xem
                </strong>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                  {logStats.topProducts?.map((p, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: '8px', marginBottom: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', fontWeight: '600' }}>{p._id}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '800' }}>{p.count} lượt</span>
                    </li>
                  ))}
                  {(!logStats.topProducts || logStats.topProducts.length === 0) && <li className="empty-state" style={{ padding: '20px 0' }}>Chưa có lượt xem sản phẩm nào.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </article>
      
      {/* RAW LOGS TABLE */}
      <article className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Raw Data</p>
          <h2>Nhật ký hệ thống (System Logs)</h2>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 20px 20px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {logs.map((log) => (
              <div key={log._id} style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', borderLeft: '3px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                  <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ textTransform: 'uppercase', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>{log.action}</span>
                  </span>
                  <span style={{ color: 'var(--muted)', fontWeight: '400' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <p style={{ margin: '6px 0 4px', color: 'var(--primary-strong)' }}>{log.description}</p>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div style={{ marginTop: '6px', padding: '6px', background: 'var(--surface)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--muted)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                  User: <strong>{log.user ? `${log.user.fullName} (${log.user.email})` : 'Khách vãng lai'}</strong> 
                  <span style={{ marginLeft: '10px' }}>Role: <strong>{log.role || 'guest'}</strong></span>
                </small>
              </div>
            ))}
            {logs.length === 0 && <div className="empty-state">Chưa có nhật ký hoạt động nào.</div>}
          </div>
        </div>
      </article>

    </div>
  );
};
export default ComplaintsLogsTab;