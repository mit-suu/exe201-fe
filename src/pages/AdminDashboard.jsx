import { useEffect, useMemo, useState } from 'react';
import ChatBox from '../components/ChatBox.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getConversations } from '../services/chats.js';
import { getAllOrders, updateOrderStatus } from '../services/orders.js';
import { getUsers } from '../services/users.js';

const statuses = ['pending_payment', 'paid', 'confirmed', 'preparing', 'renting', 'returned', 'cancelled', 'payment_failed'];
const paidStatuses = ['paid', 'confirmed', 'preparing', 'renting', 'returned'];
const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [orderData, userData, conversationData] = await Promise.all([
      getAllOrders(),
      getUsers(),
      getConversations(),
    ]);
    setOrders(Array.isArray(orderData) ? orderData : []);
    setUsers(Array.isArray(userData) ? userData : []);
    setConversations(Array.isArray(conversationData) ? conversationData : []);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    revenue: orders.filter((order) => paidStatuses.includes(order.status)).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    orders: orders.length,
    pending: orders.filter((order) => order.status === 'pending_payment').length,
    users: users.length,
  }), [orders, users]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const handleStatusChange = async (orderId, status) => {
    try {
      setMessage('');
      await updateOrderStatus(orderId, status);
      await load();
      setMessage('Đã cập nhật trạng thái đơn hàng.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Không cập nhật được trạng thái đơn hàng.');
    }
  };

  return (
    <div className="admin-dashboard-page">
      <section className="card admin-hero-card">
        <div>
          <p className="eyebrow">Admin BuildLab</p>
          <h1>Dashboard quản trị</h1>
          <p>Theo dõi doanh thu, đơn đặt, người dùng và trả lời khách hàng trong một trang.</p>
        </div>
      </section>

      <section className="admin-stat-grid">
        <article className="order-summary-card">
          <strong>{money(stats.revenue)} đ</strong>
          <span>Doanh thu</span>
        </article>
        <article className="order-summary-card">
          <strong>{stats.orders}</strong>
          <span>Tổng đơn đặt</span>
        </article>
        <article className="order-summary-card">
          <strong>{stats.pending}</strong>
          <span>Đơn chờ thanh toán</span>
        </article>
        <article className="order-summary-card">
          <strong>{stats.users}</strong>
          <span>Người dùng</span>
        </article>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="admin-section-grid">
        <article className="card admin-table-card">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Đơn đặt</p>
            <h2>Đơn gần đây</h2>
          </div>
          <div className="table-list">
            {recentOrders.length ? recentOrders.map((order) => (
              <div className="table-row admin-order-row" key={order._id}>
                <div>
                  <strong>{order.product?.name || 'Sản phẩm'}</strong>
                  <p>{order.user?.fullName || order.user?.email || 'Khách hàng'} • {money(order.totalAmount)} đ</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            )) : <div className="empty-state">Chưa có đơn đặt nào.</div>}
          </div>
        </article>

        <article className="card admin-table-card">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Người dùng</p>
            <h2>Tài khoản mới</h2>
          </div>
          <div className="user-list">
            {users.slice(0, 6).map((user) => (
              <div className="user-list-item" key={user._id}>
                <div className="user-avatar">{(user.fullName || user.email || 'U').charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{user.fullName || 'Chưa cập nhật tên'}</strong>
                  <p>{user.email}</p>
                </div>
                <span className={`role-pill ${user.role}`}>{user.role}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Quản lý đơn</p>
          <h2>Tất cả đơn thuê</h2>
        </div>
        <div className="table-list">
          {orders.length ? orders.map((order) => (
            <div className="table-row admin-order-row" key={order._id}>
              <div>
                <strong>{order.product?.name || 'Sản phẩm'}</strong>
                <p>{order.user?.fullName || order.user?.email || 'Khách hàng'} • {date(order.rentalStartDate)} - {date(order.rentalEndDate)} • {money(order.totalAmount)} đ</p>
              </div>
              <StatusBadge status={order.status} />
              <select value={order.status} onChange={(event) => handleStatusChange(order._id, event.target.value)}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          )) : <div className="empty-state">Chưa có đơn để quản lý.</div>}
        </div>
      </section>

      <section className="card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Quản lý người dùng</p>
          <h2>Danh sách người dùng</h2>
        </div>
        <div className="user-list full-user-list">
          {users.length ? users.map((user) => (
            <div className="user-list-item" key={user._id}>
              <div className="user-avatar">{(user.fullName || user.email || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <strong>{user.fullName || 'Chưa cập nhật tên'}</strong>
                <p>{user.email}</p>
              </div>
              <span className={`role-pill ${user.role}`}>{user.role}</span>
              <span className={`status-pill ${user.isActive === false ? 'inactive' : 'active'}`}>{user.isActive === false ? 'Inactive' : 'Active'}</span>
            </div>
          )) : <div className="empty-state">Chưa có người dùng.</div>}
        </div>
      </section>

      <section className="card admin-inbox-card admin-table-card">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Chat với người dùng</p>
          <h2>Hộp thư khách hàng</h2>
        </div>
        <div className="admin-chat-layout">
          <div className="conversation-list">
            {conversations.length ? conversations.map((item) => (
              <button key={item._id} className={`conversation-item ${selectedConversation === item._id ? 'active' : ''}`} onClick={() => setSelectedConversation(item._id)}>
                <strong>{item.customer?.fullName || item.customer?.email || 'Khách hàng'}</strong>
                <span>{item.lastMessage || 'Chưa có tin nhắn'}</span>
              </button>
            )) : <div className="empty-state">Chưa có cuộc trò chuyện.</div>}
          </div>
          {selectedConversation ? <ChatBox conversationId={selectedConversation} /> : <div className="chat-empty">Chọn một cuộc trò chuyện để trả lời khách hàng.</div>}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
