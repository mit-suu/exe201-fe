import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth.js';
import { createOrder } from '../../services/orders.js';
import { getProduct } from '../../services/products.js';
import { getProductReviews } from '../../services/reviews.js';
import { trackEvent } from '../../hooks/useAnalytics.js';
import { ANALYTICS_EVENTS, trackEvent as trackGAEvent } from '../../utils/analytics.js';
import { useCart } from '../../hooks/useCart.js';
import toast from 'react-hot-toast';
import { Palette, Sparkles, Package, Ruler, Calendar, MessageSquare, Store, Lock, Diamond, Banknote, ClipboardCheck, ShieldCheck, PackageCheck, MessageCircle, CheckCircle, XCircle, MapPin } from 'lucide-react';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const categoryLabels = {
  traditional: 'Truyền thống',
  wedding: 'Cưới hỏi',
  party: 'Dạ hội',
  cosplay: 'Cosplay',
  festival: 'Lễ hội',
};

const conditionLabels = {
  'New': 'Mới (New)',
  'Like New': 'Như mới (Like New)',
  'Good': 'Tốt (Good)',
  'Fair': 'Khá (Fair)',
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
  const { addToCart } = useCart();
  const user = getCurrentUser();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [form, setForm] = useState({ 
    size: '', 
    startDate: '', 
    endDate: '', 
    note: '', 
    paymentMethod: 'wallet',
    shippingAddress: user?.address || '',
    phone: user?.phone || ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    getProduct(id).then((item) => {
      setProduct(item);
      const parsedSizes = Array.isArray(item.sizes)
        ? item.sizes
        : typeof item.size === 'string'
          ? item.size.split(',').map(s => s.trim()).filter(Boolean)
          : (item.size ? [item.size] : []);
      setForm((old) => ({ ...old, size: old.size || parsedSizes[0] || '' }));
      trackEvent('VIEW_PRODUCT', `Xem sản phẩm: ${item.name}`, { productId: item._id, productName: item.name });
      trackGAEvent(ANALYTICS_EVENTS.VIEW_PRODUCT, {
        product_id: item._id,
        product_name: item.name,
        category: item.category?.name || item.category?.slug || item.category,
        price: item.rentalPrice,
      });
    });
    getProductReviews(id).then(setReviews).catch(() => setReviews([]));
  }, [id]);

  useEffect(() => { setImageLoaded(false); }, [activeImage]);

  const rentalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = (new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.ceil(diff) : 0;
  }, [form.startDate, form.endDate]);

  const costBreakdown = useMemo(() => {
    if (!product || !rentalDays) return null;
    const rental = product.rentalPrice * rentalDays;
    const deposit = product.depositPrice;
    const shipping = 0; // Đang tạm thời miễn phí vận chuyển
    return { rental, deposit, shipping, total: rental + deposit + shipping };
  }, [product, rentalDays]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      const result = await createOrder({ productId: id, ...form });
      trackGAEvent(ANALYTICS_EVENTS.SUBMIT_BOOKING, {
        product_id: product?._id || id,
        product_name: product?.name,
        rental_days: rentalDays,
        value: costBreakdown?.total || 0,
        currency: 'VND',
        payment_method: form.paymentMethod,
      });
      if (result.order?.payment?.checkoutUrl) {
        window.location.href = result.order.payment.checkoutUrl;
      } else {
        setMessage({ text: result.paymentMessage || 'Đã tạo đơn thuê thành công! Bạn thanh toán trực tiếp khi nhận trang phục.', type: 'success' });
      }
      setShowConfirmModal(false);
    } catch (err) {
      setMessage({ text: err?.response?.data?.message || 'Không tạo được đơn thuê. Vui lòng thử lại.', type: 'error' });
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  }, [id, form]);

  const handleAddToCart = () => {
    const isSizeRequired = Array.isArray(product.sizes) ? product.sizes.length > 0 : !!product.size;
    if (isSizeRequired && !form.size) {
      toast.error('Vui lòng chọn size trước khi thêm vào giỏ hàng.');
      return;
    }
    
    addToCart({
      product,
      size: form.size,
      startDate: form.startDate,
      endDate: form.endDate,
      rentalDays,
      totalAmount: costBreakdown?.total || 0,
      depositFee: costBreakdown?.deposit || 0
    });
    trackEvent('ADD_TO_CART', 'Thêm vào giỏ hàng', { productId: product._id, productName: product.name });
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.shippingAddress || !form.phone) {
      setMessage({ text: 'Vui lòng điền đầy đủ Địa chỉ và Số điện thoại.', type: 'error' });
      return;
    }
    trackGAEvent(ANALYTICS_EVENTS.CLICK_RENT, {
      product_id: product._id,
      product_name: product.name,
      rental_days: rentalDays,
      value: costBreakdown?.total || 0,
      currency: 'VND',
    });
    setShowConfirmModal(true);
  };

  if (!product) {
    return (
      <div className="pd-loading">
        <div className="pd-loading-spinner" />
        <span>Đang tải thông tin sản phẩm...</span>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map(img => typeof img === 'string' ? img : img?.url).filter(Boolean)
    : ['https://placehold.co/900x620?text=BuildLab'];
  const status = statusConfig[product.status] || statusConfig.available;
  const shopData = product.lender || {};
  const shopName = shopData.lenderName || 'Shop';

  const availableSizes = Array.isArray(product.sizes)
    ? product.sizes
    : typeof product.size === 'string'
      ? product.size.split(',').map(s => s.trim()).filter(Boolean)
      : (product.size ? [product.size] : []);

  const stockQuantity = product.inventory?.quantityTotal ?? product.stockQuantity ?? 1;

  return (
    <div className="pd-page">
      {/* Breadcrumb */}
      <nav className="pd-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <Link to="/products">Trang phục</Link>
        <span className="pd-breadcrumb-sep">›</span>
        <Link to={`/products?category=${product.category?.slug || product.category}`}>{product.category?.name || categoryLabels[product.category?.slug || product.category] || product.category?.slug || product.category}</Link>
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
                  onClick={() => setShowLightbox(true)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div className="pd-image-status" style={{ background: status.bg, color: status.color }}>
                <span className="pd-status-dot" style={{ background: status.color }} />
                {status.label}
              </div>
              <div className="pd-image-category">
                {product.category?.name || categoryLabels[product.category?.slug || product.category] || product.category?.slug || product.category}
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
                <span className="pd-attr-icon"><Palette size={18} strokeWidth={1.5} /></span>
                <div>
                  <span className="pd-attr-label">Màu sắc</span>
                  <span className="pd-attr-value">{product.color || 'Đa dạng'}</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon"><Sparkles size={18} strokeWidth={1.5} /></span>
                <div>
                  <span className="pd-attr-label">Tình trạng</span>
                  <span className="pd-attr-value">{conditionLabels[product.condition] || product.condition}</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon"><Package size={18} strokeWidth={1.5} /></span>
                <div>
                   <span className="pd-attr-label">Tồn kho</span>
                   <span className="pd-attr-value">{stockQuantity} bộ</span>
                </div>
              </div>
              <div className="pd-attr">
                <span className="pd-attr-icon"><Ruler size={18} strokeWidth={1.5} /></span>
                <div>
                   <span className="pd-attr-label">Size có sẵn</span>
                   <div className="pd-size-chips">
                     {availableSizes.map((s) => (
                       <span key={s} className="pd-size-chip">{s}</span>
                     ))}
                     {availableSizes.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Freesize</span>}
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
                    {shopData.isVerified && <span className="pd-verified-badge" style={{ display: 'inline-flex', alignItems: 'center', background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}><CheckCircle size={12} style={{ color: '#6b7280' }} /></span>}
                  </h3>
                  {shopData.lenderDescription && (
                    <p className="pd-shop-bio">{shopData.lenderDescription}</p>
                  )}
                </div>
              </div>
              <div className="pd-shop-stats">
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value">{shopData.rating?.count || 0}</span>
                  <span className="pd-shop-stat-label">Đánh giá</span>
                </div>
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shopData.isVerified ? <CheckCircle size={16} style={{ color: '#6b7280' }} /> : <XCircle size={16} style={{ color: '#6b7280' }} />}
                  </span>
                  <span className="pd-shop-stat-label">Xác minh</span>
                </div>
                <div className="pd-shop-stat">
                  <span className="pd-shop-stat-value">{shopData.autoApprove ? 'Tự động' : 'Thủ công'}</span>
                  <span className="pd-shop-stat-label">Duyệt đơn</span>
                </div>
              </div>

              {/* OpenStreetMap Location */}
              {shopData.googleMapsEmbedUrl && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <MapPin size={16} style={{ color: 'var(--accent)' }} /> 
                    Vị trí cửa hàng
                  </h4>
                  {shopData.location?.formattedAddress && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 12px', lineHeight: '1.4' }}>
                      {shopData.location.formattedAddress}
                    </p>
                  )}
                  <iframe
                    title="Bản đồ vị trí shop"
                    src={shopData.googleMapsEmbedUrl}
                    width="100%"
                    height="200"
                    style={{ border: 0, borderRadius: '10px', background: 'var(--surface-soft)' }}
                    allowFullScreen=""
                    loading="lazy"
                  />
                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <a 
                      href={shopData.googleMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      Xem trên OpenStreetMap &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Busy Dates */}
          {product.unavailableDates?.length > 0 && (
            <div className="pd-busy-card">
              <div className="pd-busy-header">
                <span className="pd-busy-icon"><Calendar size={22} strokeWidth={1.5} /></span>
                <div>
                  <h3>Lịch bận của trang phục này</h3>
                  <p>Các ngày dưới đây trang phục đã được đặt trước, bạn vui lòng chọn ngày khác.</p>
                </div>
              </div>
              <div className="pd-busy-list">
                {product.unavailableDates.map((range, idx) => (
                  <div key={idx} className="pd-busy-item">
                    <div className="pd-busy-dates">
                      <span>{new Date(range.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      <span className="pd-busy-arrow">→</span>
                      <span>{new Date(range.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                    <span className="pd-busy-note">{range.reason || range.note || 'Đã được đặt giữ lịch'}</span>
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
                <span style={{ display: 'inline-block', marginBottom: '8px', color: 'var(--muted)' }}><MessageSquare size={32} strokeWidth={1} /></span>
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
                        <strong><Store size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} /> Phản hồi từ shop</strong>
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
                <span className="pd-price-amount">{money(product.rentalPrice)}đ</span>
                <span className="pd-price-unit">/ ngày</span>
              </div>
              <p className="pd-price-deposit">Đặt cọc: <strong>{money(product.depositPrice)}đ</strong></p>
            </div>

            {!user ? (
              <div className="pd-login-prompt">
                <span className="pd-login-icon"><Lock size={28} strokeWidth={1} style={{ color: 'var(--muted)' }} /></span>
                <p>Bạn cần đăng nhập để đặt thuê trang phục</p>
                <Link to="/login" className="primary-button pd-login-btn">Đăng nhập ngay</Link>
              </div>
            ) : (
              <form className="pd-booking-form" onSubmit={handleFormSubmit}>
                {/* User Info Fields */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Thông tin giao nhận</span>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Số điện thoại người nhận" 
                      required 
                      value={form.phone} 
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--text)' }}
                    />
                    <input 
                      type="text" 
                      placeholder="Địa chỉ nhận hàng (Ví dụ: 123 Đường A, Quận B, TP HCM)" 
                      required 
                      value={form.shippingAddress} 
                      onChange={(e) => setForm({...form, shippingAddress: e.target.value})}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="pd-form-group">
                  <span className="pd-form-label">Chọn Size</span>
                  <div className="pd-size-selector">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`pd-size-btn${form.size === s ? ' active' : ''}`}
                        onClick={() => setForm({ ...form, size: s })}
                      >
                        {s}
                      </button>
                    ))}
                    {availableSizes.length === 0 && (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Không cần chọn size (Freesize)</span>
                    )}
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
                        value={form.startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 750 }}>Ngày trả</label>
                      <input
                        type="date"
                        required
                        value={form.endDate}
                        min={form.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                {costBreakdown && (
                  <div className="pd-cost-breakdown">
                    <div className="pd-cost-line">
                      <span>{money(product.rentalPrice)}đ × {rentalDays} ngày</span>
                      <span>{money(costBreakdown.rental)}đ</span>
                    </div>
                    <div className="pd-cost-line">
                      <span>Tiền cọc</span>
                      <span>{money(costBreakdown.deposit)}đ</span>
                    </div>
                    <div className="pd-cost-line">
                      <span>Phí vận chuyển (2 chiều)</span>
                      <span>{money(costBreakdown.shipping)}đ</span>
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
                    <label className={`pd-payment-option${form.paymentMethod === 'wallet' ? ' active' : ''}`}>
                      <input type="radio" name="paymentMethod" value="wallet" checked={form.paymentMethod === 'wallet'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                      <span className="pd-payment-icon"><Diamond size={20} strokeWidth={1.5} /></span>
                      <div>
                        <span className="pd-payment-name">Ví nội bộ (BuildLab Wallet)</span>
                        <small>An toàn, nhanh chóng & bảo vệ tiền cọc</small>
                      </div>
                    </label>
                    <label className={`pd-payment-option${form.paymentMethod === 'cash' ? ' active' : ''}`}>
                      <input type="radio" name="paymentMethod" value="cash" checked={form.paymentMethod === 'cash'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                      <span className="pd-payment-icon"><Banknote size={20} strokeWidth={1.5} /></span>
                      <div>
                        <span className="pd-payment-name">Tiền mặt</span>
                        <small>Thanh toán khi nhận trang phục</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleAddToCart()}
                    style={{ padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >
                    <Package size={18} strokeWidth={2} /> Thêm vào giỏ
                  </button>
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
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <ClipboardCheck size={18} strokeWidth={2} style={{ marginRight: 8 }} /> Tạo đơn thuê
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {message.text && (
              <div className={`pd-message ${message.type}`}>
                <span>{message.type === 'success' ? <CheckCircle size={18} strokeWidth={2} /> : <XCircle size={18} strokeWidth={2} />}</span>
                <p>{message.text}</p>
              </div>
            )}

            <div className="pd-trust-badges">
              <div className="pd-trust-badge">
                <span><ShieldCheck size={20} strokeWidth={1.5} /></span>
                <span>Hoàn tiền cọc khi trả đúng hạn</span>
              </div>
              <div className="pd-trust-badge">
                <span><PackageCheck size={20} strokeWidth={1.5} /></span>
                <span>Kiểm tra chất lượng trước khi giao</span>
              </div>
              <div className="pd-trust-badge">
                <span><MessageCircle size={20} strokeWidth={1.5} /></span>
                <span>Hỗ trợ khách hàng 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Xác nhận Đơn thuê</h2>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            
            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: 'var(--surface-soft)', borderRadius: '12px' }}>
                <img src={images[0]} alt={product.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{product.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Size: {form.size} | {rentalDays} ngày</span>
                </div>
              </div>

              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--muted)' }}>Thông tin Giao nhận</h4>
              <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Người nhận:</strong> {user?.fullName || 'Khách hàng'}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Số điện thoại:</strong> {form.phone}</p>
                <p style={{ margin: 0 }}><strong>Địa chỉ:</strong> {form.shippingAddress}</p>
              </div>

              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--muted)' }}>Mã giảm giá</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponDiscount(0); setCouponMsg(''); }} placeholder="Nhập mã giảm giá" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                <button disabled={checkingCoupon || !couponCode} onClick={async () => {
                  try {
                    setCheckingCoupon(true);
                    const res = await (await import('../../services/api.js')).default.post('/coupons/validate', { code: couponCode, orderTotal: costBreakdown?.total || 0 });
                    setCouponDiscount(res.data.data.discount);
                    setCouponMsg(`Giảm ${money(res.data.data.discount)} đ`);
                  } catch (err) {
                    setCouponDiscount(0);
                    setCouponMsg(err?.response?.data?.message || 'Mã không hợp lệ');
                  } finally { setCheckingCoupon(false); }
                }} className="button" style={{ minWidth: '80px' }}>{checkingCoupon ? '...' : 'Áp dụng'}</button>
              </div>
              {couponMsg && <p style={{ fontSize: '0.85rem', marginTop: '-12px', marginBottom: '16px', color: couponDiscount > 0 ? 'var(--success)' : 'var(--danger)' }}>{couponMsg}</p>}

              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--muted)' }}>Chi tiết Thanh toán</h4>
              <div style={{ background: 'var(--surface-soft)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>Tiền thuê</span>
                  <strong>{money(costBreakdown?.rental)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>Tiền cọc</span>
                  <strong>{money(costBreakdown?.deposit)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>Phí vận chuyển</span>
                  <strong>Miễn phí</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed var(--border)', marginTop: '12px' }}>
                  <strong>Tổng cộng</strong>
                  <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{money((costBreakdown?.total || 0) - couponDiscount)} đ</strong>
                </div>
                {couponDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)', marginTop: '4px' }}>
                  <span>Giảm giá (mã)</span>
                  <strong>-{money(couponDiscount)} đ</strong>
                </div>}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Bằng việc bấm Xác nhận, bạn đồng ý với các điều khoản thuê đồ và quy định trừ cọc của nền tảng nếu xảy ra hư hỏng.
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'var(--surface-soft)' }}>
              <button 
                className="button" 
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button 
                className="primary-button" 
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận & Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox fullscreen với zoom */}
      {showLightbox && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', userSelect: 'none'
        }}>
          <button onClick={() => { setShowLightbox(false); setZoomLevel(1); }}
            style={{ position: 'absolute', top: '16px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer', zIndex: 10000, width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >&times;</button>


          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', zIndex: 10000 }}>{activeImage + 1} / {images.length}</div>

          {images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveImage(a => (a === 0 ? images.length - 1 : a - 1)); setZoomLevel(1); }}
              style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10000, width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >&lsaquo;</button>
          )}

          <div
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              e.currentTarget.style.backgroundSize = '250%';
              e.currentTarget.style.backgroundPosition = `${x}% ${y}%`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundSize = '100%';
              e.currentTarget.style.backgroundPosition = '50% 50%';
            }}
            onClick={(e) => {
              if (zoomLevel === 1) { setShowLightbox(false); return; }
            }}
            onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
            style={{
              position: 'relative', overflow: 'hidden', borderRadius: '12px',
              width: '90vw', maxWidth: '700px', height: '70vh', maxHeight: '600px',
              cursor: 'crosshair',
              backgroundImage: `url(${images[activeImage]})`,
              backgroundSize: '100%',
              backgroundPosition: '50% 50%',
              backgroundRepeat: 'no-repeat',
              transition: 'background-size 0.15s ease'
            }}
          ></div>

          {images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveImage(a => (a === images.length - 1 ? 0 : a + 1)); setZoomLevel(1); }}
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 10000, width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >&rsaquo;</button>
          )}

        </div>
      )}
    </div>
  );
};

export default ProductDetail;

