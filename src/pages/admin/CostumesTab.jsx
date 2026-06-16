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
                  Cửa hàng: <strong>{shopName}</strong> • Giá thuê: <strong>{money(p.rentalPrice)} đ/ngày</strong> • Size: {p.size}
                </p>
                {isLocked && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.78rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} style={{ color: '#ef4444' }} /> ĐÃ KHÓA SẢN PHẨM (Vi phạm tiêu chuẩn)
                  </span>
                )}
              </div>
              <button onClick={() => handleLockProduct(p._id, !isLocked)} className={`button ${!isLocked ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
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