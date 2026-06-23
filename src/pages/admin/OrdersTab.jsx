import StatusBadge from '../../components/StatusBadge.jsx';

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
                Thời gian thuê: {date(o.startDate)} → {date(o.endDate)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusBadge status={o.status} />
              <select value={o.status} onChange={(e) => handleOverrideOrderStatus(o._id, e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                <option value="Pending">Pending (Chờ duyệt)</option>
                <option value="Approved">Approved (Xác nhận)</option>
                <option value="Shipped">Shipped (Đang giao)</option>
                <option value="Rented">Rented (Đang thuê)</option>
                <option value="Returning">Returning (Đang trả)</option>
                <option value="Returned">Returned (Đã nhận lại)</option>
                <option value="Completed">Completed (Hoàn tất)</option>
                <option value="Canceled">Canceled (Hủy)</option>
                <option value="Disputed">Disputed (Khiếu nại)</option>
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

