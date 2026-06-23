const fs = require('fs');

let revenueTab = fs.readFileSync('src/pages/shop/RevenueTab.jsx', 'utf8');

// 1. Calculate stats at the top of RevenueTab
const componentStart = '  const {';
const newStats = `
  const pendingRevenue = (orders || []).filter(o => ['Pending', 'Approved'].includes(o.status)).reduce((sum, o) => sum + (o.pricing?.lenderRevenue || o.totalAmount || 0), 0);
  const withdrawnAmount = (transactions || []).filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingWithdrawalAmount = (transactions || []).filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((sum, t) => sum + Math.abs(t.amount), 0);
`;
revenueTab = revenueTab.replace(componentStart, newStats + '\n' + componentStart);

// 2. Add "Minh bạch dòng tiền" card after the summary cards
const targetHTML = `<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>`;
const newHTML = `
            {/* Minh bạch dòng tiền */}
            <article className="card" style={{ marginTop: '5px' }}>
              <div className="section-heading compact-heading">
                <p className="eyebrow">Minh bạch tài chính</p>
                <h2>Chi tiết dòng tiền Cửa hàng</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền cọc đang giữ</p>
                  <h3 style={{ margin: 0, color: 'var(--primary-strong)' }}>{money(wallet?.frozenBalance || 0)} đ</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '5px' }}>Thuộc các đơn đang thuê chưa trả đồ</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fffbeb' }}>
                  <p style={{ color: '#b45309', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Doanh thu chờ xử lý</p>
                  <h3 style={{ margin: 0, color: '#b45309' }}>{money(pendingRevenue)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Từ các đơn Pending / Approved</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#eff6ff' }}>
                  <p style={{ color: '#1d4ed8', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền đang chờ rút</p>
                  <h3 style={{ margin: 0, color: '#1d4ed8' }}>{money(pendingWithdrawalAmount)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Yêu cầu rút tiền chưa duyệt</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#f0fdf4' }}>
                  <p style={{ color: '#15803d', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền đã rút thành công</p>
                  <h3 style={{ margin: 0, color: '#15803d' }}>{money(withdrawnAmount)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Lũy kế từ trước đến nay</p>
                </div>
              </div>
            </article>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>`;
revenueTab = revenueTab.replace(targetHTML, newHTML);

// 3. Update tx.description to include order ID if available (Wait, in frontend we only have description string, but maybe we can just make sure the backend sets tx.description properly? Let's check how tx object looks like. Usually `tx.order` is an ID or populated object. If it's an object with `_id`, we can show it).
const txDescriptionHTML = `                          {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.description}`;
const newTxDescriptionHTML = `                          {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.description}
                          {tx.order && <span style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>Đơn hàng: #{typeof tx.order === 'object' ? tx.order._id?.slice(-8).toUpperCase() : tx.order?.slice(-8).toUpperCase()}</span>}`;
revenueTab = revenueTab.replace(txDescriptionHTML, newTxDescriptionHTML);

fs.writeFileSync('src/pages/shop/RevenueTab.jsx', revenueTab);
console.log('RevenueTab patched');
