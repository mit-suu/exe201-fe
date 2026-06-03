import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import { getMyOrders, cancelOrder } from '../services/orders.js';
import { getCurrentUser } from '../services/auth.js';
import { createReview } from '../services/reviews.js';
import { Copy, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  
  // Dispute Modal States
  const [disputingOrder, setDisputingOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'disputes'
  const [disputes, setDisputes] = useState([]);

  const currentUser = getCurrentUser();

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
      
      const { getMyDisputes } = await import('../services/dispute.js');
      const dispData = await getMyDisputes();
      setDisputes(dispData || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được lịch sử đơn đặt.');
    } finally {
      setLoading(false);
    }
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
        <div>
          <p className="eyebrow">Khách hàng</p>
          <h1>Lịch sử đơn thuê trang phục</h1>
          <p>Xem, quản lý trạng thái thanh toán, hóa đơn và khiếu nại của bạn.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('orders')} 
          className={activeTab === 'orders' ? 'primary-button' : 'button'}
        >
          Lịch sử thuê đồ
        </button>
        <button 
          onClick={() => setActiveTab('disputes')} 
          className={activeTab === 'disputes' ? 'primary-button' : 'button'}
        >
          Khiếu nại của tôi
        </button>
      </div>

      {successMsg && <div className="alert success-alert">{successMsg}</div>}
      {error && <div className="alert">{error}</div>}
      
      {activeTab === 'orders' && (
        <>
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
                    Mã: <code style={{ background: 'var(--surface-soft)', padding: '2px 6px', borderRadius: '4px' }}>{order._id.slice(-8).toUpperCase()}</code> • {date(order.startDate)} - {date(order.endDate)} ({order.pricing?.rentalDays || order.rentalDays} ngày)
                  </p>
                  <p style={{ fontWeight: '800', marginTop: '6px' }}>{money(order.pricing?.totalAmount || order.totalAmount)} đ</p>
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
                  {order.status === 'Approved' && order.qrCodeToken && (
                    <div style={{ padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '5px' }}>Đưa mã này cho Shop khi nhận đồ:</p>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${order.qrCodeToken}`} alt="QR Code" style={{ width: '100px', height: '100px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '5px' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>Token: {order.qrCodeToken}</p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(order.qrCodeToken);
                            toast.success('Đã copy mã Token!');
                          }} 
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', color: 'var(--primary)' }}
                          title="Copy Token"
                        >
                          <Copy size={15} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )}
                  {['Approved', 'Rented', 'Returned', 'Completed'].includes(order.status) && (
                    <button 
                      onClick={async () => {
                        try {
                          const { getContract } = await import('../services/orders.js');
                          const contract = await getContract(order._id);
                          if (contract) {
                             // Simulating a contract view
                             const w = window.open('', '_blank');
                             w.document.write(`<html><head><title>Hợp Đồng Thuê - ${order._id}</title></head><body style="padding:40px; font-family:sans-serif;">
                               <h2>Hợp Đồng Thuê Đồ</h2>
                               <p><strong>Ngày ký:</strong> ${new Date(contract.createdAt).toLocaleDateString()}</p>
                               <hr/>
                               <pre style="white-space: pre-wrap; font-family:sans-serif;">${contract.terms}</pre>
                             </body></html>`);
                             w.document.close();
                          }
                        } catch (e) {
                           toast.error('Hợp đồng chưa sẵn sàng hoặc lỗi tải.');
                        }
                      }}
                      className="button"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={15} style={{ color: '#6b7280' }} /> Hợp đồng
                      </span>
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
                  {['Rented', 'Returned', 'Completed'].includes(order.status) && (
                    <button 
                      onClick={() => {
                        setDisputingOrder(order);
                        setDisputeReason('');
                        setDisputeDescription('');
                      }} 
                      className="button danger"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    >
                      Báo cáo / Khiếu nại
                    </button>
                  )}
                  {order.status === 'rented' && (
                    <button 
                      onClick={async () => {
                        const newEndDate = window.prompt('Nhập ngày bạn muốn gia hạn đến (YYYY-MM-DD):');
                        if (newEndDate) {
                          try {
                            const { extendOrder } = await import('../services/orders.js');
                            await extendOrder(order._id, newEndDate);
                            toast.success('Đã gửi yêu cầu gia hạn thành công.');
                            loadOrders();
                          } catch (err) {
                            toast.error('Lỗi: ' + (err?.response?.data?.message || err.message));
                          }
                        }
                      }} 
                      className="button"
                      style={{ minHeight: '38px', fontSize: '0.85rem' }}
                    >
                      Gia hạn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
          )}
        </>
      )}

      {activeTab === 'disputes' && (
        <div className="order-list">
          {disputes.map((d) => (
            <div key={d._id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Lý do: {d.reason}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    Đơn hàng ID: {d.order?._id}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>{d.description}</p>
              {d.resolution && (
                <div style={{ marginTop: '15px', background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px' }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Kết quả phân xử:</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{d.resolution.adminDecision}</p>
                </div>
              )}
            </div>
          ))}
          {disputes.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Chưa có khiếu nại nào.
            </div>
          )}
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
                <strong>{selectedOrder.lender?.lenderName || 'Lender đối tác'}</strong>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>Email: {selectedOrder.lender?.user?.email || 'N/A'}</p>
                <p style={{ color: 'var(--muted)', margin: '2px 0' }}>SĐT: {selectedOrder.lender?.user?.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div style={{ background: 'var(--surface-soft)', padding: '14px', borderRadius: '16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Thời gian bắt đầu thuê:</strong>
                  <p style={{ fontSize: '1rem', color: 'var(--primary-strong)', marginTop: '4px', fontWeight: '800' }}>
                    {date(selectedOrder.startDate)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Thời gian hoàn trả đồ:</strong>
                  <p style={{ fontSize: '1rem', color: 'var(--primary-strong)', marginTop: '4px', fontWeight: '800' }}>
                    {date(selectedOrder.endDate)}
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng số ngày đặt thuê trang phục:</span>
                <strong>{selectedOrder.pricing?.rentalDays || selectedOrder.rentalDays} ngày</strong>
              </div>
            </div>

            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Danh sách trang phục thuê</strong>
            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                 <thead>
                   <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', fontWeight: '800' }}>
                     <th style={{ padding: '12px', width: '80px' }}>Ảnh</th>
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
                       rentalPricePerDay: selectedOrder.product?.rentalPrice || 0,
                       subtotal: selectedOrder.pricing?.rentalFee || selectedOrder.subtotal || 0
                     }
                   ]).map((item, idx) => {
                     const itemImage = selectedOrder.product?.images?.[0]?.url || selectedOrder.product?.images?.[0] || 'https://placehold.co/100x100?text=Dress';
                     return (
                       <tr style={{ borderBottom: '1px solid var(--border)' }} key={idx}>
                         <td style={{ padding: '12px' }}>
                           <img src={itemImage} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                         </td>
                         <td style={{ padding: '12px', fontWeight: '800' }}>{item.name}</td>
                         <td style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)' }}>{item.size || selectedOrder.size || 'N/A'} / {item.color || 'N/A'}</td>
                         <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                         <td style={{ padding: '12px', textAlign: 'right' }}>{money(item.rentalPricePerDay || selectedOrder.pricing?.rentalFee / (selectedOrder.pricing?.rentalDays || 1))} đ</td>
                         <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{money(item.subtotal)} đ</td>
                       </tr>
                     );
                   })}
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
                  <strong>{money(selectedOrder.pricing?.rentalFee || selectedOrder.subtotal)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Tiền cọc (trả lại):</span>
                  <strong>{money(selectedOrder.pricing?.depositFee || selectedOrder.depositAmount)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Phí phát sinh:</span>
                  <span style={{ color: 'var(--danger)' }}>+ {money((selectedOrder.pricing?.lateFee || 0) + (selectedOrder.pricing?.damageFee || 0) + (selectedOrder.pricing?.shippingFee || 0) || selectedOrder.extraFee || 0)} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Tổng hóa đơn:</span>
                  <strong style={{ color: 'var(--accent)' }}>{money(selectedOrder.pricing?.totalAmount || selectedOrder.totalAmount)} đ</strong>
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
              <button className="primary-button" type="submit">Gửi đánh giá</button>
            </div>
          </form>
        </div>
      )}

      {/* Dispute Modal Overlay (Renter) */}
      {disputingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!disputeReason) return;
            try {
              setError('');
              setSuccessMsg('');
              const { createDispute } = await import('../services/dispute.js');
              await createDispute({ 
                orderId: disputingOrder._id, 
                reason: disputeReason, 
                description: disputeDescription || 'Khách hàng báo cáo sự cố.', 
                requestedAmount: 0 
              });
              setSuccessMsg('Đã gửi khiếu nại thành công. Admin sẽ sớm liên hệ xử lý.');
              setDisputingOrder(null);
              loadOrders();
            } catch (err) {
              setError(err?.response?.data?.message || 'Lỗi khi gửi khiếu nại.');
            }
          }} className="card" style={{
            width: 'min(500px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative'
          }}>
            <button type="button" onClick={() => setDisputingOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px' }}>Tạo Khiếu nại</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Vui lòng cho biết lý do bạn muốn khiếu nại đơn hàng <strong>{disputingOrder._id.slice(-8)}</strong>. Admin sẽ xem xét và giải quyết.
            </p>

            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '800' }}>Lý do (Ngắn gọn)</label>
              <input 
                type="text" 
                placeholder="VD: Đồ rách, Shop không hoàn cọc..." 
                value={disputeReason} 
                onChange={(e) => setDisputeReason(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '800' }}>Mô tả chi tiết sự cố</label>
              <textarea 
                placeholder="Mô tả cụ thể sự việc đã xảy ra..." 
                value={disputeDescription} 
                onChange={(e) => setDisputeDescription(e.target.value)} 
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDisputingOrder(null)} className="secondary-button">Hủy</button>
              <button className="primary-button danger" type="submit">Gửi khiếu nại</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default OrderHistory;
