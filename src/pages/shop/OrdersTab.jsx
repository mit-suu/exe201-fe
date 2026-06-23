
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const OrdersTab = (props) => {
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
    loadData,
    setShowProductForm
  } = props;

  return (
    <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Thuê đồ</p>
              <h2>Tất cả đơn đặt thuê thuộc shop</h2>
            </div>
            <div className="table-list">
              {orders.map((o) => {
                const displayTitle = o.items?.[0]?.name || o.product?.name || 'Trang phục';
                return (
                  <div className="table-row admin-order-row" style={{ padding: '16px', gridTemplateColumns: '1fr auto auto' }} key={o._id}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--primary-strong)' }}>{displayTitle}</strong>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '3px' }}>
                        Khách: <strong>{o.renter?.fullName || o.user?.fullName}</strong> • SĐT: {o.renter?.phone || o.user?.phone || 'N/A'} • Email: {o.renter?.email || o.user?.email || 'N/A'}
                      </p>
                      <p style={{ fontSize: '0.82rem', marginTop: '3px' }}>
                        Khách trả: {money(o.pricing?.totalAmount || o.totalAmount)} đ • Thực nhận: <strong style={{ color: 'var(--accent)' }}>{money(o.pricing?.lenderRevenue)} đ</strong>
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                        Thời gian: {date(o.rentalStartDate)} → {date(o.rentalEndDate)} ({o.rentalDays} ngày)
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StatusBadge status={o.status} />
                      {['Canceled','Rejected','Returned','Completed'].includes(o.status) ? (
                        <StatusBadge status={o.status} />
                      ) : (
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          style={{ padding: '6px', fontSize: '0.8rem', width: '165px' }}
                        >
                          <option value="Pending" disabled={o.status !== 'Pending'}>Chờ xác nhận</option>
                          <option value="Approved" disabled={o.status !== 'Pending'}>✓ Xác nhận</option>
                          <option value="Rented" disabled={o.status !== 'Approved'}>→ Đang thuê</option>
                          <option value="Returned" disabled={o.status !== 'Rented'}>→ Đã trả đồ</option>
                          <option value="Canceled" disabled={!['Pending','Approved'].includes(o.status)}>✗ Hủy đơn</option>
                          <option value="Rejected" disabled={o.status !== 'Pending'}>✗ Từ chối</option>
                        </select>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Chi tiết</button>
                      {o.status === 'Pending' && (
                        <button
                          onClick={async () => {
                            try {
                              const { confirmOrder } = await import('../../services/orders.js');
                              await confirmOrder(o._id);
                              toast.success('Xác nhận đơn thành công');
                              loadData();
                            } catch (e) {
                              toast.error('Lỗi: ' + e.message);
                            }
                          }}
                          className="button"
                          style={{ minHeight: '36px', fontSize: '0.82rem', background: 'var(--primary)', color: 'white' }}
                        >
                          Xác nhận
                        </button>
                      )}
                      {o.status === 'Approved' && (
                        <button
                          onClick={() => {
                            setCheckingInOrder(o);
                            setCheckInImages('');
                          }}
                          className="primary-button"
                          style={{ minHeight: '36px', fontSize: '0.82rem' }}
                        >
                          Giao đồ (Check-in)
                        </button>
                      )}
                      {o.status === 'Rented' && (
                        <>
                          <button
                            onClick={() => {
                              setCheckingOutOrder(o);
                              setCheckOutImages('');
                            }}
                            className="primary-button"
                            style={{ minHeight: '36px', fontSize: '0.82rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                          >
                            Nhận đồ (Check-out)
                          </button>
                          <button
                            onClick={() => {
                              setDisputingOrder(o);
                              setDisputeReason('');
                              setDisputeAmount(0);
                            }}
                            className="button danger"
                            style={{ minHeight: '36px', fontSize: '0.82rem' }}
                          >
                            Báo hỏng / Trừ cọc
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && <div className="empty-state">Chưa có đơn hàng thuê nào gửi đến shop.</div>}
            </div>
          </section>
  );
};

export default OrdersTab;


