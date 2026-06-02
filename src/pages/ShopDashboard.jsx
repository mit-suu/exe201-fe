import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import api from '../services/api.js';
import { listShopProducts, createProduct, updateProduct, deleteProduct } from '../services/products.js';
import { getShopOrders, getShopRevenue, updateOrderStatus } from '../services/orders.js';
import { getShopReviews, replyToReview } from '../services/reviews.js';
import { getMyNotifications, markNotificationRead } from '../services/notifications.js';
import { updateProfile } from '../services/profile.js';
import { clearSession } from '../services/auth.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';
import { getBalance, updateBankAccount, withdrawWallet, depositWallet, getTransactions } from '../services/wallet.js';
import { QRCodeCanvas } from 'qrcode.react';
import { getPlatformConfig } from '../services/platform.js';
import { VIETNAM_BANKS } from '../constants/banks.js';
import { LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A';

const emptyProduct = {
  name: '',
  category: 'party',
  description: '',
  rentalPrice: '',
  depositPrice: '',
  sizes: [],
  color: '',
  images: [],
  stockQuantity: 1,
  condition: 'excellent',
  status: 'available',
  unavailableDates: []
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
  const safeRevenueStats = useMemo(() => ({
    dailyRevenue: Number(revenueStats?.dailyRevenue || 0),
    monthlyRevenue: Number(revenueStats?.monthlyRevenue || 0),
    totalRevenue: Number(revenueStats?.totalRevenue || 0),
    successfulOrders: Number(revenueStats?.successfulOrders || 0),
    cancelledOrders: Number(revenueStats?.cancelledOrders || 0),
    topProducts: Array.isArray(revenueStats?.topProducts) ? revenueStats.topProducts : []
  }), [revenueStats]);
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
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize'];
  const [customSize, setCustomSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Operational Modal States
  const [checkingInOrder, setCheckingInOrder] = useState(null);
  const [checkInImages, setCheckInImages] = useState('');

  const [checkingOutOrder, setCheckingOutOrder] = useState(null);
  const [checkOutImages, setCheckOutImages] = useState('');

  const [disputingOrder, setDisputingOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAmount, setDisputeAmount] = useState(0);
  const [newBusyDate, setNewBusyDate] = useState({ startDate: '', endDate: '', note: '' });
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState({});

  // Wallet States
  const [wallet, setWallet] = useState(null);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolderName: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [platformConfig, setPlatformConfig] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [pendingTxId, setPendingTxId] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Sync route tab change to state
  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  const loadData = async () => {
    try {
      const [prodData, ordData, revData, revsData, notifData, walletData, configData, txData] = await Promise.all([
        listShopProducts(),
        getShopOrders(),
        getShopRevenue(),
        getShopReviews(),
        getMyNotifications(),
        getBalance().catch(() => null),
        getPlatformConfig().catch(() => null),
        getTransactions().catch(() => null)
      ]);
      setProducts(Array.isArray(prodData?.items) ? prodData.items : Array.isArray(prodData) ? prodData : []);
      setOrders(Array.isArray(ordData) ? ordData : Array.isArray(ordData?.items) ? ordData.items : []);
      if (revData) setRevenueStats(revData);
      setReviews(Array.isArray(revsData) ? revsData : Array.isArray(revsData?.items) ? revsData.items : []);
      setNotifications(Array.isArray(notifData) ? notifData : Array.isArray(notifData?.items) ? notifData.items : []);
      if (walletData) {
        setWallet(walletData);
        if (walletData.bankAccount) {
          setBankForm(walletData.bankAccount);
        }
      }
      if (configData) {
        setPlatformConfig(configData);
      }
      if (txData) {
        setTransactions(txData.data || []);
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu cửa hàng.');
    }
  };

  useEffect(() => {
    loadData();

    // Khởi tạo Socket
    const socket = connectSocket();
    if (socket) {
      socket.on('new_order', (data) => {
        setMessage(`Bạn vừa có đơn thuê mới: ${data.productName} (Đã thanh toán cọc)`);
        loadData(); // Cập nhật lại dữ liệu Dashboard tự động
      });
      socket.on('wallet_updated', (data) => {
        setWallet(prev => ({ ...prev, balance: data.balance, frozenBalance: data.frozenBalance }));
        if (data.status === 'completed') {
          setQrCode(null);
          setPendingTxId(null);
          setMessage('Ting ting! Số dư ví của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
          getTransactions().then(txData => setTransactions(txData?.data || []));
        }
      });
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage(''); setError('');
      await updateBankAccount(bankForm);
      setMessage('Đã cập nhật thông tin ngân hàng thành công.');
      loadData();
    } catch (err) {
      setError('Lỗi cập nhật ngân hàng: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 50000) {
      return setError('Số tiền rút tối thiểu là 50,000 đ');
    }
    try {
      setMessage(''); setError('');
      await withdrawWallet(Number(withdrawAmount));
      setMessage('Đã gửi yêu cầu rút tiền thành công. Admin sẽ duyệt trong 24h.');
      setWithdrawAmount('');
      loadData();
    } catch (err) {
      setError('Lỗi rút tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      return setError('Số tiền nạp tối thiểu là 10.000 đ');
    }
    try {
      setMessage(''); setError('');
      const res = await depositWallet(Number(depositAmount));
      if (res.qrString) {
        setQrCode(res.qrString);
        setOrderCode(res.orderCode);
        setPendingTxId(res.transactionId);
        setMessage('Vui lòng dùng ứng dụng ngân hàng quét mã QR để chuyển khoản thanh toán.');
      }
      setDepositAmount('');
      loadData();
    } catch (err) {
      setError('Lỗi tạo yêu cầu nạp tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Helpers
  const lowInventoryProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity < 2);
  }, [products]);

  const allBusyDates = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.unavailableDates && p.unavailableDates.length > 0) {
        p.unavailableDates.forEach(bd => {
          list.push({ ...bd, productName: p.name, productId: p._id });
        });
      }
    });
    return list;
  }, [products]);

  // Handlers
  const handleSizeToggle = (sizeStr) => {
    setProductForm(prev => {
      const currentSizes = Array.isArray(prev.sizes) ? prev.sizes : [];
      if (currentSizes.includes(sizeStr)) {
        return { ...prev, sizes: currentSizes.filter(s => s !== sizeStr) };
      } else {
        return { ...prev, sizes: [...currentSizes, sizeStr] };
      }
    });
  };

  const handleAddCustomSize = () => {
    if (customSize.trim() && !productForm.sizes.includes(customSize.trim())) {
      setProductForm(prev => ({ ...prev, sizes: [...(Array.isArray(prev.sizes) ? prev.sizes : []), customSize.trim()] }));
      setCustomSize('');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploadingImages(true);
    setError('');

    try {
      const newUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrls.push(response.data.data.url);
      }
      setProductForm(prev => ({
        ...prev,
        images: [...(Array.isArray(prev.images) ? prev.images : []), ...newUrls]
      }));
    } catch (err) {
      setError('Lỗi tải ảnh lên: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsUploadingImages(false);
      e.target.value = null;
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setProductForm(prev => ({
      ...prev,
      images: Array.isArray(prev.images) ? prev.images.filter((_, idx) => idx !== indexToRemove) : []
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');

      const payload = {
        ...productForm,
        ownerType: 'lender',
        rentalPrice: Number(productForm.rentalPrice),
        depositPrice: Number(productForm.depositPrice || 0),
        stockQuantity: Number(productForm.stockQuantity || 1),
        sizes: Array.isArray(productForm.sizes) ? productForm.sizes : [],
        images: Array.isArray(productForm.images) ? productForm.images : []
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
      category: product.category?.slug || product.category || 'party',
      description: product.description || '',
      rentalPrice: product.rentalPrice || '',
      depositPrice: product.depositPrice || '',
      sizes: Array.isArray(product.sizes) ? product.sizes : (typeof product.sizes === 'string' ? product.sizes.split(',').map(s => s.trim()) : []),
      color: product.color || '',
      images: Array.isArray(product.images) ? product.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
      stockQuantity: product.stockQuantity || 1,
      condition: product.condition || 'excellent',
      status: product.status || 'available',
      unavailableDates: product.unavailableDates || []
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
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    const product = products.find(p => p._id === productId);
    if (!product) return;

    try {
      const updatedBusy = [...(product.unavailableDates || []), {
        startDate: new Date(newBusyDate.startDate),
        endDate: new Date(newBusyDate.endDate),
        reason: newBusyDate.note || 'Lịch bận'
      }];

      await updateProduct(productId, { unavailableDates: updatedBusy });
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
      const updatedBusy = (product.unavailableDates || []).filter((_, i) => i !== idx);
      await updateProduct(productId, { unavailableDates: updatedBusy });
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
    const topProducts = Array.isArray(safeRevenueStats.topProducts) ? safeRevenueStats.topProducts : [];
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
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'costumes', label: 'Trang phục của tôi', icon: <Shirt size={20} /> },
    { id: 'orders', label: 'Quản lý đơn thuê', icon: <ShoppingBag size={20} /> },
    { id: 'revenue', label: 'Doanh thu & Rút tiền', icon: <BarChart3 size={20} /> },
    { id: 'profile', label: 'Thông tin cửa hàng', icon: <Store size={20} /> },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: <Star size={20} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} /> }
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
          <span><LogOut size={20} /></span>
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

        {wallet && platformConfig && wallet.balance < -(platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000) && (
          <div className="alert" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2', padding: '20px', borderRadius: '14px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.08)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '6px' }}>CỬA HÀNG ĐANG TẠM NGƯNG HOẠT ĐỘNG (BỊ KHÓA DO NỢ PHÍ SÀN)</strong>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9 }}>
                  Cửa hàng của bạn đang nợ hệ thống: <strong style={{ textDecoration: 'underline' }}>{money(Math.abs(wallet.balance))} đ</strong> (Số dư ví: <strong>{money(wallet.balance)} đ</strong>).
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9 }}>
                  Hạn mức nợ phí sàn tối đa cho phép là <strong>-{money(platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000)} đ</strong>. Vì đã vượt quá hạn mức nợ, toàn bộ sản phẩm của shop hiện đã bị ẩn khỏi trang chủ.
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, fontWeight: 'bold' }}>
                  💡 Vui lòng nạp tối thiểu {money(Math.abs(wallet.balance))} đ để số dư ví trở lại mức an toàn và kích hoạt lại cửa hàng ngay lập tức.
                </p>
                <button
                  onClick={() => { setActiveTab('revenue'); navigate('/shop/revenue'); }}
                  className="button"
                  style={{ marginTop: '12px', background: '#991b1b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Thanh toán nợ ngay ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.lenderProfile?.status === 'Pending' && (
          <div className="alert" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', marginBottom: '20px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>⏳ Cửa hàng đang chờ duyệt</strong>
            Tài khoản của bạn đã được ghi nhận. Vui lòng chờ Admin duyệt hồ sơ để bắt đầu kinh doanh. Trong lúc này, tính năng Đăng sản phẩm sẽ bị tạm khóa.
          </div>
        )}

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
                          Khách hàng: {o.renter?.fullName || o.user?.fullName}
                        </p>
                        <p style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                          Trả: {money(o.pricing?.totalAmount || o.totalAmount)} đ • Thực nhận: <strong style={{ color: 'var(--accent)' }}>{money(o.pricing?.lenderRevenue)} đ</strong>
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
              <button
                className="primary-button"
                onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); setShowProductForm(true); }}
                disabled={user?.lenderProfile?.status === 'Pending'}
                style={{ opacity: user?.lenderProfile?.status === 'Pending' ? 0.5 : 1, cursor: user?.lenderProfile?.status === 'Pending' ? 'not-allowed' : 'pointer' }}
              >
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
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ background: 'white', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}
                  >
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
                  <input type="number" placeholder="Ví dụ: 150000" value={productForm.rentalPrice} onChange={(e) => setProductForm({ ...productForm, rentalPrice: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Tiền cọc yêu cầu (đ)</label>
                  <input type="number" placeholder="Ví dụ: 300000" value={productForm.depositPrice} onChange={(e) => setProductForm({ ...productForm, depositPrice: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Các Size sẵn có *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    {STANDARD_SIZES.map(sz => {
                      const isChecked = Array.isArray(productForm.sizes) && productForm.sizes.includes(sz);
                      return (
                        <label key={sz} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isChecked ? 'var(--primary-light)' : 'var(--surface-soft)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)', fontSize: '0.85rem' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleSizeToggle(sz)} style={{ margin: 0 }} />
                          {sz}
                        </label>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input placeholder="Nhập size khác (VD: 36, 37, XL+)" value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }} style={{ flex: 1 }} />
                    <button type="button" className="secondary-button" onClick={handleAddCustomSize} style={{ padding: '0 15px', minHeight: '44px' }}>Thêm</button>
                  </div>
                  {Array.isArray(productForm.sizes) && productForm.sizes.filter(s => !STANDARD_SIZES.includes(s)).length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>Size khác đã thêm:</span>
                      {productForm.sizes.filter(s => !STANDARD_SIZES.includes(s)).map(sz => (
                        <span key={sz} style={{ background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid var(--primary)' }}>
                          {sz} <button type="button" onClick={() => handleSizeToggle(sz)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
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
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Ảnh trang phục *</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--surface-soft)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: Array.isArray(productForm.images) && productForm.images.length > 0 ? '20px' : '0' }}>
                      {Array.isArray(productForm.images) && productForm.images.map((imgUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={imgUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>&times;</button>
                          {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '2px', textAlign: 'center' }}>Ảnh chính</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <button type="button" className="secondary-button" disabled={isUploadingImages}>
                        {isUploadingImages ? 'Đang tải ảnh lên...' : '+ Tải ảnh lên (Hỗ trợ nhiều ảnh)'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '10px', marginBottom: 0 }}>Hỗ trợ JPG, PNG. Ảnh đầu tiên sẽ làm ảnh đại diện.</p>
                  </div>
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
                    <img src={p.images[0]?.url || p.images[0]} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}>👗</div>
                  )}
                  <div style={{ marginLeft: '15px' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary-strong)' }}>{p.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Danh mục: <strong style={{ textTransform: 'capitalize' }}>{p.category?.name || p.category}</strong> • Giá: <strong>{money(p.rentalPrice)} đ/ngày</strong> • Cọc: <strong>{money(p.depositPrice)} đ</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '3px' }}>
                      Màu: {p.color || 'Không'} • Sizes: {p.sizes?.join(', ')} • Kho: <strong style={{ color: p.stockQuantity < 2 ? 'var(--danger)' : 'inherit' }}>{p.stockQuantity}</strong>
                    </p>

                    {/* Inline Calendar Busy Dates Manager */}
                    <div style={{ marginTop: '12px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary-strong)', display: 'block', marginBottom: '6px' }}>📅 Thiết lập Lịch bận cho trang phục này</span>

                      {p.unavailableDates && p.unavailableDates.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {p.unavailableDates.map((bd, bIdx) => (
                            <span key={bIdx} style={{ background: 'var(--surface-soft)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {date(bd.startDate)} - {date(bd.endDate)} ({bd.reason || bd.note})
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
                        Khách: <strong>{o.renter?.fullName || o.user?.fullName}</strong> • SĐT: {o.renter?.phone || o.user?.phone || 'N/A'}
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
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}
                      >
                        <option value="Pending">Chờ xác nhận (Pending)</option>
                        <option value="Approved">Đã xác nhận (Approved)</option>
                        <option value="Rented">Đang thuê (Rented)</option>
                        <option value="Returned">Đã trả đồ (Returned)</option>
                        <option value="Canceled">Hủy đơn (Canceled)</option>
                        <option value="Rejected">Từ chối (Rejected)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', fontSize: '0.82rem' }}>Chi tiết</button>
                      {o.status === 'Pending' && (
                        <button
                          onClick={async () => {
                            try {
                              const { confirmOrder } = await import('../services/orders.js');
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
        )}

        {/* ── SUB-PAGE 4: REVENUE & STATS ───────────────────── */}
        {activeTab === 'revenue' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="admin-section-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
              <div className="card" style={{ alignSelf: 'start' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary-strong), var(--primary))', color: 'white', padding: '25px', borderRadius: '18px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                  <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '0.9rem', fontWeight: 600 }}>Số dư khả dụng</p>
                  <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>
                    {money(wallet?.balance)} <span style={{ fontSize: '1rem', opacity: 0.8 }}>đ</span>
                  </h2>
                  {wallet?.balance < 0 && (
                    <div style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.25)', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fca5a5' }}>
                      ⚠️ Đang nợ phí dịch vụ: {money(Math.abs(wallet.balance))} đ
                    </div>
                  )}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', opacity: 0.8 }}>Tiền đóng băng (Cọc)</p>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{money(wallet?.frozenBalance)} đ</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', opacity: 0.8 }}>Tổng tài sản</p>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{money((wallet?.balance || 0) + (wallet?.frozenBalance || 0))} đ</h3>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '15px', background: 'var(--surface-soft)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: '1.4' }}>
                  <span>ℹ️</span>
                  <span>
                    Hạn mức nợ phí sàn tối đa cho phép: <strong>-{money(platformConfig?.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000)} đ</strong>. Cửa hàng sẽ bị khóa nếu số dư ví khả dụng âm vượt quá hạn mức này.
                  </span>
                </div>

                {/* Quick Transaction Section */}
                <div style={{ marginTop: '25px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Giao dịch nhanh</h3>

                  {/* Form Nạp tiền */}
                  <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="number"
                      placeholder="Nhập số tiền nạp..."
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" className="primary-button" style={{ whiteSpace: 'nowrap' }}>Nạp tiền</button>
                  </form>
                  {wallet?.balance < 0 && (
                    <button
                      type="button"
                      onClick={() => setDepositAmount(Math.abs(wallet.balance).toString())}
                      className="button"
                      style={{ width: '100%', marginBottom: '15px', color: '#991b1b', background: '#fef2f2', border: '1px solid #fee2e2', fontWeight: 'bold', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      💡 Tự động điền số tiền trả nợ: {money(Math.abs(wallet.balance))} đ
                    </button>
                  )}

                  {qrCode && (
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '15px', color: 'var(--text)' }}>Quét mã QR để nạp tiền</p>

                      <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <QRCodeCanvas value={qrCode} size={160} level="M" />
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'left', background: 'white', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>Nội dung chuyển khoản (BẮT BUỘC):</p>
                        <h3 style={{ margin: 0, color: 'var(--primary-strong)', fontSize: '1.3rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{orderCode}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '8px', marginBottom: 0 }}>
                          * Ghi chính xác nội dung trên để hệ thống tự động cộng tiền.
                        </p>
                      </div>

                      <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                        ⌛ Đang chờ thanh toán nhận diện...
                      </p>

                      <button
                        type="button"
                        className="button"
                        style={{ marginTop: '10px', width: '100%' }}
                        onClick={() => { setQrCode(null); setPendingTxId(null); loadData(); }}
                      >
                        Đóng
                      </button>
                    </div>
                  )}

                  {/* Form Rút tiền */}
                  <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                    <input
                      type="number"
                      placeholder="Nhập số tiền rút..."
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" className="button" style={{ whiteSpace: 'nowrap' }}>Rút tiền</button>
                  </form>
                </div>
              </div>

              <div className="card" style={{ alignSelf: 'start' }}>
                <h3 style={{ margin: '0 0 20px 0' }}>Tài khoản ngân hàng</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>
                  Vui lòng nhập chính xác để nhận tiền rút doanh thu từ hệ thống.
                </p>
                <form onSubmit={handleBankSubmit} style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Ngân hàng</label>
                    <select
                      value={bankForm.bankName}
                      onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">-- Chọn Ngân hàng --</option>
                      {VIETNAM_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Số Tài khoản</label>
                      <input
                        placeholder="VD: 1029384756"
                        value={bankForm.accountNumber}
                        onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Chủ Tài khoản</label>
                      <input
                        placeholder="VD: NGUYEN VAN A"
                        value={bankForm.accountHolderName}
                        onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value.toUpperCase() })}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="primary-button" style={{ marginTop: '10px' }}>Lưu thông tin</button>
                </form>
              </div>
            </div>

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

            {/* Lịch sử giao dịch ví của Shop */}
            <article className="card" style={{ marginTop: '20px' }}>
              <div className="section-heading compact-heading">
                <p className="eyebrow">Lịch sử tài chính</p>
                <h2>Lịch sử giao dịch ví của Shop</h2>
              </div>
              {transactions.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '15px' }}>Chưa có lịch sử giao dịch nào.</div>
              ) : (
                <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                  {transactions.slice(0, 15).map(tx => (
                    <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', textTransform: 'capitalize', fontSize: '0.95rem' }}>
                          {tx.type === 'deposit' ? 'Nạp tiền' : tx.type === 'withdrawal' ? 'Rút tiền' : tx.type === 'payment' ? 'Thanh toán' : tx.type === 'refund' ? 'Hoàn tiền' : tx.type}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.description}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: ['deposit', 'refund'].includes(tx.type) ? 'var(--success)' : 'var(--danger)', fontSize: '1rem' }}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}{money(tx.amount)} đ
                        </strong>
                        <span style={{
                          display: 'block', fontSize: '0.75rem', fontWeight: 'bold',
                          color: tx.status === 'completed' ? 'var(--success)' : tx.status === 'pending' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
        )}

        {/* Removed WALLET & WITHDRAWAL sub-page */}

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
                      rentalPrice: selectedOrder.product?.rentalPrice || 0,
                      subtotal: selectedOrder.subtotal || 0
                    }
                  ]).map((item, idx) => (
                    <tr style={{ borderBottom: '1px solid var(--border)' }} key={idx}>
                      <td style={{ padding: '12px', fontWeight: '800' }}>{item.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.size}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{money(item.rentalPrice || selectedOrder.pricing?.rentalFee)} đ</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{money(item.subtotal || selectedOrder.pricing?.rentalFee)} đ</td>
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
                  <strong>{money(selectedOrder.pricing?.rentalFee || selectedOrder.subtotal)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Tiền đặt cọc:</span>
                  <strong>{money(selectedOrder.pricing?.depositFee || selectedOrder.depositPrice)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Phí phụ thu:</span>
                  <span>+ {money((selectedOrder.pricing?.lateFee || 0) + (selectedOrder.pricing?.damageFee || 0) + (selectedOrder.pricing?.shippingFee || 0) || selectedOrder.extraFee || 0)} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Tổng khách trả:</span>
                  <strong>{money(selectedOrder.pricing?.totalAmount || selectedOrder.totalAmount)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Thực nhận (trừ phí sàn):</span>
                  <strong style={{ color: 'var(--accent)' }}>{money(selectedOrder.pricing?.lenderRevenue)} đ</strong>
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

      {/* Check-in Modal Overlay */}
      {checkingInOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setError('');
              setMessage('');
              const qrCodeToken = document.getElementById('checkInQrToken').value;
              const { checkInOrder } = await import('../services/orders.js');
              await checkInOrder(checkingInOrder._id, { qrCodeToken, images: checkInImages ? checkInImages.split(',') : [] });
              setMessage('Check-in giao đồ thành công!');
              setCheckingInOrder(null);
              loadData();
            } catch (err) {
              setError('Lỗi Check-in: ' + (err?.response?.data?.message || err.message));
            }
          }} className="card" style={{
            width: 'min(450px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative'
          }}>
            <button type="button" onClick={() => setCheckingInOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px' }}>Check-in Giao Đồ</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Xác thực mã QR hoặc Token từ khách hàng để hoàn tất thủ tục giao trang phục.
            </p>

            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '800' }}>Mã QR / Token của khách</label>
              <input
                id="checkInQrToken"
                type="text"
                placeholder="Dán mã Token vào đây..."
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '800' }}>Link hình ảnh tình trạng giao (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Cách nhau bởi dấu phẩy nếu nhiều link..."
                value={checkInImages}
                onChange={(e) => setCheckInImages(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCheckingInOrder(null)} className="secondary-button">Hủy</button>
              <button className="primary-button" type="submit">Xác nhận Giao đồ</button>
            </div>
          </form>
        </div>
      )}

      {/* Check-out Modal Overlay */}
      {checkingOutOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setError('');
              setMessage('');
              const { checkOutOrder } = await import('../services/orders.js');
              await checkOutOrder(checkingOutOrder._id, { images: checkOutImages ? checkOutImages.split(',') : [] });
              setMessage('Check-out nhận lại đồ thành công! Cọc sẽ được hoàn tự động.');
              setCheckingOutOrder(null);
              loadData();
            } catch (err) {
              setError('Lỗi Check-out: ' + (err?.response?.data?.message || err.message));
            }
          }} className="card" style={{
            width: 'min(450px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative'
          }}>
            <button type="button" onClick={() => setCheckingOutOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px' }}>Check-out Nhận Đồ</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Xác nhận bạn đã nhận lại trang phục nguyên vẹn từ khách hàng.
            </p>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '800' }}>Link hình ảnh tình trạng nhận lại (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Cách nhau bởi dấu phẩy..."
                value={checkOutImages}
                onChange={(e) => setCheckOutImages(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCheckingOutOrder(null)} className="secondary-button">Hủy</button>
              <button className="primary-button" style={{ background: 'var(--success)', borderColor: 'var(--success)' }} type="submit">Xác nhận Nhận đồ</button>
            </div>
          </form>
        </div>
      )}

      {/* Dispute Modal Overlay (Lender) */}
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
              setMessage('');
              const { createDispute } = await import('../services/dispute.js');
              await createDispute({
                orderId: disputingOrder._id,
                reason: disputeReason,
                description: 'Lender báo cáo sự cố khi nhận lại đồ.',
                requestedAmount: disputeAmount
              });
              setMessage('Đã gửi khiếu nại. Admin sẽ vào phân xử tiền cọc.');
              setDisputingOrder(null);
              loadData();
            } catch (err) {
              setError('Lỗi khiếu nại: ' + (err?.response?.data?.message || err.message));
            }
          }} className="card" style={{
            width: 'min(450px, 100%)', background: 'white', borderRadius: '24px', padding: '30px', position: 'relative'
          }}>
            <button type="button" onClick={() => setDisputingOrder(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-soft)', border: '0', fontSize: '1.2rem', display: 'grid', placeItems: 'center' }}>×</button>
            <h2 style={{ margin: '0 0 15px', color: 'var(--danger)' }}>Báo hỏng / Trừ cọc</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Yêu cầu trừ tiền cọc từ khách hàng. Vui lòng cung cấp lý do chính đáng.
            </p>

            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '800' }}>Lý do khiếu nại</label>
              <input
                type="text"
                placeholder="VD: Rách áo, thiếu phụ kiện..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '800' }}>Số tiền muốn trừ (VNĐ)</label>
              <input
                type="number"
                min="0"
                placeholder="Nhập số tiền..."
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(Number(e.target.value))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDisputingOrder(null)} className="secondary-button">Hủy</button>
              <button className="primary-button danger" type="submit">Gửi khiếu nại</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
