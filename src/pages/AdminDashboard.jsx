import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../services/auth.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { getAdminUsers, setUserStatus, approveLender, getAdminProducts, getAdminOrders, getAdminReports, getAllDisputes, resolveDispute, getAllWithdrawals, processWithdrawal } from '../services/admin.js';
import { getPlatformConfig, updatePlatformConfig, getActivityLogs, getAdminBankInfo, updateAdminBankInfo } from '../services/platform.js';
import { QRCodeCanvas } from 'qrcode.react';
import { updateOrderStatus } from '../services/orders.js';
import { updateProduct } from '../services/products.js';
import ChatBox from '../components/ChatBox.jsx';
import { getConversations } from '../services/chats.js';
import { BarChart3, Users, Store, Shirt, ShoppingBag, Tags, Settings, ShieldAlert, Wallet, MessageSquare, LogOut, AlertTriangle, Clock, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

// ─── HELPER: chuẩn hóa order từ backend (renter/lender → user/shop) ──────────
const normalizeOrder = (o) => ({
  ...o,
  // Backend dùng "renter", frontend cần "user"
  user:  o.user  ?? o.renter  ?? null,
  // Backend dùng "lender" (LenderProfile object), frontend cần "shop" với fullName/email
  shop:  o.shop  ?? (o.lender ? {
    _id:      o.lender._id,
    fullName: o.lender.lenderName || o.lender.user?.fullName || 'N/A',
    email:    o.lender.user?.email || 'N/A',
  } : null),
  // Chuẩn hóa totalAmount
  totalAmount: o.totalAmount ?? o.pricing?.totalAmount ?? 0,
  // Chuẩn hóa tên sản phẩm hiển thị
  _productName: o.items?.[0]?.name || o.product?.name || o.costume?.name || 'Trang phục',
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('reports');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalShops: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenueByShop: [],
    topProducts: [],
    monthlyRevenue: []
  });
  const [customers, setCustomers] = useState([]);
  const [shops, setShops] = useState([]);
  const [costumes, setCostumes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState(['traditional', 'wedding', 'party', 'cosplay', 'festival']);
  const [newCategory, setNewCategory] = useState('');
  const [platformConfig, setPlatformConfig] = useState({ platformFeePercent: 10, banners: [] });
  const [adminBankInfo, setAdminBankInfo] = useState({ bin: '', accountNumber: '', accountName: '' });
  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [visibleWithdrawalQr, setVisibleWithdrawalQr] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 });

  const loadData = async () => {
    try {
      const [rep, custs, shps, prods, ords, config, bankInfo, disps, withds, activity] = await Promise.all([
        getAdminReports(),
        getAdminUsers('customer'),
        getAdminUsers('shop'),
        getAdminProducts(),
        getAdminOrders(),
        getPlatformConfig(),
        getAdminBankInfo().catch(() => null),
        getAllDisputes(),
        getAllWithdrawals(),
        getActivityLogs()
      ]);

      if (rep) setReportData(rep);
      setCustomers(custs || []);
      setShops(shps || []);
      setCostumes(prods?.items || []);
      // ── FIX: chuẩn hóa toàn bộ orders trước khi lưu vào state ──
      setOrders((ords || []).map(normalizeOrder));
      if (config) setPlatformConfig(config);
      if (bankInfo) setAdminBankInfo(bankInfo);
      setDisputes(disps || []);
      setWithdrawals(withds || []);
      setLogs(activity || []);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu hệ thống.');
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      const fetchConvs = () => {
        getConversations().then(data => setConversations(data || [])).catch(err => console.error(err));
      };
      fetchConvs();
      const timer = setInterval(fetchConvs, 3000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  const handleToggleUserStatus = async (userId, currentActive) => {
    try {
      await setUserStatus(userId, !currentActive);
      toast.success('Đã cập nhật trạng thái tài khoản.');
      loadData();
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái người dùng.');
    }
  };

  const handleApproveLender = async (lenderId, approved) => {
    try {
      await approveLender(lenderId, approved);
      toast.success(approved ? 'Đã duyệt phê duyệt lender đăng ký.' : 'Đã từ chối lender đăng ký.');
      setSelectedShop(null);
      loadData();
    } catch (err) {
      toast.error('Lỗi xử lý duyệt lender.');
    }
  };

  const handleLockProduct = async (productId, isLocked) => {
    try {
      await updateProduct(productId, { status: isLocked ? 'hidden' : 'available' });
      toast.success(isLocked ? 'Đã khóa trang phục vi phạm thành công.' : 'Đã mở khóa trang phục.');
      loadData();
    } catch (err) {
      toast.error('Không thể khóa trang phục.');
    }
  };

  const handleOverrideOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Đã cập nhật trạng thái đơn hàng (Admin override).');
      if (selectedOrder) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      loadData();
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái đơn đặt.');
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim().toLowerCase())) {
      toast.error('Danh mục đã tồn tại'); return;
    }
    setCategories([...categories, newCategory.trim().toLowerCase()]);
    setNewCategory('');
    toast.success('Đã thêm danh mục mới.');
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await updatePlatformConfig(platformConfig);
      await updateAdminBankInfo(adminBankInfo);
      toast.success('Đã lưu cấu hình nền tảng và tài khoản ngân hàng.');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!resolutionForm.adminDecision.trim()) return;
    try {
      await resolveDispute(resolvingDispute._id, resolutionForm);
      toast.success('Đã giải quyết tranh chấp thành công.');
      setResolvingDispute(null);
      setResolutionForm({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 });
      loadData();
    } catch (err) {
      toast.error('Không thể giải quyết tranh chấp.');
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt('Nhập lý do từ chối:');
      if (!rejectionReason) return;
    }
    try {
      await processWithdrawal(id, { status, rejectionReason });
      toast.success('Đã xử lý yêu cầu rút tiền thành công.');
      loadData();
    } catch (err) {
      toast.error('Không thể xử lý yêu cầu rút tiền.');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
    window.location.reload();
  };

  const menuItems = [
    { id: 'reports',          label: 'Báo cáo doanh thu',    icon: <BarChart3 size={20} /> },
    { id: 'users',            label: 'Khách hàng',            icon: <Users size={20} /> },
    { id: 'shops',            label: 'Cửa hàng (Shops)',      icon: <Store size={20} /> },
    { id: 'costumes',         label: 'Trang phục',            icon: <Shirt size={20} /> },
    { id: 'orders',           label: 'Đơn đặt thuê',          icon: <ShoppingBag size={20} /> },
    { id: 'categories',       label: 'Danh mục',              icon: <Tags size={20} /> },
    { id: 'config',           label: 'Cấu hình hệ thống',     icon: <Settings size={20} /> },
    { id: 'complaints_logs',  label: 'Tranh chấp & Logs',     icon: <ShieldAlert size={20} /> },
    { id: 'withdrawals',      label: 'Duyệt rút tiền',        icon: <Wallet size={20} /> },
    { id: 'chat',             label: 'Hỗ trợ khách hàng',     icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="admin-shell" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <aside className="admin-sidebar" style={{ background: 'var(--primary-strong)' }}>
        <div className="admin-sidebar-brand" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="logo-mark" aria-hidden="true"><span className="logo-hanger"></span></span>
          <div>
            <strong>BuildLab</strong>
            <small>Admin Center</small>
          </div>
        </div>

        <nav className="admin-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); setMessage(''); setError(''); }}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'shops' && shops.filter(s => s.lenderProfile?.isVerified === false).length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: '900' }}>
                  {shops.filter(s => s.lenderProfile?.isVerified === false).length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button className="admin-menu-item admin-logout-button" onClick={handleLogout}>
          <span><LogOut size={20} /></span>
          Đăng xuất
        </button>
      </aside>

      <main className="admin-content">
        <section className="card admin-hero-card" style={{ background: 'white' }}>
          <div>
            <p className="eyebrow">Quản trị viên BuildLab</p>
            <h1>{menuItems.find(item => item.id === activeTab)?.label}</h1>
            <p>Bảng điều khiển tối cao để giám sát doanh số, duyệt hồ sơ shop, khóa tài khoản vi phạm, điều chỉnh chiết khấu nền tảng và giải quyết khiếu nại.</p>
          </div>
        </section>


        {/* ── TAB 1: REPORTS ── */}
        {activeTab === 'reports' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <section className="admin-stat-grid">
              <article className="order-summary-card">
                <strong style={{ color: 'var(--accent)' }}>{money(reportData.totalRevenue)} đ</strong>
                <span>Tổng doanh số giao dịch</span>
              </article>
              <article className="order-summary-card">
                <strong>{reportData.totalOrders}</strong>
                <span>Tổng đơn thuê toàn hệ thống</span>
              </article>
              <article className="order-summary-card">
                <strong>{reportData.totalUsers}</strong>
                <span>Khách hàng hoạt động</span>
              </article>
              <article className="order-summary-card">
                <strong>{reportData.totalShops}</strong>
                <span>Cửa hàng (Shops) đăng ký</span>
              </article>
              <article className="order-summary-card">
                <strong>{reportData.totalProducts}</strong>
                <span>Số lượng trang phục đăng listing</span>
              </article>
            </section>

            <div className="admin-section-grid" style={{ gridTemplateColumns: '1.12fr 0.88fr' }}>
              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Tăng trưởng tài chính</p>
                  <h2>Biểu đồ doanh thu theo tháng</h2>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', height: '240px', padding: '20px 10px 10px', background: 'var(--surface-soft)', borderRadius: '18px', marginTop: '10px' }}>
                  {reportData.monthlyRevenue && reportData.monthlyRevenue.map((mr, idx) => {
                    const maxVal = Math.max(...reportData.monthlyRevenue.map(x => x.value), 1);
                    const heightPercent = (mr.value / maxVal) * 80 + 10;
                    return (
                      <div key={idx} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>{money(mr.value)} đ</span>
                        <div style={{ width: '100%', maxHeight: '180px', height: `${heightPercent}px`, background: 'linear-gradient(180deg, var(--accent), var(--primary-strong))', borderRadius: '8px 8px 0 0', transition: 'height 0.4s ease' }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '800' }}>{mr.label}</span>
                      </div>
                    );
                  })}
                  {(!reportData.monthlyRevenue || reportData.monthlyRevenue.length === 0) && (
                    <div className="chat-empty" style={{ margin: 'auto' }}>Chưa có đủ số liệu tháng.</div>
                  )}
                </div>
              </article>

              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Xếp hạng cửa hàng</p>
                  <h2>Shops có doanh thu cao nhất</h2>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {reportData.revenueByShop && reportData.revenueByShop.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-soft)', borderRadius: '12px' }}>
                      <strong>{idx + 1}. {item.shop}</strong>
                      <strong style={{ color: 'var(--accent)' }}>{money(item.revenue)} đ</strong>
                    </div>
                  ))}
                  {(!reportData.revenueByShop || reportData.revenueByShop.length === 0) && (
                    <div className="empty-state">Nền tảng chưa ghi nhận giao dịch nào.</div>
                  )}
                </div>
              </article>
            </div>

            <article className="card" style={{ maxWidth: '650px' }}>
              <div className="section-heading compact-heading">
                <p className="eyebrow">Thống kê sản phẩm</p>
                <h2>Trang phục được thuê nhiều nhất</h2>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {reportData.topProducts && reportData.topProducts.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <strong>{p.name}</strong>
                    <span><strong>{p.count}</strong> lượt thuê</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {/* ── TAB 2: CUSTOMERS ── */}
        {activeTab === 'users' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Thành viên</p>
              <h2>Quản lý tài khoản khách hàng ({customers.length})</h2>
            </div>
            <div className="user-list full-user-list">
              {customers.map((c) => (
                <div className="user-list-item" style={{ padding: '16px' }} key={c._id}>
                  <div className="user-avatar" style={{ background: 'var(--primary-strong)' }}>
                    {c.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{c.fullName}</strong>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.email} • ĐT: {c.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <span className={`status-pill ${c.isActive !== false ? 'active' : 'inactive'}`}>
                    {c.isActive !== false ? 'Active' : 'Blocked'}
                  </span>
                  <button onClick={() => handleToggleUserStatus(c._id, c.isActive !== false)} className={`button ${c.isActive !== false ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
                    {c.isActive !== false ? 'Block tài khoản' : 'Mở khóa tài khoản'}
                  </button>
                </div>
              ))}
              {customers.length === 0 && <div className="empty-state">Không tìm thấy khách hàng nào.</div>}
            </div>
          </section>
        )}

        {/* ── TAB 3: SHOPS ── */}
        {activeTab === 'shops' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Đối tác</p>
              <h2>Phê duyệt và Quản lý cửa hàng ({shops.length})</h2>
            </div>
            <div className="user-list full-user-list">
              {shops.map((s) => {
                const isVerified = s.lenderProfile?.isVerified === true;
                return (
                  <div className="user-list-item" style={{ padding: '16px' }} key={s._id}>
                    {s.lenderProfile?.logoUrl
                      ? <img src={s.lenderProfile.logoUrl} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} />
                      : <div className="user-avatar" style={{ background: 'var(--accent)' }}>🏬</div>
                    }
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{s.fullName}</strong>
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{s.email} • ĐT: {s.phone || s.lenderProfile?.phone || 'Chưa cập nhật'}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>Địa chỉ: {s.lenderProfile?.address || 'Chưa cấu hình'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`status-pill ${s.isActive !== false ? 'active' : 'inactive'}`} style={{ alignSelf: 'center', fontSize: '0.7rem' }}>
                        {s.isActive !== false ? 'Active' : 'Blocked'}
                      </span>
                      <span className={`status-pill ${isVerified ? 'active' : 'inactive'}`} style={{ alignSelf: 'center', fontSize: '0.7rem', background: isVerified ? '#dcfce7' : '#fee2e2', color: isVerified ? '#166534' : '#991b1b' }}>
                        {isVerified ? 'Verified' : 'Pending Approval'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelectedShop(s)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Xem hồ sơ</button>
                      {!isVerified && (
                        <button onClick={() => handleApproveLender(s._id, true)} className="primary-button" style={{ minHeight: '36px', fontSize: '0.82rem', padding: '0 12px' }}>Duyệt Lender</button>
                      )}
                      <button onClick={() => handleToggleUserStatus(s._id, s.isActive !== false)} className={`button ${s.isActive !== false ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
                        {s.isActive !== false ? 'Block Shop' : 'Mở khóa'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {shops.length === 0 && <div className="empty-state">Chưa có shop đối tác nào đăng ký.</div>}
            </div>
          </section>
        )}

        {/* ── TAB 4: COSTUMES ── */}
        {activeTab === 'costumes' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Kiểm duyệt</p>
              <h2>Toàn bộ sản phẩm trang phục trên hệ thống</h2>
            </div>
            <div className="table-list">
              {costumes.map((p) => {
                const isLocked = p.status === 'hidden';
                // ── FIX: backend populate field là "lender", không phải "shop" ──
                const shopName = p.shop?.fullName || p.lender?.lenderName || p.lender?.user?.fullName || 'N/A';
                return (
                  <div className="table-row" style={{ padding: '16px', gridTemplateColumns: 'auto 1fr auto' }} key={p._id}>
                    {p.images && p.images.length > 0
                      ? <img src={p.images[0]?.url || p.images[0]} alt={p.name} style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover' }} />
                      : <div style={{ width: '54px', height: '54px', borderRadius: '10px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}><Shirt size={22} style={{ color: '#6b7280' }} /></div>
                    }
                    <div style={{ marginLeft: '12px' }}>
                      <strong style={{ color: 'var(--primary-strong)' }}>{p.name}</strong>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '2px' }}>
                        Cửa hàng: <strong>{shopName}</strong> • Giá thuê: <strong>{money(p.rentalPricePerDay)} đ/ngày</strong> • Size: {p.sizes?.join(', ')}
                      </p>
                      {isLocked && <span style={{ color: 'var(--danger)', fontSize: '0.78rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center' }}><AlertTriangle size={14} style={{ color: '#6b7280', marginRight: '4px' }} /> ĐÃ KHÓA SẢN PHẨM (Vi phạm tiêu chuẩn)</span>}
                    </div>
                    <button onClick={() => handleLockProduct(p._id, !isLocked)} className={`button ${!isLocked ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
                      {isLocked ? 'Mở khóa sản phẩm' : 'Khóa sản phẩm vi phạm'}
                    </button>
                  </div>
                );
              })}
              {costumes.length === 0 && <div className="empty-state">Không có trang phục nào trong cơ sở dữ liệu.</div>}
            </div>
          </section>
        )}

        {/* ── TAB 5: ORDERS ── */}
        {activeTab === 'orders' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Đơn đặt</p>
              <h2>Quản lý và can thiệp toàn bộ đơn thuê hệ thống</h2>
            </div>
            <div className="table-list">
              {orders.map((o) => (
                <div className="table-row admin-order-row" style={{ padding: '16px', gridTemplateColumns: '1fr auto auto' }} key={o._id}>
                  <div>
                    {/* ── FIX: dùng _productName đã normalize ── */}
                    <strong style={{ fontSize: '1.05rem', color: 'var(--primary-strong)' }}>{o._productName}</strong>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '3px' }}>
                      {/* ── FIX: dùng o.shop và o.user đã normalize ── */}
                      Shop: <strong>{o.shop?.fullName || 'N/A'}</strong> • Khách: <strong>{o.user?.fullName || 'N/A'}</strong> • Tổng: <strong>{money(o.totalAmount)} đ</strong>
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                      Thời gian thuê: {date(o.rentalStartDate)} → {date(o.rentalEndDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={o.status} />
                    <select value={o.status} onChange={(e) => handleOverrideOrderStatus(o._id, e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                      <option value="pending">Pending (Chờ duyệt)</option>
                      <option value="confirmed">Confirmed (Xác nhận)</option>
                      <option value="renting">Renting (Đang thuê)</option>
                      <option value="returned">Returned (Đã trả)</option>
                      <option value="cancelled">Cancelled (Hủy)</option>
                    </select>
                  </div>
                  <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Chi tiết</button>
                </div>
              ))}
              {orders.length === 0 && <div className="empty-state">Không có đơn đặt hàng nào trong hệ thống.</div>}
            </div>
          </section>
        )}

        {/* ── TAB 6: CATEGORIES ── */}
        {activeTab === 'categories' && (
          <section className="card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Cấu hình phân loại</p>
              <h2>Quản lý các danh mục trang phục</h2>
            </div>
            <form onSubmit={handleAddCategory} className="inline-form" style={{ maxWidth: '580px', marginBottom: '20px' }}>
              <input placeholder="Nhập danh mục mới (ví dụ: party, festival)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
              <button className="primary-button" type="submit" style={{ gridColumn: 'span 2' }}>+ Thêm danh mục</button>
            </form>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {categories.map((c, idx) => (
                <span key={idx} style={{ background: 'var(--surface-soft)', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', textTransform: 'capitalize', border: '1px solid var(--border)' }}>
                  🏷 {c}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 7: CONFIG ── */}
        {activeTab === 'config' && (
          <section className="card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Tham số</p>
              <h2>Thiết lập cấu hình chiết khấu nền tảng & Banners</h2>
            </div>
            <form onSubmit={handleSaveConfig} className="input-group" style={{ maxWidth: '680px', gap: '18px' }}>
              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Phí hoa hồng commission nền tảng (%)</label>
                <input type="number" value={platformConfig.platformFeePercent || platformConfig.platformFeePercentage || 0} onChange={(e) => setPlatformConfig({ ...platformConfig, platformFeePercent: Number(e.target.value) })} required />
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Hệ thống tự động trừ phí hoa hồng này từ mỗi đơn hàng thành công của Shop.</p>
              </div>
              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Hạn mức nợ phí sàn tối đa để khóa Shop (đ)</label>
                <input type="number" value={platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000} onChange={(e) => setPlatformConfig({ ...platformConfig, maxDebtLimit: Number(e.target.value) })} required />
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Nếu ví của Shop bị âm vượt quá hạn mức nợ này, hệ thống sẽ tự động khóa Shop.</p>
              </div>
              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Banners trang chủ (Mỗi dòng một URL ảnh)</label>
                <textarea value={(platformConfig.banners || []).join('\n')} onChange={(e) => setPlatformConfig({ ...platformConfig, banners: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} placeholder="https://picsum.photos/seed/banner/1200/500" style={{ minHeight: '120px' }} />
              </div>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Tài khoản ngân hàng nhận tiền nạp (EMVCo QR)</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Mã Ngân Hàng (BIN)</label>
                    <input type="text" placeholder="VD: 970422 (MBBank)" value={adminBankInfo.bin || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, bin: e.target.value })} required />
                    <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Tra cứu mã BIN tại trang chủ Napas hoặc VietQR.</small>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Số Tài Khoản</label>
                    <input type="text" placeholder="VD: 0123456789" value={adminBankInfo.accountNumber || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountNumber: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Tên Chủ Tài Khoản</label>
                    <input type="text" placeholder="VD: NGUYEN VAN A" value={adminBankInfo.accountName || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountName: e.target.value.toUpperCase() })} required />
                  </div>
                </div>
              </div>
              <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>Lưu cấu hình hệ thống</button>
            </form>
          </section>
        )}

        {/* ── TAB 8: COMPLAINTS & LOGS ── */}
        {activeTab === 'complaints_logs' && (
          <div className="admin-section-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <article className="card admin-table-card">
              <div className="section-heading compact-heading">
                <p className="eyebrow">Tranh chấp</p>
                <h2>Khiếu nại đơn thuê (Disputes)</h2>
              </div>
              <div style={{ display: 'grid', gap: '15px', padding: '10px' }}>
                {disputes.map((d) => (
                  <div key={d._id} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <strong>Lý do: {d.reason}</strong>
                      <span className={`status-pill ${d.status === 'Resolved' ? 'active' : 'inactive'}`} style={{ fontSize: '0.7rem' }}>{d.status}</span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '6px 0' }}>{d.description}</p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                      Người tạo: <strong>{d.raisedBy?.fullName}</strong> • Bị khiếu nại: <strong>{d.against?.fullName}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '4px' }}>Yêu cầu đền bù: {money(d.requestedAmount)} đ</div>
                    {d.resolution ? (
                      <div style={{ marginTop: '10px', background: '#ecfdf5', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #bbf7d0', color: '#166534' }}>
                        <strong>Quyết định:</strong> {d.resolution.adminDecision}<br/>
                        Đền bù cho Shop: {money(d.resolution.amountAwardedToLender)} đ<br/>
                        Hoàn lại cho Khách: {money(d.resolution.amountRefundedToRenter)} đ
                      </div>
                    ) : (
                      <button onClick={() => { setResolvingDispute(d); setResolutionForm({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 }); }} className="button" style={{ minHeight: '34px', fontSize: '0.78rem', marginTop: '10px' }}>
                        Phân xử tranh chấp
                      </button>
                    )}
                  </div>
                ))}
                {disputes.length === 0 && <div className="empty-state">Chưa nhận được khiếu nại tranh chấp nào.</div>}
              </div>
            </article>

            <article className="card admin-table-card">
              <div className="section-heading compact-heading">
                <p className="eyebrow">Nhật ký</p>
                <h2>Lịch sử hoạt động của hệ thống (Logs)</h2>
              </div>
              <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'grid', gap: '8px', padding: '10px' }}>
                {logs.map((log) => (
                  <div key={log._id} style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                      <span style={{ textTransform: 'uppercase', color: 'var(--accent)' }}>{log.action}</span>
                      <span style={{ color: 'var(--muted)', fontWeight: '400' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', color: 'var(--primary-strong)' }}>{log.description}</p>
                    <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                      Tài khoản tác nhân: <strong>{log.user?.fullName} ({log.user?.email})</strong>
                    </small>
                  </div>
                ))}
                {logs.length === 0 && <div className="empty-state">Chưa có nhật ký hoạt động nào.</div>}
              </div>
            </article>
          </div>
        )}

        {/* ── TAB: WITHDRAWALS ── */}
        {activeTab === 'withdrawals' && (
          <section className="card admin-table-card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Tài chính</p>
              <h2>Yêu cầu rút tiền từ người dùng</h2>
            </div>
            <div className="table-list">
              {withdrawals.map((w) => (
                <div className="table-row" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} key={w._id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 8px 0' }}>
                        Người yêu cầu: <strong>{w.user?.fullName}</strong> • {w.user?.email}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`status-pill ${w.status === 'completed' ? 'active' : w.status === 'rejected' ? 'inactive' : 'warning'}`}>
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '2px solid var(--primary)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>THÔNG TIN CHUYỂN KHOẢN</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tiền</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-strong)' }}>{money(w.amount)} đ</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Mã tham chiếu</p>
                        <p style={{ margin: 0, fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent)' }}>{w.orderCode}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Ngân hàng</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.bankName}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tài khoản</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{w.bankAccount?.accountNumber}</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Chủ tài khoản</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.accountHolderName}</p>
                      </div>
                    </div>
                  </div>

                  {(w.status === 'pending' || w.status === 'processing') && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {w.status === 'pending' && (
                          <>
                            <button onClick={() => handleProcessWithdrawal(w._id, 'processing')} className="primary-button" style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}>Bắt đầu chuyển</button>
                            <button onClick={() => handleProcessWithdrawal(w._id, 'rejected')} className="button danger" style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}>Từ chối</button>
                          </>
                        )}
                        <button
                          className="button"
                          style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                          onClick={() => setVisibleWithdrawalQr(visibleWithdrawalQr === w._id ? null : w._id)}
                        >
                          {visibleWithdrawalQr === w._id ? 'Ẩn QR' : 'Xem QR'}
                        </button>
                      </div>
                      {w.status === 'processing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <small style={{ color: 'var(--primary-strong)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} style={{ color: '#6b7280' }} /> Đang chờ Casso xác nhận...
                          </small>
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`/wallet/debug/test-webhook-withdrawal?orderCode=${w.orderCode}`);
                                if (response.data?.success) {
                                  toast.success('Mô phỏng Casso chuyển tiền thành công!');
                                  loadData();
                                } else {
                                  toast.error(response.data?.message || 'Có lỗi khi mô phỏng');
                                }
                              } catch (e) {
                                toast.error('Lỗi kết nối: ' + e.message);
                              }
                            }}
                            className="button"
                            style={{ minHeight: '28px', fontSize: '0.72rem', padding: '0 8px', background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0', cursor: 'pointer' }}
                          >
                            Mô phỏng Casso chuyển thành công
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {visibleWithdrawalQr === w._id && w.qrString && (
                    <div style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '2px solid var(--border)' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <Info size={16} style={{ color: '#6b7280' }} /> Quét mã này để chuyển khoản
                      </p>
                      <div style={{ display: 'inline-block', background: 'white', padding: '8px', borderRadius: '8px' }}>
                        <QRCodeCanvas value={w.qrString} size={150} level="M" />
                      </div>
                      <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Nội dung: <strong>{w.orderCode}</strong></p>
                    </div>
                  )}

                  {w.rejectionReason && (
                    <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger)' }}>Lý do từ chối: {w.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
              {withdrawals.length === 0 && <div className="empty-state">Không có yêu cầu rút tiền nào.</div>}
            </div>
          </section>
        )}

        {/* ── TAB 9: CHAT ── */}
        {activeTab === 'chat' && (
          <div className="card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Hộp thư hỗ trợ</p>
              <h2>Trò chuyện với khách hàng</h2>
            </div>
            <div className="admin-chat-layout" style={{ minHeight: '520px' }}>
              <div className="conversation-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {conversations.map((c) => (
                  <div key={c._id} className={`conversation-item ${selectedConvId === c._id ? 'active' : ''}`} onClick={() => setSelectedConvId(c._id)}>
                    <strong>{c.customer?.fullName || 'Khách hàng'}</strong>
                    <span>{c.lastMessage || 'Chưa có tin nhắn'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>
                ))}
                {conversations.length === 0 && <div className="empty-state">Chưa có hội thoại hỗ trợ nào.</div>}
              </div>
              <div className="chat-container">
                {selectedConvId ? (
                  <ChatBox conversationId={selectedConvId} />
                ) : (
                  <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>💬</span>
                    <h3>Chọn một khách hàng ở danh sách bên</h3>
                    <p style={{ color: 'var(--muted)', marginTop: '5px' }}>Bắt đầu cuộc trò chuyện hỗ trợ kỹ thuật hoặc giải quyết khiếu nại.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: SHOP DETAIL ── */}
      {selectedShop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '26px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setSelectedShop(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
              {selectedShop.lenderProfile?.logoUrl
                ? <img src={selectedShop.lenderProfile.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover' }} />
                : <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center', fontSize: '2rem' }}>🏬</div>
              }
              <div>
                <h2 style={{ margin: 0 }}>{selectedShop.fullName}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{selectedShop.email}</p>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', display: 'grid', gap: '12px' }}>
              <div><strong>Số điện thoại:</strong> {selectedShop.phone || selectedShop.lenderProfile?.phone || 'N/A'}</div>
              <div><strong>Địa chỉ:</strong> {selectedShop.lenderProfile?.address || 'N/A'}</div>
              <div>
                <strong>Mô tả shop:</strong>
                <p style={{ margin: '4px 0', color: 'var(--muted)' }}>"{selectedShop.lenderProfile?.bio || 'N/A'}"</p>
              </div>
              <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '14px' }}>
                <strong>Chính sách cọc & phạt trễ hạn:</strong>
                <p style={{ margin: '6px 0 3px', fontSize: '0.85rem' }}>• <strong>Cọc:</strong> {selectedShop.lenderProfile?.rentalPolicy || 'N/A'}</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>• <strong>Phạt:</strong> {selectedShop.lenderProfile?.latePenaltyPolicy || 'N/A'}</p>
              </div>
              {selectedShop.lenderProfile?.businessLicenseUrl && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Giấy phép kinh doanh / CCCD:</strong>
                  <div style={{ marginTop: '8px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--surface-soft)', textAlign: 'center', padding: '10px' }}>
                    <img src={selectedShop.lenderProfile.businessLicenseUrl} alt="Giấy phép kinh doanh / CCCD" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', objectFit: 'contain' }} />
                    <div style={{ marginTop: '8px' }}>
                      <a href={selectedShop.lenderProfile.businessLicenseUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '800', textDecoration: 'underline' }}>🔍 Xem ảnh kích thước lớn</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
              {selectedShop.lenderProfile?.isVerified === false && (
                <button onClick={() => handleApproveLender(selectedShop._id, true)} className="primary-button">Duyệt Lender Đăng Ký</button>
              )}
              <button onClick={() => setSelectedShop(null)} className="secondary-button">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVE DISPUTE ── */}
      {resolvingDispute && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={handleResolveDispute} className="card" style={{ width: 'min(500px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative' }}>
            <button type="button" onClick={() => setResolvingDispute(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px' }}>Phân xử tranh chấp</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
              <strong>Đơn:</strong> {resolvingDispute.order?._id}<br/>
              <strong>Cọc đang giữ:</strong> {money(resolvingDispute.order?.pricing?.depositFee)} đ
            </p>
            <div className="input-group">
              <label style={{ fontWeight: '800' }}>Biện pháp xử lý / Quyết định</label>
              <textarea placeholder="Ví dụ: Đã kiểm tra hình ảnh, trừ cọc 50k cho shop..." value={resolutionForm.adminDecision} onChange={(e) => setResolutionForm({ ...resolutionForm, adminDecision: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div>
                <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Đền bù cho Shop (VNĐ)</label>
                <input type="number" value={resolutionForm.amountAwardedToLender} onChange={(e) => setResolutionForm({ ...resolutionForm, amountAwardedToLender: Number(e.target.value) })} required />
              </div>
              <div>
                <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Hoàn lại Khách (VNĐ)</label>
                <input type="number" value={resolutionForm.amountRefundedToRenter} onChange={(e) => setResolutionForm({ ...resolutionForm, amountRefundedToRenter: Number(e.target.value) })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="primary-button" type="submit">Xác nhận quyết định</button>
              <button type="button" onClick={() => setResolvingDispute(null)} className="secondary-button">Hủy bỏ</button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: ORDER DETAIL ── */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: 'min(620px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '26px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Đơn đặt thuê #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>Hệ thống Quản lý BuildLab</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div>
                <strong>Khách hàng:</strong>
                {/* ── FIX: dùng selectedOrder.user đã normalize ── */}
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.user?.fullName || 'N/A'}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.user?.email || 'N/A'}</p>
              </div>
              <div>
                <strong>Đối tác Shop:</strong>
                {/* ── FIX: dùng selectedOrder.shop đã normalize ── */}
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.shop?.fullName || 'N/A'}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.shop?.email || 'N/A'}</p>
              </div>
            </div>
            <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '15px' }}>
              <div>• <strong>Thời gian:</strong> {date(selectedOrder.rentalStartDate)} → {date(selectedOrder.rentalEndDate)} ({selectedOrder.rentalDays} ngày)</div>
              <div style={{ marginTop: '4px' }}>• <strong>Trạng thái:</strong> <StatusBadge status={selectedOrder.status} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <span>Tổng số tiền giao dịch:</span>
              <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{money(selectedOrder.totalAmount)} đ</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
              {selectedOrder.status === 'pending' && (
                <button onClick={() => handleOverrideOrderStatus(selectedOrder._id, 'confirmed')} className="primary-button">Duyệt nhận đơn</button>
              )}
              <button onClick={() => setSelectedOrder(null)} className="secondary-button">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;