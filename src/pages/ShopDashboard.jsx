import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { listShopProducts, createProduct, updateProduct, deleteProduct } from '../services/products.js';
import { getShopOrders, getShopRevenue, updateOrderStatus } from '../services/orders.js';
import { getShopReviews, replyToReview } from '../services/reviews.js';
import { getMyNotifications, markNotificationRead } from '../services/notifications.js';
import { updateProfile } from '../services/profile.js';
import { clearSession } from '../services/auth.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A';

const emptyProduct = {
  name: '',
  category: 'party',
  description: '',
  rentalPricePerDay: '',
  depositAmount: '',
  sizes: 'S,M,L',
  color: '',
  images: '',
  stockQuantity: 1,
  condition: 'excellent',
  status: 'available',
  busyDates: []
};

const ShopDashboard = ({ tab = 'dashboard', user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab);

  // States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenueStats, setRevenueStats] = useState({
    dailyRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    successfulOrders: 0,
    cancelledOrders: 0,
    topProducts: []
  });
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: user?.lenderProfile?.bio || '',
    logoUrl: user?.lenderProfile?.logoUrl || '',
    address: user?.lenderProfile?.address || '',
    phone: user?.lenderProfile?.phone || '',
    rentalPolicy: user?.lenderProfile?.rentalPolicy || '',
    latePenaltyPolicy: user?.lenderProfile?.latePenaltyPolicy || ''
  });

  // UI state
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newBusyDate, setNewBusyDate] = useState({ startDate: '', endDate: '', note: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState({});

  // Sync route tab change to state
  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  // Load all shop related data
  const loadData = async () => {
    try {
      const [prodData, ordData, revData, revsData, notifData] = await Promise.all([
        listShopProducts(),
        getShopOrders(),
        getShopRevenue(),
        getShopReviews(),
        getMyNotifications()
      ]);
      setProducts(prodData?.items || []);
      setOrders(ordData || []);
      if (revData) setRevenueStats(revData);
      setReviews(revsData || []);
      setNotifications(notifData || []);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu cửa hàng.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers
  const lowInventoryProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity < 2);
  }, [products]);

  const allBusyDates = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.busyDates && p.busyDates.length > 0) {
        p.busyDates.forEach(bd => {
          list.push({ ...bd, productName: p.name, productId: p._id });
        });
      }
    });
    return list;
  }, [products]);

  // Handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      
      const payload = {
        ...productForm,
        rentalPricePerDay: Number(productForm.rentalPricePerDay),
        depositAmount: Number(productForm.depositAmount || 0),
        stockQuantity: Number(productForm.stockQuantity || 1),
        sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        images: productForm.images.split('\n').map(u => u.trim()).filter(Boolean)
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setMessage('Đã cập nhật trang phục thành công.');
      } else {
        await createProduct(payload);
        setMessage('Đã thêm trang phục mới thành công.');
      }

      setProductForm(emptyProduct);
      setEditingProductId(null);
      setShowProductForm(false);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể lưu trang phục.');
    }
  };

  const handleProductEdit = (product) => {
    setProductForm({
      name: product.name || '',
      category: product.category || 'party',
      description: product.description || '',
      rentalPricePerDay: product.rentalPricePerDay || '',
      depositAmount: product.depositAmount || '',
      sizes: Array.isArray(product.sizes) ? product.sizes.join(',') : product.sizes || 'S,M,L',
      color: product.color || '',
      images: Array.isArray(product.images) ? product.images.join('\n') : product.images || '',
      stockQuantity: product.stockQuantity || 1,
      condition: product.condition || 'excellent',
      status: product.status || 'available',
      busyDates: product.busyDates || []
    });
    setEditingProductId(product._id);
    setShowProductForm(true);
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn ẩn trang phục này khỏi cửa hàng không?')) return;
    try {
      setMessage('');
      setError('');
      await deleteProduct(id);
      setMessage('Đã ẩn sản phẩm thành công.');
      loadData();
    } catch (err) {
      setError('Lỗi khi ẩn sản phẩm.');
    }
  };

  const handleAddBusyDate = async (productId) => {
    if (!newBusyDate.startDate || !newBusyDate.endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    const product = products.find(p => p._id === productId);
    if (!product) return;

    try {
      const updatedBusy = [...(product.busyDates || []), {
        startDate: new Date(newBusyDate.startDate),
        endDate: new Date(newBusyDate.endDate),
        note: newBusyDate.note || 'Lịch bận'
      }];

      await updateProduct(productId, { busyDates: updatedBusy });
      setNewBusyDate({ startDate: '', endDate: '', note: '' });
      setMessage('Đã cập nhật lịch bận cho trang phục.');
      loadData();
    } catch (err) {
      setError('Không thể cập nhật lịch bận.');
    }
  };

  const handleRemoveBusyDate = async (productId, idx) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    try {
      const updatedBusy = (product.busyDates || []).filter((_, i) => i !== idx);
      await updateProduct(productId, { busyDates: updatedBusy });
      setMessage('Đã xóa lịch bận thành công.');
      loadData();
    } catch (err) {
      setError('Không thể cập nhật lịch bận.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setMessage('');
      setError('');
      await updateOrderStatus(orderId, newStatus);
      setMessage('Đã cập nhật trạng thái đơn đặt.');
      if (selectedOrder) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn đặt.');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;
    try {
      await replyToReview(reviewId, text);
      setMessage('Đã gửi phản hồi đánh giá.');
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      loadData();
    } catch (err) {
      setError('Lỗi gửi phản hồi.');
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      
      const payload = {
        fullName: profileForm.fullName,
        lenderProfile: {
          bio: profileForm.bio,
          logoUrl: profileForm.logoUrl,
          address: profileForm.address,
          phone: profileForm.phone,
          rentalPolicy: profileForm.rentalPolicy,
          latePenaltyPolicy: profileForm.latePenaltyPolicy
        }
      };

      const updatedUser = await updateProfile(payload);
      localStorage.setItem('exe201-user', JSON.stringify(updatedUser));
      setMessage('Đã cập nhật thông tin cửa hàng thành công.');
      loadData();
    } catch (err) {
      setError('Lỗi cập nhật thông tin.');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
    window.location.reload();
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Báo Cáo Doanh Thu Shop - BuildLab</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; border-bottom: 1px solid #cbd5e1; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Báo Cáo Doanh Thu Cửa Hàng - BuildLab</h1>
          <div class="grid">
            <div class="card">
              <h3>Tổng quan tài chính</h3>
              <p>Tổng doanh thu: <strong>${money(revenueStats.totalRevenue)} đ</strong></p>
              <p>Doanh thu tháng này: <strong>${money(revenueStats.monthlyRevenue)} đ</strong></p>
              <p>Doanh thu hôm nay: <strong>${money(revenueStats.dailyRevenue)} đ</strong></p>
            </div>
            <div class="card">
              <h3>Chỉ số hoạt động</h3>
              <p>Số đơn thành công: <strong>${revenueStats.successfulOrders}</strong></p>
              <p>Số đơn bị hủy: <strong>${revenueStats.cancelledOrders}</strong></p>
            </div>
          </div>
          <h3>Top trang phục được thuê nhiều nhất</h3>
          <table>
            <thead>
              <tr>
                <th>Tên trang phục</th>
                <th>Số lượt thuê</th>
              </tr>
            </thead>
            <tbody>
              ${revenueStats.topProducts.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.count} lượt</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top:40px; color:#64748b; font-size:12px; text-align:center;">
            Xuất báo cáo vào lúc: ${new Date().toLocaleString('vi-VN')} • Bản quyền thuộc hệ thống BuildLab
          </p>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: '▦' },
    { id: 'costumes', label: 'Trang phục của tôi', icon: '◇' },
    { id: 'orders', label: 'Quản lý đơn thuê', icon: '☰' },
    { id: 'revenue', label: 'Doanh thu & Thống kê', icon: '💰' },
    { id: 'profile', label: 'Thông tin cửa hàng', icon: '🏬' },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: '★' },
    { id: 'notifications', label: 'Thông báo', icon: '🔔' }
  ];

  return (
    <div className="admin-shell" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <aside className="admin-sidebar" style={{ background: 'var(--primary-strong)' }}>
        <div className="admin-sidebar-brand" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {profileForm.logoUrl ? (
            <img src={profileForm.logoUrl} alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover' }} />
          ) : (
            <span className="logo-mark" aria-hidden="true"><span className="logo-hanger"></span></span>
          )}
          <div>
            <strong style={{ fontSize: '1rem' }}>{profileForm.fullName || 'My Shop'}</strong>
            <small style={{ color: 'var(--muted)' }}>Shop Portal</small>
          </div>
        </div>

        <nav className="admin-menu">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              className={`admin-menu-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => { setActiveTab(item.id); navigate(`/shop/${item.id}`); }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'notifications' && notifications.filter(n => !n.isRead).length > 0 && (
                <span style={{ 
                  marginLeft: 'auto', 
                  background: 'var(--danger)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'grid', 
                  placeItems: 'center',
                  fontSize: '0.7rem',
                  fontWeight: '900'
                }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button className="admin-menu-item admin-logout-button" onClick={handleLogout}>
          <span>↩</span>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-content">
        <section className="card admin-hero-card" style={{ background: 'white' }}>
          <div>
            <p className="eyebrow">Cửa hàng BuildLab</p>
            <h1>{menuItems.find(item => item.id === activeTab)?.label}</h1>
            <p>Quản lý trang phục cho thuê, theo dõi trạng thái giao nhận đơn thuê và thiết lập chính sách bán hàng.</p>
          </div>
        </section>

        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert">{error}</div>}

        {/* ── SUB-PAGE 1: OVERVIEW DASHBOARD ────────────────── */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <section className="admin-stat-grid">
              <article className="order-summary-card">
                <strong>{money(revenueStats.totalRevenue)} đ</strong>
                <span>Tổng doanh thu</span>
              </article>
              <article className="order-summary-card">
                <strong>{revenueStats.successfulOrders}</strong>
                <span>Đơn thành công</span>
              </article>
              <article className="order-summary-card">
                <strong>{revenueStats.cancelledOrders}</strong>
                <span>Đơn bị hủy</span>
              </article>
              <article className="order-summary-card">
                <strong>{products.length}</strong>
                <span>Trang phục listing</span>
              </article>
              <article className="order-summary-card">
                <strong>{lowInventoryProducts.length}</strong>
                <span style={{ color: lowInventoryProducts.length > 0 ? 'var(--danger)' : 'var(--muted)' }}>Cần nhập hàng (SL &lt; 2)</span>
              </article>
            </section>

            <div className="admin-section-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
              {/* Left Column: Recent Orders */}
              <article className="card admin-table-card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Đơn đặt</p>
                  <h2>Đơn đặt mới nhận</h2>
                </div>
                <div className="table-list">
                  {orders.slice(0, 5).map(o => (
                    <div className="table-row admin-order-row" style={{ padding: '14px' }} key={o._id}>
                      <div>
                        <strong>{o.items?.[0]?.name || o.product?.name || 'Trang phục'}</strong>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '3px' }}>
                          Khách hàng: {o.user?.fullName} • {money(o.totalAmount)} đ
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                      <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', padding: '0 12px', fontSize: '0.8rem' }}>Chi tiết</button>
                    </div>
                  ))}
                  {orders.length === 0 && <div className="empty-state">Cửa hàng chưa có đơn thuê nào.</div>}
                </div>
              </article>

              {/* Right Column: Inventory Stock Warnings & Calendar Widget */}
              <div style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
                {lowInventoryProducts.length > 0 && (
                  <article className="card" style={{ borderColor: 'var(--danger)', background: '#fef2f2' }}>
                    <div className="section-heading compact-heading" style={{ marginBottom: '10px' }}>
                      <p className="eyebrow" style={{ color: 'var(--danger)' }}>Cảnh báo tồn kho</p>
                      <h2 style={{ fontSize: '1.2rem' }}>Sản phẩm sắp hết hàng</h2>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {lowInventoryProducts.map(p => (
                        <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '6px', borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
                          <strong>{p.name}</strong>
                          <span style={{ color: 'var(--danger)', fontWeight: '900' }}>Tồn kho: {p.stockQuantity}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                <article className="card">
                  <div className="section-heading compact-heading" style={{ marginBottom: '10px' }}>
                    <p className="eyebrow">Lịch bận trang phục</p>
                    <h2 style={{ fontSize: '1.2rem' }}>Lịch giữ đồ sắp tới</h2>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {allBusyDates.map((bd, idx) => (
                      <div key={idx} style={{ background: 'var(--surface-soft)', padding: '10px', borderRadius: '10px', fontSize: '0.82rem' }}>
                        <strong>{bd.productName}</strong>
                        <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                          {new Date(bd.startDate).toLocaleDateString('vi-VN')} → {new Date(bd.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--primary)' }}>Lý do: {bd.note || 'Khách đặt'}</div>
                      </div>
                    ))}
                    {allBusyDates.length === 0 && <div className="empty-state" style={{ padding: '20px' }}>Chưa có lịch bận nào được thiết lập.</div>}
                  </div>
                </article>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-PAGE 2: MY COSTUMES ───────────────────────── */}
        {activeTab === 'costumes' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading admin-section-toolbar">
              <div>
                <p className="eyebrow">Danh mục trang phục</p>
                <h2>Kho sản phẩm cửa hàng ({products.length})</h2>
              </div>
              <button className="primary-button" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); setShowProductForm(true); }}>
                + Đăng trang phục mới
              </button>
            </div>

            {showProductForm && (
              <form className="admin-product-form expanded" onSubmit={handleProductSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div className="admin-form-title" style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>{editingProductId ? 'Chỉnh sửa thông tin trang phục' : 'Đăng ký trang phục cho thuê mới'}</h3>
                  <button type="button" className="text-button" onClick={() => setShowProductForm(false)}>Đóng form</button>
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Tên trang phục *</label>
                  <input placeholder="Ví dụ: Áo dài hoa cúc cách tân" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Danh mục *</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                    <option value="traditional">Traditional (Áo dài/Cổ phục)</option>
                    <option value="wedding">Wedding (Váy cưới/Vest)</option>
                    <option value="party">Party (Dạ tiệc)</option>
                    <option value="cosplay">Cosplay (Anime/Game)</option>
                    <option value="festival">Festival (Lễ hội)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Mô tả chi tiết *</label>
                  <textarea placeholder="Mô tả chất liệu vải, phụ kiện đi kèm, hướng dẫn giặt sấy..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Giá thuê theo ngày (đ) *</label>
                  <input type="number" placeholder="Ví dụ: 150000" value={productForm.rentalPricePerDay} onChange={(e) => setProductForm({ ...productForm, rentalPricePerDay: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Tiền cọc yêu cầu (đ)</label>
                  <input type="number" placeholder="Ví dụ: 300000" value={productForm.depositAmount} onChange={(e) => setProductForm({ ...productForm, depositAmount: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Các Size sẵn có (cách nhau bằng dấu phẩy) *</label>
                  <input placeholder="S,M,L" value={productForm.sizes} onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Màu sắc</label>
                  <input placeholder="Ví dụ: Đỏ cam, Đen huyền bí" value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Số lượng tồn kho sẵn có *</label>
                  <input type="number" placeholder="1" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Trạng thái phục vụ</label>
                  <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}>
                    <option value="available">Sẵn sàng cho thuê (Available)</option>
                    <option value="rented">Đang được thuê (Rented)</option>
                    <option value="maintenance">Đang bảo trì/Giặt ủi (Maintenance)</option>
                    <option value="hidden">Ẩn tạm thời (Hidden)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Ảnh trang phục (Mỗi dòng một URL ảnh)</label>
                  <textarea placeholder="https://image1.png&#10;https://image2.png" value={productForm.images} onChange={(e) => setProductForm({ ...productForm, images: e.target.value })} />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button className="primary-button" type="submit">{editingProductId ? 'Lưu cập nhật' : 'Đăng trang phục'}</button>
                </div>
              </form>
            )}

            <div className="table-list admin-product-list">
              {products.map((p) => (
                <div className="table-row admin-product-row" style={{ padding: '16px', gridTemplateColumns: 'auto 1fr auto' }} key={p._id}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}>👗</div>
                  )}
                  <div style={{ marginLeft: '15px' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary-strong)' }}>{p.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Danh mục: <strong style={{ textTransform: 'capitalize' }}>{p.category}</strong> • Giá: <strong>{money(p.rentalPricePerDay)} đ/ngày</strong> • Cọc: <strong>{money(p.depositAmount)} đ</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '3px' }}>
                      Màu: {p.color || 'Không'} • Sizes: {p.sizes?.join(', ')} • Kho: <strong style={{ color: p.stockQuantity < 2 ? 'var(--danger)' : 'inherit' }}>{p.stockQuantity}</strong>
                    </p>
                    
                    {/* Inline Calendar Busy Dates Manager */}
                    <div style={{ marginTop: '12px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary-strong)', display: 'block', marginBottom: '6px' }}>📅 Thiết lập Lịch bận cho trang phục này</span>
                      
                      {p.busyDates && p.busyDates.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {p.busyDates.map((bd, bIdx) => (
                            <span key={bIdx} style={{ background: 'var(--surface-soft)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {date(bd.startDate)} - {date(bd.endDate)} ({bd.note})
                              <button type="button" onClick={() => handleRemoveBusyDate(p._id, bIdx)} style={{ border: '0', background: 'transparent', color: 'var(--danger)', padding: '0', fontWeight: '900' }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="date" value={newBusyDate.startDate} onChange={(e) => setNewBusyDate({ ...newBusyDate, startDate: e.target.value })} style={{ width: 'auto', padding: '6px', fontSize: '0.8rem' }} />
                        <span>→</span>
                        <input type="date" value={newBusyDate.endDate} onChange={(e) => setNewBusyDate({ ...newBusyDate, endDate: e.target.value })} style={{ width: 'auto', padding: '6px', fontSize: '0.8rem' }} />
                        <input placeholder="Lý do bận" value={newBusyDate.note} onChange={(e) => setNewBusyDate({ ...newBusyDate, note: e.target.value })} style={{ width: '150px', padding: '6px', fontSize: '0.8rem' }} />
                        <button type="button" onClick={() => handleAddBusyDate(p._id)} className="secondary-button" style={{ minHeight: '30px', padding: '0 12px', fontSize: '0.78rem' }}>+ Khóa lịch</button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <span className={`status-pill ${p.status === 'available' ? 'active' : 'inactive'}`} style={{ alignSelf: 'flex-end', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {p.status}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="button" onClick={() => handleProductEdit(p)}>Sửa</button>
                      <button className="button danger" onClick={() => handleProductDelete(p._id)}>Ẩn</button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="empty-state">Chưa đăng trang phục nào. Hãy bấm nút Thêm trang phục mới để bắt đầu.</div>}
            </div>
          </section>
        )}

        {/* ── SUB-PAGE 3: ORDERS MANAGEMENT ─────────────────── */}
        {activeTab === 'orders' && (
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
                        Khách: <strong>{o.user?.fullName}</strong> • SĐT: {o.user?.phone || 'N/A'} • Tổng: <strong>{money(o.totalAmount)} đ</strong>
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                        Thời gian: {date(o.rentalStartDate)} → {date(o.rentalEndDate)} ({o.rentalDays} ngày)
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StatusBadge status={o.status} />
                      <select 
                        value={o.status} 
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}
                      >
                        <option value="pending">Chờ xác nhận (Pending)</option>
                        <option value="confirmed">Đã xác nhận (Confirmed)</option>
                        <option value="renting">Đang thuê (Renting)</option>
                        <option value="returned">Đã trả đồ (Returned)</option>
                        <option value="cancelled">Hủy đơn (Cancelled)</option>
                        <option value="rejected">Từ chối (Rejected)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Chi tiết</button>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && <div className="empty-state">Chưa có đơn hàng thuê nào gửi đến shop.</div>}
            </div>
          </section>
        )}

        {/* ── SUB-PAGE 4: REVENUE & STATS ───────────────────── */}
        {activeTab === 'revenue' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <section className="admin-stat-grid">
              <article className="order-summary-card">
                <strong style={{ color: 'var(--accent)' }}>{money(revenueStats.totalRevenue)} đ</strong>
                <span>Tổng doanh thu thực nhận</span>
              </article>
              <article className="order-summary-card">
                <strong>{money(revenueStats.monthlyRevenue)} đ</strong>
                <span>Doanh thu tháng này</span>
              </article>
              <article className="order-summary-card">
                <strong>{money(revenueStats.dailyRevenue)} đ</strong>
                <span>Doanh thu hôm nay</span>
              </article>
              <article className="order-summary-card">
                <strong style={{ color: 'var(--success)' }}>{revenueStats.successfulOrders}</strong>
                <span>Đơn hàng giao nhận thành công</span>
              </article>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
              <button onClick={handlePrintReport} className="primary-button" style={{ display: 'inline-flex', gap: '8px' }}>
                📄 Xuất báo cáo doanh thu đơn giản
              </button>
            </div>

            <div className="admin-section-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* CSS Bar Chart: Top Rented Items */}
              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Thống kê sản phẩm</p>
                  <h2>Sản phẩm thuê nhiều nhất</h2>
                </div>
                <div style={{ display: 'grid', gap: '15px', marginTop: '10px' }}>
                  {revenueStats.topProducts && revenueStats.topProducts.map((p, idx) => {
                    const maxVal = Math.max(...revenueStats.topProducts.map(x => x.count), 1);
                    const percentage = (p.count / maxVal) * 100;
                    return (
                      <div key={idx} style={{ display: 'grid', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <strong>{p.name}</strong>
                          <span>{p.count} lượt đặt</span>
                        </div>
                        {/* Custom CSS Bar Chart */}
                        <div style={{ height: '12px', background: 'var(--surface-soft)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${percentage}%`, 
                            background: 'linear-gradient(90deg, var(--primary-strong), var(--accent))', 
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!revenueStats.topProducts || revenueStats.topProducts.length === 0) && (
                    <div className="empty-state">Chưa có đủ số liệu đặt thuê để xếp hạng.</div>
                  )}
                </div>
              </article>

              {/* Monthly Revenue visual breakdown block */}
              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Đơn hàng</p>
                  <h2>Tỷ lệ hoàn thành đơn đặt</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', height: '100%' }}>
                  <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '18px', textAlign: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--success)' }}>
                      {orders.length > 0 
                        ? `${Math.round((revenueStats.successfulOrders / orders.length) * 100)}%` 
                        : '0%'
                      }
                    </h3>
                    <p style={{ color: 'var(--muted)', margin: '5px 0 0', fontWeight: '800' }}>Tỷ lệ đơn hàng thành công</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <strong>{revenueStats.successfulOrders}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Hoàn thành</span>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <strong>{revenueStats.cancelledOrders}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Bị hủy</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        )}

        {/* ── SUB-PAGE 5: SHOP PROFILE & POLICIES ───────────── */}
        {activeTab === 'profile' && (
          <section className="card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Cấu hình Shop</p>
              <h2>Thiết lập thông tin cửa hàng & Chính sách</h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="input-group" style={{ maxWidth: '780px', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Tên cửa hàng *</label>
                  <input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Email (Đăng nhập - Không thể sửa)</label>
                  <input value={profileForm.email} disabled style={{ background: 'var(--surface-soft)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Số điện thoại liên lạc *</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Địa chỉ cửa hàng *</label>
                  <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>URL Logo cửa hàng</label>
                <input placeholder="https://picsum.photos/200" value={profileForm.logoUrl} onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })} />
              </div>

              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Mô tả/Giới thiệu cửa hàng</label>
                <textarea placeholder="Lotus chuyên cung cấp váy dạ hội, trang phục lễ hội cao cấp..." value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <h3 style={{ margin: '0 0 15px' }}>Quản lý chính sách cho thuê & Đền bù</h3>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Chính sách Thuê & Đặt cọc</label>
                    <textarea 
                      placeholder="Thuê tối thiểu 1 ngày, đặt cọc 100% giá trị sản phẩm khi nhận đồ." 
                      value={profileForm.rentalPolicy} 
                      onChange={(e) => setProfileForm({ ...profileForm, rentalPolicy: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Quy định Xử phạt khi Trễ Hạn đồ</label>
                    <textarea 
                      placeholder="Trễ hạn đền bù phạt 50.000 đ/ngày trễ." 
                      value={profileForm.latePenaltyPolicy} 
                      onChange={(e) => setProfileForm({ ...profileForm, latePenaltyPolicy: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>
                Lưu cấu hình & Chính sách
              </button>
            </form>
          </section>
        )}

        {/* ── SUB-PAGE 6: REVIEWS VIEWER & REPLIES ─────────── */}
        {activeTab === 'reviews' && (
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
        )}

        {/* ── SUB-PAGE 7: NOTIFICATIONS INBOX ──────────────── */}
        {activeTab === 'notifications' && (
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
                      {n.isRead ? '' : '🔵 '}{n.title}
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
        )}
      </main>

      {/* GLOBAL ORDER DETAIL MODAL */}
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

            <div style={{ borderBottom: '2px dashed var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
              <p className="eyebrow" style={{ margin: 0 }}>Hóa đơn đối tác</p>
              <h2 style={{ margin: '4px 0 0' }}>Chi tiết đơn đặt thuê #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <div>
                <strong>Thông tin khách hàng:</strong>
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.user?.fullName}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.user?.email}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>SĐT: {selectedOrder.user?.phone || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Thời gian thuê:</strong>
                <p style={{ margin: '4px 0' }}>Từ: <strong>{date(selectedOrder.rentalStartDate)}</strong></p>
                <p style={{ margin: '2px 0' }}>Đến: <strong>{date(selectedOrder.rentalEndDate)}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Tổng cộng: {selectedOrder.rentalDays} ngày</p>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Trang phục</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Size</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Giá thuê/ngày</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items : [
                    {
                      name: selectedOrder.product?.name || 'Trang phục thuê',
                      size: selectedOrder.size || 'N/A',
                      rentalPricePerDay: selectedOrder.product?.rentalPricePerDay || 0,
                      subtotal: selectedOrder.subtotal || 0
                    }
                  ]).map((item, idx) => (
                    <tr style={{ borderBottom: '1px solid var(--border)' }} key={idx}>
                      <td style={{ padding: '12px', fontWeight: '800' }}>{item.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.size}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{money(item.rentalPricePerDay)} đ</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{money(item.subtotal)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice billing details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', fontSize: '0.9rem' }}>
              <div>
                <strong>Ghi chú từ khách:</strong>
                <p style={{ fontStyle: 'italic', color: 'var(--muted)', marginTop: '4px' }}>
                  "{selectedOrder.note || 'Không có ghi chú.'}"
                </p>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Tạm tính thuê:</span>
                  <strong>{money(selectedOrder.subtotal)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Tiền đặt cọc:</span>
                  <strong>{money(selectedOrder.depositAmount)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Phí phụ thu:</span>
                  <span>+ {money(selectedOrder.extraFee)} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Tổng nhận:</span>
                  <strong style={{ color: 'var(--accent)' }}>{money(selectedOrder.totalAmount)} đ</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions in Detail Modal */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {selectedOrder.status === 'pending' && (
                <>
                  <button onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')} className="primary-button" style={{ minHeight: '44px' }}>Duyệt nhận đơn</button>
                  <button onClick={() => handleStatusChange(selectedOrder._id, 'rejected')} className="primary-button danger" style={{ minHeight: '44px' }}>Từ chối đơn</button>
                </>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button onClick={() => handleStatusChange(selectedOrder._id, 'renting')} className="primary-button" style={{ minHeight: '44px' }}>Khách đã nhận đồ (Renting)</button>
              )}
              {selectedOrder.status === 'renting' && (
                <button onClick={() => handleStatusChange(selectedOrder._id, 'returned')} className="primary-button" style={{ minHeight: '44px' }}>Khách đã trả đồ thành công</button>
              )}
              <button onClick={() => setSelectedOrder(null)} className="secondary-button" style={{ minHeight: '44px' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
