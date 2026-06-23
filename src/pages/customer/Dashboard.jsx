import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ChatBox from '../../components/ChatBox.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { getMyOrders } from '../../services/orders.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const Dashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được đơn hàng'));
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending_payment').length,
    active: orders.filter((order) => ['paid', 'confirmed', 'preparing', 'renting'].includes(order.status)).length,
    spent: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
  }), [orders]);

  return (
    <div className="dashboard-page">
      <section className="profile-summary">
        <div className="profile-avatar">{user?.fullName?.charAt(0)?.toUpperCase() || 'B'}</div>
        <div>
          <p className="eyebrow">Hồ sơ khách hàng</p>
          <h1>Xin chào, {user?.fullName}</h1>
          <p>{user?.email}</p>
        </div>
        <Link className="primary-button" to="/">Thuê thêm trang phục</Link>
      </section>

      <section className="dashboard-grid">
        <div className="order-summary-card"><strong>{stats.total}</strong><span>Tổng đơn thuê</span></div>
        <div className="order-summary-card"><strong>{stats.pending}</strong><span>Chờ thanh toán</span></div>
        <div className="order-summary-card"><strong>{stats.active}</strong><span>Đang xử lý/đang thuê</span></div>
        <div className="order-summary-card"><strong>{money(stats.spent)} đ</strong><span>Tổng giá trị đơn</span></div>
      </section>

      <div className="dashboard-content-grid">
        <section className="card orders-panel">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Đơn thuê</p>
              <h2>Lịch sử đặt thuê</h2>
            </div>
          </div>
          {error && <div className="alert">{error}</div>}
          {!orders.length && !error && <div className="empty-state">Bạn chưa có đơn thuê nào. Hãy chọn một trang phục trong catalog để bắt đầu.</div>}
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div>
                  <h3>{order.product?.name || 'Trang phục BuildLab'}</h3>
                  <p>{new Date(order.rentalStartDate).toLocaleDateString('vi-VN')} → {new Date(order.rentalEndDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <StatusBadge status={order.status} />
                <strong>{money(order.totalAmount)} đ</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="card support-panel">
          <div className="section-heading">
            <p className="eyebrow">Hỗ trợ</p>
            <h2>Chat với admin</h2>
          </div>
          <ChatBox />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

