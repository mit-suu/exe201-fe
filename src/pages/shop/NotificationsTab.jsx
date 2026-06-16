
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const NotificationsTab = (props) => {
  const {
    products, orders, reviews, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleUpdateBank,
    withdrawalAmount, setWithdrawalAmount, handleWithdraw,
    handlePrintReport,
    replyText, setReplyText, handleReplySubmit,
    handleMarkNotifRead,
    handleProductEdit, handleProductDelete,
    newBusyDate, setNewBusyDate, handleAddBusyDate, handleRemoveBusyDate,
    selectedOrder, setSelectedOrder,
    checkingInOrder, setCheckingInOrder, checkInImages, setCheckInImages,
    checkingOutOrder, setCheckingOutOrder, checkOutImages, setCheckOutImages,
    disputingOrder, setDisputingOrder, disputeReason, setDisputeReason, disputeAmount, setDisputeAmount,
    handleStatusChange,
    navigate,
    setShowProductForm
  } = props;

  return (
    <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Hộp thư</p>
              <h2>Thông báo hoạt động ({notifications.filter(n => !n.isRead).length} mới)</h2>
            </div>

            <div style={{ display: 'grid', gap: '10px', padding: '10px' }}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '16px',
                    background: n.isRead ? 'white' : '#f0f4ff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--primary-strong)' }}>
                      {!n.isRead && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', marginRight: '6px', verticalAlign: 'middle' }}></span>}{n.title}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--muted)' }}>{n.body}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                      {new Date(n.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkNotifRead(n._id)}
                      className="button"
                      style={{ minHeight: '34px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              ))}
              {notifications.length === 0 && <div className="empty-state">Hộp thư thông báo của bạn đang trống.</div>}
            </div>
          </section>
  );
};

export default NotificationsTab;


