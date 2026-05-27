import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.js';
import { createOrder } from '../services/orders.js';
import { getProduct } from '../services/products.js';
import { getProductReviews } from '../services/reviews.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const categoryLabels = {
  traditional: 'Truyền thống',
  wedding: 'Cưới hỏi',
  party: 'Dạ hội',
  cosplay: 'Cosplay',
  festival: 'Lễ hội',
};

const conditionLabels = {
  excellent: 'Xuất sắc',
  good: 'Tốt',
  fair: 'Khá',
};

const statusConfig = {
  available: { label: 'Có sẵn', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  rented: { label: 'Đang cho thuê', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  maintenance: { label: 'Bảo trì', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
};

const StarRating = ({ rating, size = 16 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i;
    const half = !filled && rating >= i - 0.5;
    stars.push(
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#f59e0b' : half ? 'url(#half)' : '#e2e8f0'} stroke="none">
        {half && (
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
        )}
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  return <span className="pd-stars">{stars}</span>;
};

const ProductDetail = () => {
  const { id } = useParams();
  const user = getCurrentUser();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [form, setForm] = useState({ size: '', rentalStartDate: '', rentalEndDate: '', note: '', paymentMethod: 'cash' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProduct(id).then((item) => {
      setProduct(item);
      setForm((old) => ({ ...old, size: item.sizes?.[0] || '' }));
    });
    getProductReviews(id).then(setReviews).catch(() => setReviews([]));
  }, [id]);

  useEffect(() => { setImageLoaded(false); }, [activeImage]);

  const rentalDays = useMemo(() => {
    if (!form.rentalStartDate || !form.rentalEndDate) return 0;
    const diff = (new Date(form.rentalEndDate) - new Date(form.rentalStartDate)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.ceil(diff) : 0;
  }, [form.rentalStartDate, form.rentalEndDate]);

  const costBreakdown = useMemo(() => {
    if (!product || !rentalDays) return null;
    const rental = product.rentalPricePerDay * rentalDays;
    const deposit = product.depositAmount;
    return { rental, deposit, total: rental + deposit };
  }, [product, rentalDays]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const submit = useCallback(async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await createOrder({ productId: id, ...form });
      if (result.order?.payment?.checkoutUrl) {
        window.location.href = result.order.payment.checkoutUrl;
      } else {
        setMessage({ text: result.paymentMessage || 'Đã tạo đơn thuê thành công! Bạn thanh toán trực tiếp khi nhận trang phục.', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err?.response?.data?.message || 'Không tạo được đơn thuê. Vui lòng thử lại.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [id, form]);

  if (!product) {
    return (
      <div className="pd-loading">
        <div className="pd-loading-spinner" />
        <span>Đang tải thông tin sản phẩm...</span>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ['https://placehold.co/900x620?text=BuildLab'];
  const status = statusConfig[product.status] || statusConfig.available;
  const shopData = product.shop || {};
  const shopName = shopData.fullName || 'Shop';

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <nav className="pd-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <Link to="/products">Trang phục</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <Link to={`/products?category=${product.category}`}>{categoryLabels[product.category] || product.category}</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <span className="pd-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="pd-main">
        {/* LEFT COLUMN */}
        <div className="pd-left">
          {/* Image Gallery */}
          <div className="pd-gallery">
            <div className="pd-gallery-main">
              <div className={`pd-image-wrapper${imageLoaded ? ' loaded' : ''}`}>
                <img
                  className="pd-main-image"
                  src={images[activeImage]}
                  alt={product.name}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
              <div className="pd-image-status" style={{ background: status.bg, color: status.color }}>
                <span className="pd-status-dot" style={{ background: status.color }} />
                {status.label}
              </div>
              <div className="pd-image-category">
                {categoryLabels[product.category] || product.category}
              </div>
            </div>
            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`pd-thumb${idx === activeImage ? ' active' : ''}`}
                    onClick={() => setActiveImage(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Card */}
          <div className="pd-info-card">
            <div className="pd-info-header">
              <h1 className="pd-title">{product.name}</h1>
              <div className="pd-rating-summary">
                <StarRating rating={Number(avgRating)} size={18} />
                <span className="pd-rating-value">{avgRating > 0 ? avgRating : '—'}</span>
                <span className="pd-rating-count">({reviews.length} đánh giá)</span>
              </div>
            </div>

            <p className="pd-description">{product.description}</p>

            {product.tags?.length > 0 && (
              <div className="pd-tags">
                {product.tags.map((tag) => (
                  <span key={tag} className="pd-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="pd-attributes">
              <div className="pd-attr">
                <span className="pd-attr-icon">🎨</span>
                <div>
                  <span className="pd-attr-label">Màu sắc</span>
                  <span className="pd-attr-value">{product.color || 'Đa dạng'}</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon">✨</span>
                <div>
                  <span className="pd-attr-label">Tình trạng</span>
                  <span className="pd-attr-value">{conditionLabels[product.condition] || product.condition}</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon">📦</span>
                <div>
                  <span className="pd-attr-label">Tồn kho</span>
                  <span className="pd-attr-value">{product.stockQuantity} bộ</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon">📐</span>
                <div>
                  <span className="pd-attr-label">Size có sẵn</span>
                  <div className="pd-size-chips">
                    {product.sizes?.map((s) => (
                      <span key={s} className="pd-size-chip">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Card */}
          {shopData._id && (
            <div className="pd-shop-card">
              <div className="pd-shop-header">
                <div className="pd-shop-avatar">{shopName.charAt(0)}</div>
                <div>
                  <h3 className="pd-shop-name">
                    {shopName}
                    {shopData.lenderProfile?.isVerified && <span className="pd-verified-badge">✓</span>}
                  </h3>
                  {shopData.lenderProfile?.bio && (
                    <p className="pd-shop-bio">{shopData.lenderProfile.bio}</p>
                  )}
                </div>
              </div>
              <div className="pd-shop-stats">
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value">{shopData.lenderProfile?.reviewCount || 0}</span>
                  <span className="pd-shop-stat-label">Đánh giá</span>
                </div>
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value">{shopData.lenderProfile?.isVerified ? '✓' : '✗'}</span>
                  <span className="pd-shop-stat-label">Xác minh</span>
                </div>
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value">{shopData.lenderProfile?.autoApprove ? 'Tự động' : 'Thủ công'}</span>
                  <span className="pd-shop-stat-label">Duyệt đơn</span>
                </div>
              </div>
            </div>
          )}

          {/* Busy Dates */}
          {product.busyDates?.length > 0 && (
            <div className="pd-busy-card">
              <div className="pd-busy-header">
                <span className="pd-busy-icon">📅</span>
                <div>
                  <h3>Lịch bận của trang phục này</h3>
                  <p>Các ngày dưới đây trang phục đã được đặt trước, bạn vui lòng chọn ngày khác.</p>
                </div>
              </div>
              <div className="pd-busy-list">
                {product.busyDates.map((range, idx) => (
                  <div key={idx} className="pd-busy-item">
                    <div className="pd-busy-dates">
                      <span>{new Date(range.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      <span className="pd-busy-arrow">→</span>
                      <span>{new Date(range.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                    <span className="pd-busy-note">{range.note || 'Đã được đặt giữ lịch'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="pd-reviews-card">
            <div className="pd-reviews-header">
              <h2>Đánh giá từ khách hàng</h2>
              {reviews.length > 0 && (
                <div className="pd-reviews-summary">
                  <span className="pd-reviews-avg">{avgRating}</span>
                  <div>
                    <StarRating rating={Number(avgRating)} size={16} />
                    <span className="pd-reviews-total">{reviews.length} đánh giá</span>
                  </div>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="pd-reviews-empty">
                <span>💬</span>
                <p>Chưa có đánh giá nào</p>
                <small>Hãy là người đầu tiên đánh giá sản phẩm này</small>
              </div>
            ) : (
              <div className="pd-reviews-list">
                {reviews.map((review) => (
                  <div key={review._id} className="pd-review-item">
                    <div className="pd-review-top">
                      <div className="pd-review-author">
                        <div className="pd-review-avatar">
                          {(review.reviewer?.fullName || 'K').charAt(0)}
                        </div>
                        <div>
                          <strong>{review.reviewer?.fullName || 'Khách hàng'}</strong>
                          <span className="pd-review-date">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={15} />
                    </div>

                    {review.comment && <p className="pd-review-comment">{review.comment}</p>}

                    {review.subRatings && (
                      <div className="pd-review-sub-ratings">
                        {review.subRatings.quality && <span>Chất lượng: <b>{'⭐'.repeat(review.subRatings.quality)}</b></span>}
                        {review.subRatings.accuracy && <span>Đúng mô tả: <b>{'⭐'.repeat(review.subRatings.accuracy)}</b></span>}
                        {review.subRatings.delivery && <span>Giao hàng: <b>{'⭐'.repeat(review.subRatings.delivery)}</b></span>}
                        {review.subRatings.sizeAccuracy && <span>Đúng size: <b>{'⭐'.repeat(review.subRatings.sizeAccuracy)}</b></span>}
                      </div>
                    )}

                    {review.reply?.content && (
                      <div className="pd-review-reply">
                        <strong>🏪 Phản hồi từ shop</strong>
                        <p>{review.reply.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Booking */}
        <div className="pd-right">
          <div className="pd-booking-card">
            <div className="pd-price-block">
              <div className="pd-price-main">
                <span className="pd-price-amount">{money(product.rentalPricePerDay)}đ</span>
                <span className="pd-price-unit">/ ngày</span>
              </div>
              <p className="pd-price-deposit">Đặt cọc: <strong>{money(product.depositAmount)}đ</strong></p>
            </div>

            {!user ? (
              <div className="pd-login-prompt">
                <span className="pd-login-icon">🔐</span>
                <p>Bạn cần đăng nhập để đặt thuê trang phục</p>
                <Link to="/login" className="primary-button pd-login-btn">Đăng nhập ngay</Link>
              </div>
            ) : (
              <form className="pd-booking-form" onSubmit={submit}>
                {/* Size */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Chọn Size</span>
                  <div className="pd-size-selector">
                    {product.sizes?.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`pd-size-btn${form.size === s ? ' active' : ''}`}
                        onClick={() => setForm({ ...form, size: s })}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Thời gian thuê</span>
                  <div className="pd-form-dates">
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 750 }}>Ngày nhận</label>
                      <input
                        type="date"
                        required
                        value={form.rentalStartDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({ ...form, rentalStartDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 750 }}>Ngày trả</label>
                      <input
                        type="date"
                        required
                        value={form.rentalEndDate}
                        min={form.rentalStartDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({ ...form, rentalEndDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                {costBreakdown && (
                  <div className="pd-cost-breakdown">
                    <div className="pd-cost-line">
                      <span>{money(product.rentalPricePerDay)}đ × {rentalDays} ngày</span>
                      <span>{money(costBreakdown.rental)}đ</span>
                    </div>
                    <div className="pd-cost-line">
                      <span>Tiền cọc</span>
                      <span>{money(costBreakdown.deposit)}đ</span>
                    </div>
                    <div className="pd-cost-total">
                      <span>Tổng cộng</span>
                      <span>{money(costBreakdown.total)}đ</span>
                    </div>
                  </div>
                )}

                {/* Note */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Ghi chú <small>(tùy chọn)</small></span>
                  <textarea
                    placeholder="Yêu cầu đặc biệt, thời gian nhận cụ thể..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    style={{ minHeight: '72px' }}
                  />
                </div>

                {/* Payment */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Phương thức thanh toán</span>
                  <div className="pd-payment-options">
                    <label className={`pd-payment-option${form.paymentMethod === 'cash' ? ' active' : ''}`}>
                      <input type="radio" name="paymentMethod" value="cash" checked={form.paymentMethod === 'cash'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                      <span className="pd-payment-icon">💵</span>
                      <div>
                        <span className="pd-payment-name">Tiền mặt</span>
                        <small>Thanh toán khi nhận trang phục</small>
                      </div>
                    </label>
                    <label className={`pd-payment-option${form.paymentMethod === 'stripe' ? ' active' : ''}`}>
                      <input type="radio" name="paymentMethod" value="stripe" checked={form.paymentMethod === 'stripe'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                      <span className="pd-payment-icon">💳</span>
                      <div>
                        <span className="pd-payment-name">Stripe Checkout</span>
                        <small>Thanh toán online bằng thẻ</small>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="pd-submit-btn"
                  disabled={submitting || !rentalDays}
                >
                  {submitting ? (
                    <span className="pd-btn-loading">
                      <span className="pd-loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      Đang xử lý...
                    </span>
                  ) : form.paymentMethod === 'stripe' ? '💳 Thanh toán với Stripe' : '📋 Tạo đơn thuê'}
                </button>
              </form>
            )}

            {message.text && (
              <div className={`pd-message ${message.type}`}>
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                <p>{message.text}</p>
              </div>
            )}

            <div className="pd-trust-badges">
              <div className="pd-trust-badge">
                <span>🛡️</span>
                <span>Hoàn tiền cọc khi trả đúng hạn</span>
              </div>
              <div className="pd-trust-badge">
                <span>📦</span>
                <span>Kiểm tra chất lượng trước khi giao</span>
              </div>
              <div className="pd-trust-badge">
                <span>💬</span>
                <span>Hỗ trợ khách hàng 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
