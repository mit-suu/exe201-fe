const fs = require('fs');
const path = require('path');

const dir = 'd:/mit-suu-exe201-be1/exe201-fe/src/pages/admin/components';

const files = {
  'UsersTab.jsx': `
const UsersTab = ({ customers, handleToggleUserStatus }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Thành viên</p>
        <h2>Quản lý tài khoản khách hàng ({customers.length})</h2>
      </div>
      <div className="user-list full-user-list">
        {customers.map((c) => (
          <div className="user-list-item" style={{ padding: '16px' }} key={c._id}>
            <div className="user-avatar" style={{ background: 'var(--primary-strong)' }}>
              {c.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>{c.fullName}</strong>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.email} • ĐT: {c.phone || 'Chưa cập nhật'}</p>
            </div>
            <span className={\`status-pill \${c.isActive !== false ? 'active' : 'inactive'}\`}>
              {c.isActive !== false ? 'Active' : 'Blocked'}
            </span>
            <button onClick={() => handleToggleUserStatus(c._id, c.isActive !== false)} className={\`button \${c.isActive !== false ? 'danger' : ''}\`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
              {c.isActive !== false ? 'Block tài khoản' : 'Mở khóa tài khoản'}
            </button>
          </div>
        ))}
        {customers.length === 0 && <div className="empty-state">Không tìm thấy khách hàng nào.</div>}
      </div>
    </section>
  );
};
export default UsersTab;
`,
  'ShopsTab.jsx': `
import { Store } from 'lucide-react';

const ShopsTab = ({ shops, handleApproveLender, handleToggleUserStatus, setSelectedShop }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Đối tác</p>
        <h2>Phê duyệt và Quản lý cửa hàng ({shops.length})</h2>
      </div>
      <div className="user-list full-user-list">
        {shops.map((s) => {
          const isVerified = s.lenderProfile?.isVerified === true;
          return (
            <div className="user-list-item" style={{ padding: '16px' }} key={s._id}>
              {s.lenderProfile?.logoUrl
                ? <img src={s.lenderProfile.logoUrl} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} />
                : (
                  <div className="user-avatar" style={{ background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}>
                    <Store size={22} style={{ color: '#9ca3af' }} />
                  </div>
                )
              }
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{s.fullName}</strong>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{s.email} • ĐT: {s.phone || s.lenderProfile?.phone || 'Chưa cập nhật'}</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>Địa chỉ: {s.lenderProfile?.address || 'Chưa cấu hình'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className={\`status-pill \${s.isActive !== false ? 'active' : 'inactive'}\`} style={{ alignSelf: 'center', fontSize: '0.7rem' }}>
                  {s.isActive !== false ? 'Active' : 'Blocked'}
                </span>
                <span className={\`status-pill \${isVerified ? 'active' : 'inactive'}\`} style={{ alignSelf: 'center', fontSize: '0.7rem', background: isVerified ? '#dcfce7' : '#fee2e2', color: isVerified ? '#166534' : '#991b1b' }}>
                  {isVerified ? 'Verified' : 'Pending Approval'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setSelectedShop(s)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Xem hồ sơ</button>
                {!isVerified && (
                  <button onClick={() => handleApproveLender(s._id, true)} className="primary-button" style={{ minHeight: '36px', fontSize: '0.82rem', padding: '0 12px' }}>Duyệt Lender</button>
                )}
                <button onClick={() => handleToggleUserStatus(s._id, s.isActive !== false)} className={\`button \${s.isActive !== false ? 'danger' : ''}\`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
                  {s.isActive !== false ? 'Block Shop' : 'Mở khóa'}
                </button>
              </div>
            </div>
          );
        })}
        {shops.length === 0 && <div className="empty-state">Chưa có shop đối tác nào đăng ký.</div>}
      </div>
    </section>
  );
};
export default ShopsTab;
`,
  'CostumesTab.jsx': `
import { Shirt, AlertTriangle } from 'lucide-react';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const CostumesTab = ({ costumes, handleLockProduct }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Kiểm duyệt</p>
        <h2>Toàn bộ sản phẩm trang phục trên hệ thống</h2>
      </div>
      <div className="table-list">
        {costumes.map((p) => {
          const isLocked = p.status === 'hidden';
          const shopName = p.shop?.fullName || p.lender?.lenderName || p.lender?.user?.fullName || 'N/A';
          return (
            <div className="table-row" style={{ padding: '16px', gridTemplateColumns: 'auto 1fr auto' }} key={p._id}>
              {p.images && p.images.length > 0
                ? <img src={p.images[0]?.url || p.images[0]} alt={p.name} style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover' }} />
                : <div style={{ width: '54px', height: '54px', borderRadius: '10px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}><Shirt size={22} style={{ color: '#9ca3af' }} /></div>
              }
              <div style={{ marginLeft: '12px' }}>
                <strong style={{ color: 'var(--primary-strong)' }}>{p.name}</strong>
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                  Cửa hàng: <strong>{shopName}</strong> • Giá thuê: <strong>{money(p.rentalPricePerDay)} đ/ngày</strong> • Size: {p.sizes?.join(', ')}
                </p>
                {isLocked && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.78rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#ef4444' }} /> ĐÃ KHÓA SẢN PHẨM (Vi phạm tiêu chuẩn)
                  </span>
                )}
              </div>
              <button onClick={() => handleLockProduct(p._id, !isLocked)} className={\`button \${!isLocked ? 'danger' : ''}\`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
                {isLocked ? 'Mở khóa sản phẩm' : 'Khóa sản phẩm vi phạm'}
              </button>
            </div>
          );
        })}
        {costumes.length === 0 && <div className="empty-state">Không có trang phục nào trong cơ sở dữ liệu.</div>}
      </div>
    </section>
  );
};
export default CostumesTab;
`,
  'OrdersTab.jsx': `
import StatusBadge from '../../../components/StatusBadge.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const OrdersTab = ({ orders, handleOverrideOrderStatus, setSelectedOrder }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Đơn đặt</p>
        <h2>Quản lý và can thiệp toàn bộ đơn thuê hệ thống</h2>
      </div>
      <div className="table-list">
        {orders.map((o) => (
          <div className="table-row admin-order-row" style={{ padding: '16px', gridTemplateColumns: '1fr auto auto' }} key={o._id}>
            <div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--primary-strong)' }}>{o._productName}</strong>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '3px' }}>
                Shop: <strong>{o.shop?.fullName || 'N/A'}</strong> • Khách: <strong>{o.user?.fullName || 'N/A'}</strong> • Tổng: <strong>{money(o.totalAmount)} đ</strong>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                Thời gian thuê: {date(o.rentalStartDate)} → {date(o.rentalEndDate)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={o.status} />
              <select value={o.status} onChange={(e) => handleOverrideOrderStatus(o._id, e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                <option value="pending">Pending (Chờ duyệt)</option>
                <option value="confirmed">Confirmed (Xác nhận)</option>
                <option value="renting">Renting (Đang thuê)</option>
                <option value="returned">Returned (Đã trả)</option>
                <option value="cancelled">Cancelled (Hủy)</option>
              </select>
            </div>
            <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Chi tiết</button>
          </div>
        ))}
        {orders.length === 0 && <div className="empty-state">Không có đơn đặt hàng nào trong hệ thống.</div>}
      </div>
    </section>
  );
};
export default OrdersTab;
`,
  'CategoriesTab.jsx': `
import { Tags } from 'lucide-react';

const CategoriesTab = ({ categories, newCategory, setNewCategory, handleAddCategory }) => {
  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Cấu hình phân loại</p>
        <h2>Quản lý các danh mục trang phục</h2>
      </div>
      <form onSubmit={handleAddCategory} className="inline-form" style={{ maxWidth: '580px', marginBottom: '20px' }}>
        <input placeholder="Nhập danh mục mới (ví dụ: party, festival)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
        <button className="primary-button" type="submit" style={{ gridColumn: 'span 2' }}>+ Thêm danh mục</button>
      </form>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map((c, idx) => (
          <span key={idx} style={{ background: 'var(--surface-soft)', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', textTransform: 'capitalize', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Tags size={14} style={{ color: '#9ca3af' }} /> {c}
          </span>
        ))}
      </div>
    </section>
  );
};
export default CategoriesTab;
`,
  'ConfigTab.jsx': `
const ConfigTab = ({ platformConfig, setPlatformConfig, adminBankInfo, setAdminBankInfo, handleSaveConfig }) => {
  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Tham số</p>
        <h2>Thiết lập cấu hình chiết khấu nền tảng & Banners</h2>
      </div>
      <form onSubmit={handleSaveConfig} className="input-group" style={{ maxWidth: '680px', gap: '18px' }}>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Phí hoa hồng commission nền tảng (%)</label>
          <input type="number" value={platformConfig.platformFeePercent || platformConfig.platformFeePercentage || 0} onChange={(e) => setPlatformConfig({ ...platformConfig, platformFeePercent: Number(e.target.value) })} required />
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Hệ thống tự động trừ phí hoa hồng này từ mỗi đơn hàng thành công của Shop.</p>
        </div>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Hạn mức nợ phí sàn tối đa để khóa Shop (đ)</label>
          <input type="number" value={platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000} onChange={(e) => setPlatformConfig({ ...platformConfig, maxDebtLimit: Number(e.target.value) })} required />
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Nếu ví của Shop bị âm vượt quá hạn mức nợ này, hệ thống sẽ tự động khóa Shop.</p>
        </div>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Banners trang chủ (Mỗi dòng một URL ảnh)</label>
          <textarea value={(platformConfig.banners || []).join('\\n')} onChange={(e) => setPlatformConfig({ ...platformConfig, banners: e.target.value.split('\\n').map(x => x.trim()).filter(Boolean) })} placeholder="https://picsum.photos/seed/banner/1200/500" style={{ minHeight: '120px' }} />
        </div>
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Tài khoản ngân hàng nhận tiền nạp (EMVCo QR)</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Mã Ngân Hàng (BIN)</label>
              <input type="text" placeholder="VD: 970422 (MBBank)" value={adminBankInfo.bin || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, bin: e.target.value })} required />
              <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Tra cứu mã BIN tại trang chủ Napas hoặc VietQR.</small>
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Số Tài Khoản</label>
              <input type="text" placeholder="VD: 0123456789" value={adminBankInfo.accountNumber || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountNumber: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Tên Chủ Tài Khoản</label>
              <input type="text" placeholder="VD: NGUYEN VAN A" value={adminBankInfo.accountName || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountName: e.target.value.toUpperCase() })} required />
            </div>
          </div>
        </div>
        <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>Lưu cấu hình hệ thống</button>
      </form>
    </section>
  );
};
export default ConfigTab;
`,
  'ComplaintsLogsTab.jsx': `
const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const ComplaintsLogsTab = ({ disputes, logs, setResolvingDispute, setResolutionForm }) => {
  return (
    <div className="admin-section-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <article className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Tranh chấp</p>
          <h2>Khiếu nại đơn thuê (Disputes)</h2>
        </div>
        <div style={{ display: 'grid', gap: '15px', padding: '10px' }}>
          {disputes.map((d) => (
            <div key={d._id} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <strong>Lý do: {d.reason}</strong>
                <span className={\`status-pill \${d.status === 'Resolved' ? 'active' : 'inactive'}\`} style={{ fontSize: '0.7rem' }}>{d.status}</span>
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
          {disputes.length === 0 && <div className="empty-state">Chưa nhận được khiếu nại tranh chấp nào.</div>}
        </div>
      </article>

      <article className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Nhật ký</p>
          <h2>Lịch sử hoạt động của hệ thống (Logs)</h2>
        </div>
        <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'grid', gap: '8px', padding: '10px' }}>
          {logs.map((log) => (
            <div key={log._id} style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span style={{ textTransform: 'uppercase', color: 'var(--accent)' }}>{log.action}</span>
                <span style={{ color: 'var(--muted)', fontWeight: '400' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--primary-strong)' }}>{log.description}</p>
              <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                Tài khoản tác nhân: <strong>{log.user?.fullName} ({log.user?.email})</strong>
              </small>
            </div>
          ))}
          {logs.length === 0 && <div className="empty-state">Chưa có nhật ký hoạt động nào.</div>}
        </div>
      </article>
    </div>
  );
};
export default ComplaintsLogsTab;
`,
  'WithdrawalsTab.jsx': `
import { Info } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const WithdrawalsTab = ({ withdrawals, handleProcessWithdrawal, visibleWithdrawalQr, setVisibleWithdrawalQr }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Tài chính</p>
        <h2>Yêu cầu rút tiền từ người dùng</h2>
      </div>
      <div className="table-list">
        {withdrawals.map((w) => (
          <div className="table-row" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} key={w._id}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 8px 0' }}>
                  Người yêu cầu: <strong>{w.user?.fullName}</strong> • {w.user?.email}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  {new Date(w.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={\`status-pill \${w.status === 'completed' ? 'active' : w.status === 'rejected' ? 'inactive' : 'warning'}\`}>
                  {w.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '2px solid var(--primary)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>THÔNG TIN CHUYỂN KHOẢN</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tiền</p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-strong)' }}>{money(w.amount)} đ</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Mã tham chiếu</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent)' }}>{w.orderCode}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Ngân hàng</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.bankName}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tài khoản</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{w.bankAccount?.accountNumber}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Chủ tài khoản</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.accountHolderName}</p>
                </div>
              </div>
            </div>

            {(w.status === 'pending' || w.status === 'processing') && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {w.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleProcessWithdrawal(w._id, 'processing')}
                        className="primary-button"
                        style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                      >
                        Bắt đầu chuyển
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(w._id, 'rejected')}
                        className="button danger"
                        style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {w.status === 'processing' && (
                    <button
                      onClick={() => handleProcessWithdrawal(w._id, 'rejected')}
                      className="button danger"
                      style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                    >
                      Từ chối
                    </button>
                  )}
                  <button
                    className="button"
                    style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                    onClick={() => setVisibleWithdrawalQr(visibleWithdrawalQr === w._id ? null : w._id)}
                  >
                    {visibleWithdrawalQr === w._id ? 'Ẩn QR' : 'Xem QR'}
                  </button>
                </div>

                {w.status === 'processing' && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    background: '#fef3c7',
                    padding: '6px 10px',
                    borderRadius: '6px'
                  }}>
                    Hệ thống sẽ tự động cập nhật trạng thái
                  </div>
                )}
              </div>
            )}

            {visibleWithdrawalQr === w._id && w.qrString && (
              <div style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '2px solid var(--border)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <Info size={16} style={{ color: '#6b7280' }} /> Quét mã này để chuyển khoản
                </p>
                <div style={{ display: 'inline-block', background: 'white', padding: '8px', borderRadius: '8px' }}>
                  <QRCodeCanvas value={w.qrString} size={150} level="M" />
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Nội dung: <strong>{w.orderCode}</strong></p>
              </div>
            )}

            {w.rejectionReason && (
              <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger)' }}>Lý do từ chối: {w.rejectionReason}</p>
              </div>
            )}
          </div>
        ))}
        {withdrawals.length === 0 && <div className="empty-state">Không có yêu cầu rút tiền nào.</div>}
      </div>
    </section>
  );
};
export default WithdrawalsTab;
`,
  'ChatTab.jsx': `
import ChatBox from '../../../components/ChatBox.jsx';

const ChatTab = ({ conversations, selectedConvId, setSelectedConvId }) => {
  return (
    <div className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Hộp thư hỗ trợ</p>
        <h2>Trò chuyện với khách hàng</h2>
      </div>
      <div className="admin-chat-layout" style={{ minHeight: '520px' }}>
        <div className="conversation-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {conversations.map((c) => (
            <div key={c._id} className={\`conversation-item \${selectedConvId === c._id ? 'active' : ''}\`} onClick={() => setSelectedConvId(c._id)}>
              <strong>{c.customer?.fullName || 'Khách hàng'}</strong>
              <span>{c.lastMessage || 'Chưa có tin nhắn'}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('vi-VN') : ''}
              </span>
            </div>
          ))}
          {conversations.length === 0 && <div className="empty-state">Chưa có hội thoại hỗ trợ nào.</div>}
        </div>
        <div className="chat-container">
          {selectedConvId ? (
            <ChatBox conversationId={selectedConvId} />
          ) : (
            <div className="chat-empty">
              Chọn một đoạn hội thoại để bắt đầu chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatTab;
`
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim(), 'utf8');
}
console.log('Files created.');
