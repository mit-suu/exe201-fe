import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import { getMyOrders, cancelOrder } from '../services/orders.js';
import { getCurrentUser } from '../services/auth.js';
import { createReview } from '../services/reviews.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewedOrderIds, setReviewedOrderIds] = useState([]);
  const currentUser = getCurrentUser();

  const loadOrders = () => {
    setLoading(true);
    getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được lịch sử đơn đặt.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt thuê này không?')) return;
    try {
      setError('');
      setSuccessMsg('');
      await cancelOrder(orderId);
      setSuccessMsg('Hủy đơn hàng thành công.');
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  return (
    <section className="profile-page card" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div className="profile-page-heading">
        <div className="profile-avatar large-avatar" style={{ background: 'var(--accent)' }}>📦</div>
        <div>
          <p className="eyebrow">Khách hàng</p>
          <h1>Lịch sử đơn thuê trang phục</h1>
          <p>Xem, quản lý trạng thái thanh toán, hóa đơn và hủy đơn khi cần thiết.</p>
        </div>
      </div>

      {successMsg && <div className="alert success-alert">{successMsg}</div>}
      {error && <div className="alert">{error}</div>}
      {loading && <div className="empty-state">Đang tải lịch sử đơn hàng của bạn...</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="empty-state" style={{ padding: '40px' }}>
          Bạn chưa thực hiện đơn đặt thuê nào trên hệ thống.
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="table-list order-history-list">
          {orders.map((order) => {
            const displayTitle = order.items?.[0]?.name || order.product?.name || 'Trang phục';
            return (
              <div className="table-row" style={{ gridTemplateColumns: '1fr auto auto', gap: '15px', padding: '16px' }} key={order._id}>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary-strong)' }}>{displayTitle}</strong>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                    Mã: <code style={{ background: 'var(--surface-soft)', padding: '2px 6px', borderRadius: '4px' }}>{order._id.slice(-8).toUpperCase()}</code> • {date(order.rentalStartDate)} - {date(order.rentalEndDate)} ({order.rentalDays} ngày)
                  </p>
                  <p style={{ fontWeight: '800', marginTop: '6px' }}>{money(order.totalAmount)} đ</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setSelectedOrder(order)} 
                    className="button"
                    style={{ minHeight: '38px', fontSize: '0.85rem' }}
                  >
                    Xem chi tiết
                  </button>
                  {order.status === 'returned' && !reviewedOrderIds.includes(order._id) && (
                    <button 
                      onClick={() => { setReviewingOrder(order); setRating(5); setComment(''); }} 
                      className="button"
                      style={{ minHeight: '38px', fontSize: '0.85rem', background: 'var(--accent)', color: 'white' }}
                    >
                      Đánh giá
                    </button>
                  )}
                  {['pending', 'pending_payment'].includes(order.status) && (
                    <button 
                      onClick={() => handleCancelOrder(order._id)} 
                      className="button danger"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: 'min(680px, 100%)',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            borderRadius: '26px',
            boxShadow: 'var(--shadow)',
            padding: '30px',
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedOrder(null)} 
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--surface-soft)',
                border: '0',
                fontSize: '1.2rem',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              ×
            </button>

            <div style={{ borderBottom: '2px dashed var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p className="eyebrow" style={{ margin: 0 }}>Hóa Đơn Thuê Đồ</p>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem', letterSpacing: '-0.03em' }}>BuildLab Invoice</h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={selectedOrder.status} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px' }}>
                    Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <div>
                <strong style={{ color: 'var(--muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Thông tin khách hàng</strong>
                <strong>{currentUser?.fullName}</strong>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>{currentUser?.email}</p>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>SĐT: {selectedOrder.user?.phone || currentUser?.phone || 'Chưa cung cấp'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ color: 'var(--muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Đối tác cho thuê</strong>
                <strong>{selectedOrder.shop?.fullName || 'Shop đối tác'}</strong>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>Email: {selectedOrder.shop?.email || 'N/A'}</p>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>SĐT: {selectedOrder.shop?.phone || 'N/A'}</p>
              </div>
            </div>

            <div style={{ background: 'var(--surface-soft)', padding: '14px', borderRadius: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Thời gian bắt đầu thuê:</strong>
                  <p style={{ fontSize: '1rem', color: 'var(--primary-strong)', marginTop: '4px', fontWeight: '800' }}>
                    {date(selectedOrder.rentalStartDate)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Thời gian hoàn trả đồ:</strong>
                  <p style={{ fontSize: '1rem', color: 'var(--primary-strong)', marginTop: '4px', fontWeight: '800' }}>
                    {date(selectedOrder.rentalEndDate)}
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng số ngày đặt thuê trang phục:</span>
                <strong>{selectedOrder.rentalDays} ngày</strong>
              </div>
            </div>

            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Danh sách trang phục thuê</strong>
            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: '800' }}>
                    <th style={{ padding: '12px' }}>Trang phục</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Size/Màu</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>SL</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Đơn giá/ngày</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [
                    {
                      name: selectedOrder.product?.name || 'Trang phục thuê',
                      size: selectedOrder.size || 'N/A',
                      color: selectedOrder.product?.color || 'N/A',
                      quantity: 1,
                      rentalPricePerDay: selectedOrder.product?.rentalPricePerDay || 0,
                      subtotal: selectedOrder.subtotal || 0
                    }
                  ]).map((item, idx) => (
                    <tr style={{ borderBottom: '1px solid var(--border)' }} key={idx}>
                      <td style={{ padding: '12px', fontWeight: '800' }}>{item.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)' }}>{item.size} / {item.color || 'N/A'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{money(item.rentalPricePerDay)} đ</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{money(item.subtotal)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', fontSize: '0.9rem' }}>
              <div style={{ color: 'var(--muted)' }}>
                {selectedOrder.note && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Ghi chú đơn hàng:</strong>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{selectedOrder.note}</p>
                  </div>
                )}
                <div>
                  <strong>Mã số hóa đơn (ID):</strong>
                  <p style={{ margin: '4px 0', fontSize: '0.78rem', fontFamily: 'monospace' }}>{selectedOrder._id}</p>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Tạm tính thuê:</span>
                  <strong>{money(selectedOrder.subtotal)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Tiền cọc (trả lại):</span>
                  <strong>{money(selectedOrder.depositAmount)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Phí phát sinh:</span>
                  <span style={{ color: 'var(--danger)' }}>+ {money(selectedOrder.extraFee)} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Tổng hóa đơn:</span>
                  <strong style={{ color: 'var(--accent)' }}>{money(selectedOrder.totalAmount)} đ</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {['pending', 'pending_payment'].includes(selectedOrder.status) && (
                <button 
                  onClick={() => handleCancelOrder(selectedOrder._id)} 
                  className="primary-button danger"
                  style={{ minHeight: '44px' }}
                >
                  Hủy đơn đặt thuê này
                </button>
              )}
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="secondary-button"
                style={{ minHeight: '44px' }}
              >
                Đóng hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal Overlay */}
      {reviewingOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setError('');
              setSuccessMsg('');
              const productId = reviewingOrder.product?._id || reviewingOrder.product || reviewingOrder.items?.[0]?.product;
              await createReview({
                orderId: reviewingOrder._id,
                productId,
                rating,
                comment
              });
              setSuccessMsg('Đánh giá sản phẩm thành công. Cảm ơn bạn đã phản hồi!');
              setReviewedOrderIds(prev => [...prev, reviewingOrder._id]);
              setReviewingOrder(null);
              loadOrders();
            } catch (err) {
              setError(err?.response?.data?.message || 'Không gửi được đánh giá.');
            }
          }} className="card" style={{
            width: 'min(500px, 100%)',
            background: 'white',
            borderRadius: '24px',
            padding: '30px',
            position: 'relative'
          }}>
            <button 
              type="button"
              onClick={() => setReviewingOrder(null)} 
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--surface-soft)',
                border: '0',
                fontSize: '1.2rem',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              ×
            </button>

            <h2 style={{ margin: '0 0 15px', fontSize: '1.4rem' }}>Đánh giá trang phục</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Hãy chia sẻ trải nghiệm của bạn về sản phẩm <strong>{reviewingOrder.items?.[0]?.name || reviewingOrder.product?.name || 'trang phục'}</strong>.
            </p>

            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '800' }}>Số sao đánh giá</label>
              <div style={{ display: 'flex', gap: '8px', fontSize: '2rem', cursor: 'pointer', margin: '5px 0' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => setRating(star)}
                    style={{ color: star <= rating ? 'gold' : '#cbd5e1' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '800' }}>Bình luận / Phản hồi</label>
              <textarea 
                placeholder="Trang phục mặc rất vừa vặn, vải đẹp, shop hỗ trợ nhiệt tình..." 
                value={comment} 
                onChange={(e) => setComment(e.target.value)} 
                required
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-button" style={{ minHeight: '44px' }}>Gửi đánh giá</button>
              <button type="button" onClick={() => setReviewingOrder(null)} className="secondary-button" style={{ minHeight: '44px' }}>Hủy bỏ</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default OrderHistory;
