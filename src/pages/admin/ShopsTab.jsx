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
                <span className={`status-pill ${s.isActive !== false ? 'active' : 'inactive'}`} style={{ alignSelf: 'center', fontSize: '0.7rem' }}>
                  {s.isActive !== false ? 'Active' : 'Blocked'}
                </span>
                <span className={`status-pill ${isVerified ? 'active' : 'inactive'}`} style={{ alignSelf: 'center', fontSize: '0.7rem', background: isVerified ? '#dcfce7' : '#fee2e2', color: isVerified ? '#166534' : '#991b1b' }}>
                  {isVerified ? 'Verified' : 'Pending Approval'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setSelectedShop(s)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Xem hồ sơ</button>
                {!isVerified && (
                  <button onClick={() => handleApproveLender(s._id, true)} className="primary-button" style={{ minHeight: '36px', fontSize: '0.82rem', padding: '0 12px' }}>Duyệt Lender</button>
                )}
                <button onClick={() => handleToggleUserStatus(s._id, s.isActive !== false)} className={`button ${s.isActive !== false ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
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