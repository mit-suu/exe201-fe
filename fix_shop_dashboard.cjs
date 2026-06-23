const fs = require('fs');

let code = fs.readFileSync('shop_dash_backup.jsx', 'utf8');

const imports = `
import DashboardTab from './DashboardTab.jsx';
import CostumesTab from './CostumesTab.jsx';
import OrdersTab from './OrdersTab.jsx';
import RevenueTab from './RevenueTab.jsx';
import ProfileTab from './ProfileTab.jsx';
import ReviewsTab from './ReviewsTab.jsx';
import NotificationsTab from './NotificationsTab.jsx';
import SupportTab from './SupportTab.jsx';
`;

code = code.replace("import { toast } from 'react-hot-toast';", "import { toast } from 'react-hot-toast';\n" + imports);

// Fix menuItems and add support tab
const oldMenuItems = `const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'costumes', label: 'Trang phục của tôi', icon: <Shirt size={20} /> },
    { id: 'orders', label: 'Quản lý đơn thuê', icon: <ShoppingBag size={20} /> },
    { id: 'revenue', label: 'Doanh thu & Rút tiền', icon: <BarChart3 size={20} /> },
    { id: 'profile', label: 'Thông tin cửa hàng', icon: <Store size={20} /> },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: <Star size={20} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} /> }
  ];`;

const newMenuItems = `const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'costumes', label: 'Trang phục của tôi', icon: <Shirt size={20} /> },
    { id: 'orders', label: 'Quản lý đơn thuê', icon: <ShoppingBag size={20} /> },
    { id: 'revenue', label: 'Doanh thu & Rút tiền', icon: <BarChart3 size={20} /> },
    { id: 'profile', label: 'Thông tin cửa hàng', icon: <Store size={20} /> },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: <Star size={20} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} /> },
    { id: 'support', label: 'Hỗ trợ & Chat Admin', icon: <MessageSquare size={20} /> }
  ];`;

code = code.replace(oldMenuItems, newMenuItems);

const propsDef = `
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
`;

code = code.replace('return (', propsDef + '\n  return (');

// We must REMOVE the old `admin-header` and debt alert from the file so we can accurately inject it.
const oldHeroAndAlertRegex = /<section className="admin-header">[\s\S]*?\{\s*wallet && platformConfig[\s\S]*?\}\s*\)/;
code = code.replace(oldHeroAndAlertRegex, '');


// Now replace mainContent!
const mainContentRegex = /{activeTab === 'dashboard' && \([\s\S]*?\)}\s*<\/main>/;

const newMainContent = `
        {activeTab === 'dashboard' && <DashboardTab {...props} />}
        {activeTab === 'costumes' && <CostumesTab {...props} />}
        {activeTab === 'orders' && <OrdersTab {...props} />}
        {activeTab === 'revenue' && <RevenueTab {...props} />}
        {activeTab === 'profile' && <ProfileTab {...props} />}
        {activeTab === 'reviews' && <ReviewsTab {...props} />}
        {activeTab === 'notifications' && <NotificationsTab {...props} />}
        {activeTab === 'support' && <SupportTab />}
      </main>`;

code = code.replace(mainContentRegex, newMainContent);

// Add lock and MessageSquare to imports
code = code.replace(
    /import \{ LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download, AlertTriangle, Clock, Info, AlertCircle \} from 'lucide-react';/,
    "import { LayoutDashboard, Shirt, ShoppingBag, BarChart3, Wallet, Store, Star, Bell, LogOut, Download, AlertTriangle, Clock, Info, AlertCircle, Lock, MessageSquare } from 'lucide-react';"
);

// 2. Add shopStatus state
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\(tab\);/,
  "const [activeTab, setActiveTab] = useState(tab);\n  const [shopStatus, setShopStatus] = useState(user?.lenderProfile?.status || user?.profiles?.lender?.status || 'Pending');"
);

// 3. Update loadData to update shopStatus
code = code.replace(
  /const lender = userProfile\.profiles\?\.lender \|\| \{\};\n\s*setProfileForm\(\(prev\) => \(\{/,
  "const lender = userProfile.profiles?.lender || {};\n        setShopStatus(lender.status || 'Pending');\n        setProfileForm((prev) => ({"
);

// 4. Wrap the main content WITH the Debt alert!
const pendingAlertRegex = /<main className="admin-content">/;
const pendingAlertCode = `<main className="admin-content">
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
        )}`;
          
code = code.replace(pendingAlertRegex, pendingAlertCode);
code = code.replace('</main>', '  </>\n        )}\n      </main>');

fs.writeFileSync('src/pages/shop/ShopDashboard.jsx', code);
console.log('Restored fully with debt alert!');
