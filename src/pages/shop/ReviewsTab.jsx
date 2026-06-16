
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const ReviewsTab = (props) => {
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
              <p className="eyebrow">Khách hàng</p>
              <h2>Đánh giá từ khách hàng đã thuê trang phục</h2>
            </div>

            <div style={{ display: 'grid', gap: '20px', padding: '10px' }}>
              {reviews.map((r) => (
                <div key={r._id} style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar" style={{ width: '38px', height: '38px', borderRadius: '12px' }}>
                        {r.reviewer?.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <strong>{r.reviewer?.fullName || 'Khách hàng ẩn danh'}</strong>
                        <div style={{ color: 'gold', fontSize: '0.85rem', marginTop: '2px' }}>
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p style={{ margin: '12px 0 6px', fontSize: '0.92rem', color: 'var(--primary-strong)' }}>
                    Đánh giá cho: <strong>{r.product?.name || 'Trang phục'}</strong>
                  </p>

                  <blockquote style={{ margin: '0 0 15px', paddingLeft: '10px', borderLeft: '3px solid var(--accent)', color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    "{r.comment || 'Khách hàng không để lại bình luận.'}"
                  </blockquote>

                  {/* Owner Reply Block */}
                  {r.reply ? (
                    <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.85rem', marginLeft: '20px' }}>
                      <strong>Phản hồi từ shop:</strong>
                      <p style={{ margin: '4px 0 0', color: '#166534' }}>{r.reply.content}</p>
                      <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                        Phản hồi vào lúc: {new Date(r.reply.repliedAt).toLocaleDateString('vi-VN')}
                      </small>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                      <input
                        placeholder="Nhập phản hồi nhanh cảm ơn khách..."
                        value={replyText[r._id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [r._id]: e.target.value })}
                        style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', borderRadius: '12px' }}
                      />
                      <button onClick={() => handleReplySubmit(r._id)} className="primary-button" style={{ minHeight: '38px', fontSize: '0.8rem' }}>Gửi</button>
                    </div>
                  )}
                </div>
              ))}
              {reviews.length === 0 && <div className="empty-state">Chưa nhận được đánh giá nào từ khách hàng.</div>}
            </div>
          </section>
  );
};

export default ReviewsTab;


