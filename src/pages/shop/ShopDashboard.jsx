import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge.jsx';
import api from '../../services/api.js';
import { listLenderProducts, createProduct, updateProduct, deleteProduct } from '../../services/products.js';
import { getLenderOrders, getLenderRevenue, updateOrderStatus } from '../../services/orders.js';
import { getLenderReviews, replyToReview } from '../../services/reviews.js';
import { getMyNotifications, markNotificationRead } from '../../services/notifications.js';
import { getProfile, updateProfile, updateLenderProfile } from '../../services/profile.js';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';
import { clearSession } from '../../services/auth.js';
import ContractModal from '../../components/ContractModal.jsx';
import { connectSocket, disconnectSocket } from '../../services/socket.js';
import { getBalance, updateBankAccount, withdrawWallet, depositWallet, getTransactions } from '../../services/wallet.js';
import { QRCodeCanvas } from 'qrcode.react';
import { getPlatformConfig } from '../../services/platform.js';
import { VIETNAM_BANKS, VIETNAM_BANKS_MAP } from '../../constants/banks.js';
import { LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download, AlertTriangle, Clock, Info, AlertCircle, Lock, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

import DashboardTab from './DashboardTab.jsx';
import CostumesTab from './CostumesTab.jsx';
import OrdersTab from './OrdersTab.jsx';
import RevenueTab from './RevenueTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import ReviewsTab from './ReviewsTab.jsx';
import NotificationsTab from './NotificationsTab.jsx';
import SupportTab from './SupportTab.jsx';


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
  const [shopStatus, setShopStatus] = useState(user?.lenderProfile?.status || user?.profiles?.lender?.status || 'Pending');

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
    latePenaltyPolicy: user?.lenderProfile?.latePenaltyPolicy || '',
    city: '',
    district: '',
    ward: '',
    latitude: '',
    longitude: '',
    formattedAddress: '',
    googlePlaceId: ''
  });

  // UI state
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Freesize'];
  const [customSize, setCustomSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Operational Modal States
  const [checkingInOrder, setCheckingInOrder] = useState(null);
  const [checkInImages, setCheckInImages] = useState('');

  const [checkingOutOrder, setCheckingOutOrder] = useState(null);
  const [checkOutImages, setCheckOutImages] = useState('');

  const [disputingOrder, setDisputingOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAmount, setDisputeAmount] = useState(0);
  const [newBusyDate, setNewBusyDate] = useState({ startDate: '', endDate: '', note: '' });
  const [replyText, setReplyText] = useState({});

  // Wallet States
  const [wallet, setWallet] = useState(null);
  const [bankForm, setBankForm] = useState({ bin: '', bankName: '', accountNumber: '', accountHolderName: '' });
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
      const [prodData, ordData, revData, revsData, notifData, walletData, configData, txData, userProfile] = await Promise.all([
        listLenderProducts(),
        getLenderOrders(),
        getLenderRevenue(),
        getLenderReviews(),
        getMyNotifications(),
        getBalance().catch(() => null),
        getPlatformConfig().catch(() => null),
        getTransactions().catch(() => null),
        getProfile().catch(() => null)
      ]);
      setProducts(Array.isArray(prodData?.items) ? prodData.items : Array.isArray(prodData) ? prodData : []);
      setOrders(Array.isArray(ordData) ? ordData : Array.isArray(ordData?.items) ? ordData.items : []);
      if (revData) setRevenueStats(revData);
      setReviews(Array.isArray(revsData) ? revsData : Array.isArray(revsData?.items) ? revsData.items : []);
      setNotifications(Array.isArray(notifData) ? notifData : Array.isArray(notifData?.items) ? notifData.items : []);
      if (walletData) {
        setWallet(walletData);
        if (walletData.bankAccount) {
          const bankAcc = { ...walletData.bankAccount };
          if (!bankAcc.bin && bankAcc.bankName) {
            bankAcc.bin = VIETNAM_BANKS_MAP[bankAcc.bankName] || '';
          }
          setBankForm(bankAcc);
        }
      }
      if (configData) {
        setPlatformConfig(configData);
      }
      if (txData) {
        setTransactions(txData.data || []);
      }
      if (userProfile) {
        localStorage.setItem('exe201-user', JSON.stringify(userProfile));
        const lender = userProfile.profiles?.lender || {};
        if (lender.status) setShopStatus(lender.status);
        setProfileForm((prev) => ({
          ...prev,
          fullName: userProfile.fullName || '',
          email: userProfile.email || '',
          bio: lender.lenderDescription || lender.bio || '',
          logoUrl: lender.logoUrl || '',
          address: lender.pickupAddress?.addressLine1 || lender.address || '',
          phone: lender.pickupAddress?.phone || lender.phone || '',
          rentalPolicy: lender.rentalPolicy || '',
          latePenaltyPolicy: lender.latePenaltyPolicy || '',
          city: lender.pickupAddress?.city || '',
          district: lender.pickupAddress?.district || '',
          ward: lender.pickupAddress?.ward || '',
          latitude: lender.location?.coordinates?.[1] || '',
          longitude: lender.location?.coordinates?.[0] || '',
          formattedAddress: lender.location?.formattedAddress || '',
          googlePlaceId: lender.location?.googlePlaceId || ''
        }));
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu cửa hàng.');
    }
  };

  useEffect(() => {
    loadData();

    // Khởi tạo Socket
    const socket = connectSocket();
    if (socket) {
      socket.on('new_order', (data) => {
        toast.success(`Bạn vừa có đơn thuê mới: ${data.productName} (Đã thanh toán cọc)`);
        loadData(); // Cập nhật lại dữ liệu Dashboard tự động
      });
      socket.on('wallet_updated', (data) => {
        setWallet(prev => ({ ...prev, balance: data.balance, frozenBalance: data.frozenBalance }));
        if (data.status === 'completed') {
          setQrCode(null);
          setPendingTxId(null);
          toast.success('Ting ting! Số dư ví của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
          getTransactions().then(txData => setTransactions(txData?.data || []));
        }
      });
    }
  }, []);


  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBankAccount(bankForm);
      toast.success('Đã cập nhật thông tin ngân hàng thành công.');
      loadData();
    } catch (err) {
      toast.error('Lỗi cập nhật ngân hàng: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 50000) {
      return toast.error('Số tiền rút tối thiểu là 50,000 đ');
    }
    try {
      await withdrawWallet(Number(withdrawAmount));
      toast.success('Đã gửi yêu cầu rút tiền thành công. Admin sẽ duyệt trong 24h.');
      setWithdrawAmount('');
      loadData();
    } catch (err) {
      toast.error('Lỗi rút tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      return toast.error('Số tiền nạp tối thiểu là 10.000 đ');
    }
    try {
      const res = await depositWallet(Number(depositAmount));
      if (res.qrString) {
        setQrCode(res.qrString);
        setOrderCode(res.orderCode);
        setPendingTxId(res.transactionId);
        toast.success('Vui lòng dùng ứng dụng ngân hàng quét mã QR để chuyển khoản thanh toán.');
      }
      setDepositAmount('');
      loadData();
    } catch (err) {
      toast.error('Lỗi tạo yêu cầu nạp tiền: ' + (err?.response?.data?.message || err.message));
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
      toast.error('Lỗi tải ảnh lên: ' + (err?.response?.data?.message || err.message));
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
        toast.success('Đã cập nhật trang phục thành công.');
      } else {
        await createProduct(payload);
        toast.success('Đã thêm trang phục mới thành công.');
      }

      setProductForm(emptyProduct);
      setEditingProductId(null);
      setShowProductForm(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu trang phục.');
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
      await deleteProduct(id);
      toast.success('Đã ẩn sản phẩm thành công.');
      loadData();
    } catch (err) {
      toast.error('Lỗi khi ẩn sản phẩm.');
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
      toast.success('Đã cập nhật lịch bận cho trang phục.');
      loadData();
    } catch (err) {
      toast.error('Không thể cập nhật lịch bận.');
    }
  };

  const handleRemoveBusyDate = async (productId, idx) => {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    try {
      const updatedBusy = (product.unavailableDates || []).filter((_, i) => i !== idx);
      await updateProduct(productId, { unavailableDates: updatedBusy });
      toast.success('Đã xóa lịch bận thành công.');
      loadData();
    } catch (err) {
      toast.error('Không thể cập nhật lịch bận.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Đã cập nhật trạng thái đơn đặt.');
      if (selectedOrder) setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn đặt.');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;
    try {
      await replyToReview(reviewId, text);
      toast.success('Đã gửi phản hồi đánh giá.');
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      loadData();
    } catch (err) {
      toast.error('Lỗi gửi phản hồi.');
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
      // 1. Update user full name
      const updatedUser = await updateProfile({ fullName: profileForm.fullName });
      
      // 2. Update lender profile details on backend
      const lenderPayload = {
        lenderName: profileForm.fullName,
        lenderDescription: profileForm.bio,
        pickupAddress: {
          phone: profileForm.phone,
          addressLine1: profileForm.address,
          addressLine2: '',
          city: profileForm.city || '',
          district: profileForm.district || '',
          ward: profileForm.ward || ''
        },
        latitude: profileForm.latitude ? parseFloat(profileForm.latitude) : undefined,
        longitude: profileForm.longitude ? parseFloat(profileForm.longitude) : undefined,
        formattedAddress: profileForm.formattedAddress,
        googlePlaceId: profileForm.googlePlaceId,
        rentalPolicy: profileForm.rentalPolicy,
        latePenaltyPolicy: profileForm.latePenaltyPolicy
      };

      await updateLenderProfile(lenderPayload);
      
      toast.success('Đã cập nhật cấu hình cửa hàng & vị trí bản đồ thành công.');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Lỗi cập nhật thông tin.');
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

  const props = {
    user, shopStatus, products, orders, reviews, lowInventoryProducts, allBusyDates, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleBankSubmit,
    withdrawAmount, setWithdrawAmount, handleWithdraw,
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
    productForm, setProductForm, emptyProduct,
    showProductForm, setShowProductForm,
    editingProductId, setEditingProductId,
    handleProductSubmit,
    STANDARD_SIZES, handleSizeToggle,
    customSize, setCustomSize, handleAddCustomSize,
    handleRemoveImage, handleImageUpload, isUploadingImages,
    platformConfig, depositAmount, setDepositAmount, qrCode, setQrCode, orderCode, setOrderCode, pendingTxId, setPendingTxId, handleDeposit,
    VIETNAM_BANKS, VIETNAM_BANKS_MAP
  };

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
        {shopStatus === 'Pending' ? (
          <div className="card" style={{ textAlign: 'center', padding: '100px 20px', background: 'white', marginTop: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '24px', background: 'var(--surface-soft)', borderRadius: '50%', marginBottom: '24px' }}>
              <Lock size={64} style={{ color: 'var(--muted)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.8rem' }}>Gian hàng đang chờ duyệt</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              Hồ sơ đăng ký mở gian hàng của bạn đã được gửi đến Ban Quản Trị. Vui lòng chờ Admin xem xét và phê duyệt. Bạn sẽ nhận được email thông báo ngay khi gian hàng được kích hoạt để bắt đầu kinh doanh.
            </p>
          </div>
        ) : shopStatus === 'Rejected' ? (
          <div className="card" style={{ textAlign: 'center', padding: '100px 20px', background: '#fef2f2', border: '1px solid #fee2e2', marginTop: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '24px', background: 'white', borderRadius: '50%', marginBottom: '24px' }}>
              <AlertCircle size={64} style={{ color: 'var(--danger)' }} />
            </div>
            <h2 style={{ marginBottom: '12px', fontSize: '1.8rem', color: 'var(--danger)' }}>Yêu cầu mở gian hàng bị từ chối</h2>
            <p style={{ color: 'var(--danger)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
              Hồ sơ của bạn không đáp ứng đủ các tiêu chí của hệ thống hoặc có thông tin không hợp lệ. Vui lòng liên hệ Admin qua kênh Hỗ trợ để biết thêm chi tiết.
            </p>
          </div>
        ) : (
          <>
        <section className="card admin-hero-card" style={{ background: 'white' }}>
          <div>
            <p className="eyebrow">Cửa hàng BuildLab</p>
            <h1>{menuItems.find(item => item.id === activeTab)?.label}</h1>
            <p>Quản lý trang phục cho thuê, theo dõi trạng thái giao nhận đơn thuê và thiết lập chính sách bán hàng.</p>
          </div>
        </section>

        {wallet && platformConfig && wallet.balance < -(platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000) && (
          <div className="alert" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2', padding: '20px', borderRadius: '14px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.08)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle size={24} style={{ color: '#b91c1c', flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '6px' }}>CỬA HÀNG ĐANG TẠM NGƯNG HOẠT ĐỘNG (BỊ KHÓA DO NỢ PHÍ SÀN)</strong>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9 }}>
                  Cửa hàng của bạn đang nợ hệ thống: <strong style={{ textDecoration: 'underline' }}>{money(Math.abs(wallet.balance))} đ</strong> (Số dư ví: <strong>{money(wallet.balance)} đ</strong>).
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9 }}>
                  Hạn mức nợ phí sàn tối đa cho phép là <strong>-{money(platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000)} đ</strong>. Vì đã vượt quá hạn mức nợ, toàn bộ sản phẩm của shop hiện đã bị ẩn khỏi trang chủ.
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={16} /> Vui lòng nạp tối thiểu {money(Math.abs(wallet.balance))} đ để số dư ví trở lại mức an toàn và kích hoạt lại cửa hàng ngay lập tức.
                </p>
                <button
                  onClick={() => { setActiveTab('revenue'); navigate('/shop/revenue'); }}
                  className="button"
                  style={{ marginTop: '12px', background: '#991b1b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Thanh toán nợ ngay →
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.lenderProfile?.status === 'Pending' && (
          <div className="alert" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', marginBottom: '20px' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
              <Clock size={16} /> Cửa hàng đang chờ duyệt
            </strong>
            Tài khoản của bạn đã được ghi nhận. Vui lòng chờ Admin duyệt hồ sơ để bắt đầu kinh doanh. Trong lúc này, tính năng Đăng sản phẩm sẽ bị tạm khóa.
          </div>
        )}

        {/* ── SUB-PAGE 1: OVERVIEW DASHBOARD ────────────────── */}
        
        {activeTab === 'dashboard' && <DashboardTab {...props} />}
        {activeTab === 'costumes' && <CostumesTab {...props} />}
        {activeTab === 'orders' && <OrdersTab {...props} />}
        {activeTab === 'revenue' && <RevenueTab {...props} />}
        {activeTab === 'profile' && <ProfileTab {...props} />}
        {activeTab === 'reviews' && <ReviewsTab {...props} />}
        {activeTab === 'notifications' && <NotificationsTab {...props} />}
        {activeTab === 'support' && <SupportTab />}
        </>
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
                <p style={{ margin: '4px 0' }}><strong>{selectedOrder.renter?.fullName || selectedOrder.user?.fullName}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.renter?.email || selectedOrder.user?.email}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>SĐT: {selectedOrder.shippingAddress?.phone || selectedOrder.renter?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Địa chỉ giao: {selectedOrder.shippingAddress?.address || 'N/A'}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Người nhận: {selectedOrder.shippingAddress?.fullName || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Thời gian thuê:</strong>
                <p style={{ margin: '4px 0' }}>Từ: <strong>{date(selectedOrder.startDate || selectedOrder.rentalStartDate)}</strong></p>
                <p style={{ margin: '2px 0' }}>Đến: <strong>{date(selectedOrder.endDate || selectedOrder.rentalEndDate)}</strong></p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Tổng cộng: {selectedOrder.pricing?.rentalDays || selectedOrder.rentalDays} ngày</p>
                {selectedOrder.actualReturnDate && <p style={{ margin: '2px 0', color: 'var(--success)' }}>Trả thực tế: {date(selectedOrder.actualReturnDate)}</p>}
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Thanh toán: <StatusBadge status={selectedOrder.paymentStatus} /></p>
              </div>
            </div>

            {/* QR Code & Token */}
            {selectedOrder.status === 'Approved' && selectedOrder.qrCodeToken && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>Mã QR Check-in (đưa cho khách quét)</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 10px' }}>Token: <code style={{ background: '#fff', padding: '2px 8px', borderRadius: '4px', userSelect: 'all' }}>{selectedOrder.qrCodeToken}</code></p>
                <QRCodeCanvas value={selectedOrder.qrCodeToken} size={140} style={{ background: 'white', padding: '8px', borderRadius: '12px', border: '1px solid var(--border)' }} />
              </div>
            )}

            {/* Items Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Trang phục</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Size</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Giá thuê/ngày</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Số ngày</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: '800' }}>{selectedOrder.product?.name || 'Trang phục thuê'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{selectedOrder.product?.size || selectedOrder.size || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{money(selectedOrder.pricing?.rentalFee / (selectedOrder.pricing?.rentalDays || 1))} đ</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{selectedOrder.pricing?.rentalDays || 1}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{money(selectedOrder.pricing?.rentalFee)} đ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invoice billing details */}
            <div style={{ display: 'grid', gap: '20px', fontSize: '0.9rem' }}>
              <div>
                <strong>Ghi chú từ khách:</strong>
                <p style={{ fontStyle: 'italic', color: 'var(--muted)', marginTop: '4px' }}>
                  "{selectedOrder.note || 'Không có ghi chú.'}"
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Tiền thuê ({selectedOrder.pricing?.rentalDays || 1} ngày):</span>
                  <strong>{money(selectedOrder.pricing?.rentalFee)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Tiền đặt cọc (hoàn trả):</span>
                  <strong>{money(selectedOrder.pricing?.depositFee)} đ</strong>
                </div>
                {(selectedOrder.pricing?.insuranceFee > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Phí bảo hiểm:</span>
                  <span>+ {money(selectedOrder.pricing.insuranceFee)} đ</span>
                </div>}
                {(selectedOrder.pricing?.shippingFee > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>Phí vận chuyển:</span>
                  <span>+ {money(selectedOrder.pricing.shippingFee)} đ</span>
                </div>}
                {(selectedOrder.pricing?.lateFee > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--danger)' }}>
                  <span>Phí trễ hạn:</span>
                  <span>+ {money(selectedOrder.pricing.lateFee)} đ</span>
                </div>}
                {(selectedOrder.pricing?.damageFee > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--danger)' }}>
                  <span>Phí hư hỏng:</span>
                  <span>+ {money(selectedOrder.pricing.damageFee)} đ</span>
                </div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid var(--border)', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Tổng khách trả:</span>
                  <strong>{money(selectedOrder.pricing?.totalAmount || selectedOrder.totalAmount)} đ</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '1.15rem' }}>
                  <span style={{ fontWeight: '850' }}>Thực nhận (sau phí sàn):</span>
                  <strong style={{ color: 'var(--accent)' }}>{money(selectedOrder.pricing?.lenderRevenue)} đ</strong>
                </div>
              </div>
            </div>

            {/* Contract Section */}
            <div style={{ marginBottom: '20px', marginTop: '20px', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>📄 Hợp đồng điện tử</strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>Ký hợp đồng giữa shop và người thuê</p>
              </div>
              <button className="primary-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => setShowContractModal(true)}>
                Xem & Ký hợp đồng
              </button>
            </div>

            {showContractModal && <ContractModal order={selectedOrder} role="lender" onClose={() => setShowContractModal(false)} />}

            {/* Quick Actions in Detail Modal */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {selectedOrder.status === 'Pending' && (
                <>
                  <button onClick={() => handleStatusChange(selectedOrder._id, 'Approved')} className="primary-button" style={{ minHeight: '44px' }}>Duyệt nhận đơn</button>
                  <button onClick={() => handleStatusChange(selectedOrder._id, 'Rejected')} className="primary-button danger" style={{ minHeight: '44px' }}>Từ chối đơn</button>
                </>
              )}
              {selectedOrder.status === 'Approved' && (
                <button onClick={() => handleStatusChange(selectedOrder._id, 'Rented')} className="primary-button" style={{ minHeight: '44px' }}>Khách đã nhận đồ (Rented)</button>
              )}
              {selectedOrder.status === 'Rented' && (
                <button onClick={() => handleStatusChange(selectedOrder._id, 'Returned')} className="primary-button" style={{ minHeight: '44px' }}>Khách đã trả đồ thành công</button>
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
              const qrCodeToken = document.getElementById('checkInQrToken').value;
              const { checkInOrder } = await import('../../services/orders.js');
              await checkInOrder(checkingInOrder._id, { qrCodeToken, images: checkInImages ? checkInImages.split(',') : [] });
              toast.success('Check-in giao đồ thành công!');
              setCheckingInOrder(null);
              loadData();
            } catch (err) {
              toast.error('Lỗi Check-in: ' + (err?.response?.data?.message || err.message));
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
              const { checkOutOrder } = await import('../../services/orders.js');
              await checkOutOrder(checkingOutOrder._id, { images: checkOutImages ? checkOutImages.split(',') : [] });
              toast.success('Check-out nhận lại đồ thành công! Cọc sẽ được hoàn tự động.');
              setCheckingOutOrder(null);
              loadData();
            } catch (err) {
              toast.error('Lỗi Check-out: ' + (err?.response?.data?.message || err.message));
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
              const { createDispute } = await import('../../services/dispute.js');
              await createDispute({
                orderId: disputingOrder._id,
                reason: disputeReason,
                description: 'Lender báo cáo sự cố khi nhận lại đồ.',
                requestedAmount: disputeAmount
              });
              toast.success('Đã gửi khiếu nại. Admin sẽ vào phân xử tiền cọc.');
              setDisputingOrder(null);
              loadData();
            } catch (err) {
              toast.error('Lỗi khiếu nại: ' + (err?.response?.data?.message || err.message));
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


