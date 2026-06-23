import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../../services/auth.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { getAdminUsers, setUserStatus, approveLender, getAdminProducts, getAdminOrders, getAdminReports, getAllDisputes, resolveDispute, getAllWithdrawals, processWithdrawal } from '../../services/admin.js';
import { getPlatformConfig, updatePlatformConfig, getActivityLogs, getActivityStats, getAdminBankInfo, updateAdminBankInfo } from '../../services/platform.js';
import { QRCodeCanvas } from 'qrcode.react';
import { updateOrderStatus } from '../../services/orders.js';
import { updateProduct, listCategories, createCategory, deleteCategory } from '../../services/products.js';
import { getAdminFeedbacks, updateFeedback } from '../../services/feedbacks.js';
import ContractModal from '../../components/ContractModal.jsx';
import ChatBox from '../../components/ChatBox.jsx';
import { getConversations } from '../../services/chats.js';
import { BarChart3, Users, Store, Shirt, ShoppingBag, Tags, Settings, ShieldAlert, Wallet, MessageSquare, LogOut, AlertTriangle, Clock, Info, ExternalLink, MessageSquarePlus, Ticket, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { connectSocket, disconnectSocket } from '../../services/socket.js';

import ReportsTab from './ReportsTab.jsx';
import UsersTab from './UsersTab.jsx';
import ShopsTab from './ShopsTab.jsx';
import CostumesTab from './CostumesTab.jsx';
import OrdersTab from './OrdersTab.jsx';
import CategoriesTab from './CategoriesTab.jsx';
import ConfigTab from './ConfigTab.jsx';
import CouponTab from './CouponTab.jsx';
import EmailMarketingTab from './EmailMarketingTab.jsx';
import ComplaintsLogsTab from './ComplaintsLogsTab.jsx';
import WithdrawalsTab from './WithdrawalsTab.jsx';
import ChatTab from './ChatTab.jsx';
import FeedbacksTab from './FeedbacksTab.jsx';


const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const normalizeOrder = (o) => ({
  ...o,
  user: o.user ?? o.renter ?? null,
  shop: o.shop ?? (o.lender ? {
    _id: o.lender._id,
    fullName: o.lender.lenderName || o.lender.user?.fullName || 'N/A',
    email: o.lender.user?.email || 'N/A',
  } : null),
  totalAmount: o.totalAmount ?? o.pricing?.totalAmount ?? 0,
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
  const [categories, setCategories] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [platformConfig, setPlatformConfig] = useState({ platformFeePercent: 10, banners: [] });
  const [adminBankInfo, setAdminBankInfo] = useState({ bin: '', accountNumber: '', accountName: '' });
  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [logStats, setLogStats] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState(null);
  const [visibleWithdrawalQr, setVisibleWithdrawalQr] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({ adminDecision: '', amountAwardedToLender: 0, amountRefundedToRenter: 0 });

  const loadData = async () => {
    try {
      const [rep, custs, shps, prods, ords, config, bankInfo, disps, withds, activity, activityStats, cats, fbacks] = await Promise.all([
        getAdminReports(),
        getAdminUsers('customer'),
        getAdminUsers('shop'),
        getAdminProducts(),
        getAdminOrders(),
        getPlatformConfig(),
        getAdminBankInfo().catch(() => null),
        getAllDisputes(),
        getAllWithdrawals(),
        getActivityLogs(),
        getActivityStats(),
        listCategories().catch(() => []),
        getAdminFeedbacks().catch(() => [])
      ]);

      if (rep) setReportData(rep);
      setCustomers(custs || []);
      setShops(shps || []);
      setCostumes(prods?.items || []);
      setOrders((ords || []).map(normalizeOrder));
      if (config) setPlatformConfig(config);
      if (bankInfo) setAdminBankInfo(bankInfo);
      setDisputes(disps || []);
      setWithdrawals(withds || []);
      setLogs(activity || []);
      setLogStats(activityStats || null);
      setCategories(cats || []);
      setFeedbacks(fbacks?.data || (Array.isArray(fbacks) ? fbacks : []));
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu hệ thống.');
    }
  };

  const fetchLogStats = async (period = 'today') => {
    try {
      const stats = await getActivityStats(period);
      setLogStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  // WebSocket cho realtime updates
  useEffect(() => {
    const socket = connectSocket();
    
    if (socket) {
      console.log('[Admin] WebSocket đã kết nối');
      
      // Lắng nghe cập nhật ví (nạp/rút tiền)
      socket.on('wallet_updated', (data) => {
        console.log('[Admin] wallet_updated:', data);
        
        if (data.type === 'withdrawal') {
          if (data.status === 'completed') {
            toast.success(`Rút tiền ${money(data.amount)}đ đã hoàn tất`);
            loadData();
          } else if (data.status === 'failed') {
            toast.error(`Yêu cầu rút tiền ${money(data.amount)}đ đã thất bại`);
            loadData();
          } else if (data.status === 'processing') {
            toast.loading(`Đang xử lý rút tiền ${money(data.amount)}đ...`, { duration: 2000 });
            loadData();
          }
        }
        
        if (data.type === 'deposit' && data.status === 'completed') {
          toast.success(`Nạp tiền ${money(data.amount)}đ thành công`);
          loadData();
        }
      });
      
      // Lắng nghe đơn hàng mới
      socket.on('new_order', (data) => {
        toast.info(`Có đơn hàng mới: ${data.productName || 'Trang phục'}`);
        loadData();
      });
      
      // Lắng nghe cập nhật đơn hàng
      socket.on('order_updated', (data) => {
        toast.info(`Đơn hàng #${data.orderId?.slice(-6)} đã được cập nhật`);
        loadData();
      });

      // Lắng nghe khi có tranh chấp mới
      socket.on('new_dispute', (data) => {
        toast.error(`Tranh chấp mới từ đơn hàng #${data.orderId?.slice(-6)}`);
        loadData();
      });
    }
    
    return () => {
      if (socket) {
        socket.off('wallet_updated');
        socket.off('new_order');
        socket.off('order_updated');
        socket.off('new_dispute');
        console.log('[Admin] WebSocket đã ngắt kết nối');
      }
      disconnectSocket();
    };
  }, []);

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await createCategory({ name: newCategory.trim() });
      toast.success('Đã thêm danh mục mới.');
      setNewCategory('');
      loadData();
    } catch (err) {
      toast.error('Lỗi thêm danh mục: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (name) => {
    if (!window.confirm(`Bạn có chắc muốn xoá danh mục "${name}"?`)) return;
    try {
      await deleteCategory(name);
      toast.success('Đã xoá danh mục.');
      loadData();
    } catch (err) {
      toast.error('Lỗi xoá danh mục: ' + (err?.response?.data?.message || err.message));
    }
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

  const handleUpdateFeedback = async (id, payload) => {
    try {
      await updateFeedback(id, payload);
      toast.success('Đã cập nhật phản hồi.');
      loadData();
    } catch (err) {
      toast.error('Lỗi cập nhật phản hồi.');
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
    { id: 'reports', label: 'Báo cáo doanh thu', icon: <BarChart3 size={20} /> },
    { id: 'users', label: 'Khách hàng', icon: <Users size={20} /> },
    { id: 'shops', label: 'Cửa hàng (Shops)', icon: <Store size={20} /> },
    { id: 'costumes', label: 'Trang phục', icon: <Shirt size={20} /> },
    { id: 'orders', label: 'Đơn đặt thuê', icon: <ShoppingBag size={20} /> },
    { id: 'categories', label: 'Danh mục', icon: <Tags size={20} /> },
    { id: 'config', label: 'Cấu hình hệ thống', icon: <Settings size={20} /> },
    { id: 'coupons', label: 'Mã giảm giá', icon: <Ticket size={20} /> },
    { id: 'email_marketing', label: 'Email Marketing', icon: <Send size={20} /> },
    { id: 'complaints_logs', label: 'Tranh chấp & Logs', icon: <ShieldAlert size={20} /> },
    { id: 'withdrawals', label: 'Duyệt rút tiền', icon: <Wallet size={20} /> },
    { id: 'feedbacks', label: 'Góp ý / Báo lỗi', icon: <MessageSquarePlus size={20} /> },
    { id: 'chat', label: 'Hỗ trợ khách hàng', icon: <MessageSquare size={20} /> },
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

        
        {activeTab === 'reports' && <ReportsTab reportData={reportData} />}
        {activeTab === 'users' && <UsersTab customers={customers} handleToggleUserStatus={handleToggleUserStatus} />}
        {activeTab === 'shops' && <ShopsTab shops={shops} handleApproveLender={handleApproveLender} handleToggleUserStatus={handleToggleUserStatus} setSelectedShop={setSelectedShop} />}
        {activeTab === 'costumes' && <CostumesTab costumes={costumes} handleLockProduct={handleLockProduct} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} handleOverrideOrderStatus={handleOverrideOrderStatus} setSelectedOrder={setSelectedOrder} />}
        {activeTab === 'categories' && <CategoriesTab categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory} />}
        {activeTab === 'config' && <ConfigTab platformConfig={platformConfig} setPlatformConfig={setPlatformConfig} adminBankInfo={adminBankInfo} setAdminBankInfo={setAdminBankInfo} handleSaveConfig={handleSaveConfig} />}
        {activeTab === 'complaints_logs' && <ComplaintsLogsTab disputes={disputes} logs={logs} logStats={logStats} setResolvingDispute={setResolvingDispute} setResolutionForm={setResolutionForm} fetchLogStats={fetchLogStats} />}
        {activeTab === 'withdrawals' && <WithdrawalsTab withdrawals={withdrawals} handleProcessWithdrawal={handleProcessWithdrawal} visibleWithdrawalQr={visibleWithdrawalQr} setVisibleWithdrawalQr={setVisibleWithdrawalQr} />}
        {activeTab === 'feedbacks' && <FeedbacksTab feedbacks={feedbacks} handleUpdateFeedback={handleUpdateFeedback} />}
        {activeTab === 'coupons' && <CouponTab />}
        {activeTab === 'email_marketing' && <EmailMarketingTab />}
        {activeTab === 'chat' && <ChatTab conversations={conversations} selectedConvId={selectedConvId} setSelectedConvId={setSelectedConvId} />}
      </main>

      {/* MODAL: SHOP DETAIL */}
      {selectedShop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '26px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setSelectedShop(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
              {selectedShop.lenderProfile?.logoUrl
                ? <img src={selectedShop.lenderProfile.logoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '18px', objectFit: 'cover' }} />
                : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}>
                    <Store size={28} style={{ color: '#9ca3af' }} />
                  </div>
                )
              }
              <div>
                <h2 style={{ margin: 0 }}>{selectedShop.fullName}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>{selectedShop.email}</p>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', display: 'grid', gap: '12px' }}>
              <div><strong>Số điện thoại:</strong> {selectedShop.lenderProfile?.pickupAddress?.phone || selectedShop.phone || 'N/A'}</div>
              <div><strong>Địa chỉ:</strong> {(() => { const a = selectedShop.lenderProfile?.pickupAddress; return a ? [a.addressLine1, a.addressLine2, a.ward, a.district, a.city].filter(Boolean).join(', ') : 'N/A'; })()}</div>
              <div><strong>Tên cửa hàng:</strong> {selectedShop.lenderProfile?.lenderName || 'N/A'}</div>
              <div>
                <strong>Mô tả shop:</strong>
                <p style={{ margin: '4px 0', color: 'var(--muted)' }}>"{selectedShop.lenderProfile?.lenderDescription || 'N/A'}"</p>
              </div>
              <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '14px' }}>
                <strong>Hợp đồng điện tử:</strong>
                <p style={{ margin: '6px 0 3px', fontSize: '0.85rem' }}>• <strong>Trạng thái:</strong> {selectedShop.lenderProfile?.contractSignature ? '✅ Đã ký' : '❌ Chưa ký'}</p>
                {selectedShop.lenderProfile?.contractSignature && <p style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>• <strong>Chữ ký số:</strong> {selectedShop.lenderProfile.contractSignature}</p>}
                {selectedShop.lenderProfile?.agreedToTermsAt && <p style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>• <strong>Ngày ký:</strong> {new Date(selectedShop.lenderProfile.agreedToTermsAt).toLocaleDateString('vi-VN')}</p>}
              </div>
              <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '14px' }}>
                <strong>Chính sách cọc & phạt trễ hạn:</strong>
                <p style={{ margin: '6px 0 3px', fontSize: '0.85rem' }}>• <strong>Cọc:</strong> {selectedShop.lenderProfile?.rentalPolicy || 'Chưa cấu hình'}</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>• <strong>Phạt:</strong> {selectedShop.lenderProfile?.latePenaltyPolicy || 'Chưa cấu hình'}</p>
              </div>
              {selectedShop.lenderProfile?.businessLicenseUrl && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Giấy phép kinh doanh / CCCD:</strong>
                  <div style={{ marginTop: '8px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--surface-soft)', textAlign: 'center', padding: '10px' }}>
                    <img src={selectedShop.lenderProfile.businessLicenseUrl} alt="Giấy phép kinh doanh / CCCD" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '10px', objectFit: 'contain' }} />
                    <div style={{ marginTop: '8px' }}>
                      <a href={selectedShop.lenderProfile.businessLicenseUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '800', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ExternalLink size={14} style={{ color: 'var(--accent)' }} /> Xem ảnh kích thước lớn
                      </a>
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

      {/* MODAL: RESOLVE DISPUTE */}
      {resolvingDispute && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={handleResolveDispute} className="card" style={{ width: 'min(500px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative' }}>
            <button type="button" onClick={() => setResolvingDispute(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px' }}>Phân xử tranh chấp</h2>
            <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
              <strong>Đơn:</strong> {resolvingDispute.order?._id}<br />
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

      {/* MODAL: ORDER DETAIL */}
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
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.user?.fullName || selectedOrder.renter?.fullName || 'N/A'}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.user?.email || selectedOrder.renter?.email || 'N/A'}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>SĐT: {selectedOrder.shippingAddress?.phone || selectedOrder.renter?.phone || 'N/A'}</p>
              </div>
              <div>
                <strong>Đối tác Shop:</strong>
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.shop?.fullName || selectedOrder.lender?.lenderName || 'N/A'}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.shop?.email || selectedOrder.lender?.user?.email || 'N/A'}</p>
              </div>
            </div>
            <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '15px' }}>
              <div>• <strong>Thời gian:</strong> {date(selectedOrder.startDate)} → {date(selectedOrder.endDate)} ({selectedOrder.pricing?.rentalDays || 1} ngày)</div>
              {selectedOrder.actualReturnDate && <div style={{ marginTop: '4px' }}>• <strong>Trả thực tế:</strong> {date(selectedOrder.actualReturnDate)}</div>}
              <div style={{ marginTop: '4px' }}>• <strong>Trạng thái:</strong> <StatusBadge status={selectedOrder.status} /></div>
              <div style={{ marginTop: '4px' }}>• <strong>Thanh toán:</strong> <StatusBadge status={selectedOrder.paymentStatus} /></div>
              {selectedOrder.shippingAddress?.address && <div style={{ marginTop: '4px' }}>• <strong>Địa chỉ giao:</strong> {selectedOrder.shippingAddress.address} (người nhận: {selectedOrder.shippingAddress.fullName})</div>}
              {selectedOrder.note && <div style={{ marginTop: '4px' }}>• <strong>Ghi chú:</strong> "{selectedOrder.note}"</div>}
            </div>

            {/* Contract */}
            <button className="button" style={{ marginTop: '8px', width: '100%' }} onClick={(e) => { e.stopPropagation(); setShowContractModal(true); }}>
              📄 Xem Hợp đồng điện tử
            </button>

            {showContractModal && <ContractModal order={selectedOrder} role="admin" onClose={() => setShowContractModal(false)} />}

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Tiền thuê:</span><strong>{money(selectedOrder.pricing?.rentalFee)} đ</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Tiền cọc:</span><strong>{money(selectedOrder.pricing?.depositFee)} đ</strong></div>
              {(selectedOrder.pricing?.lateFee > 0 || selectedOrder.pricing?.damageFee > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: 'var(--danger)' }}><span>Phí phát sinh:</span><strong>+{money((selectedOrder.pricing?.lateFee || 0) + (selectedOrder.pricing?.damageFee || 0))} đ</strong></div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
              <span>Tổng số tiền giao dịch:</span>
              <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{money(selectedOrder.totalAmount || selectedOrder.pricing?.totalAmount)} đ</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end' }}>
              {selectedOrder.status === 'Pending' && (
                <button onClick={() => handleOverrideOrderStatus(selectedOrder._id, 'Approved')} className="primary-button">Duyệt nhận đơn</button>
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
