import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../services/auth.js';
import { getMyNotifications, markNotificationRead } from '../services/notifications.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';
import { Home, Shirt, ShoppingBag, Wallet, User, Store, LogIn, UserPlus, Settings, LogOut, LayoutDashboard, MessageCircle, BarChart3, KeyRound, Bell } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Navbar = ({ user }) => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const currentUser = user ?? getCurrentUser();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (currentUser) {
      getMyNotifications().then(data => setNotifications(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    const socket = connectSocket();
    if (socket) {
      socket.on('new_order', (data) => {
        toast.success(`Bạn vừa có đơn thuê mới: ${data.productName}`);
        getMyNotifications().then(d => setNotifications(Array.isArray(d) ? d : []));
      });
      socket.on('order_updated', (data) => {
        toast.info(data.message || 'Đơn hàng có cập nhật mới!');
        getMyNotifications().then(d => setNotifications(Array.isArray(d) ? d : []));
      });
    }
    return () => { if (socket) disconnectSocket(); };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('vi') ? 'en' : 'vi');
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
    window.location.reload();
  };

  const avatarLetter = (currentUser?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase();

  const isAdmin = currentUser?.role === 'admin';
  const isShop = ['lender', 'both'].includes(currentUser?.role);
  const isCustomer = currentUser && !isAdmin && !isShop;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to={isAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/'} className="brand-block">
          <span className="logo-mark" aria-hidden="true"><span className="logo-hanger"></span></span>
          <span className="brand-copy">
            <span className="brand">BuildLab</span>
            <small>{isAdmin ? 'Admin Panel' : isShop ? 'Shop Portal' : 'Costume Rental'}</small>
          </span>
        </Link>
        <nav className="nav-links">
          {/* Admin Menu */}
          {isAdmin && (
            <>
              <NavLink to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><LayoutDashboard size={18} /> Dashboard</NavLink>
            </>
          )}

          {/* Shop Menu */}
          {isShop && (
            <>
              <NavLink to="/shop/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><LayoutDashboard size={18} /> Dashboard</NavLink>
              <NavLink to="/shop/costumes" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Shirt size={18} /> My Costumes</NavLink>
              <NavLink to="/shop/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18} /> Orders</NavLink>
              <NavLink to="/shop/revenue" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={18} /> Revenue</NavLink>
              <NavLink to="/shop/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Store size={18} /> Shop Profile</NavLink>
            </>
          )}

          {/* Customer / Guest Menu */}
          {!isAdmin && !isShop && (
            <>
              <NavLink to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Home size={18} /> {t('navbar.home')}</NavLink>
              <NavLink to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Shirt size={18} /> {t('navbar.costumes')}</NavLink>
              <NavLink to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <ShoppingBag size={18} /> 
                {t('navbar.cart')}
                {cart.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>{cart.length}</span>}
              </NavLink>
              {isCustomer && (
                <>
                  <NavLink to="/orders/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18} /> {t('navbar.orders')}</NavLink>
                  <NavLink to="/my-wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Wallet size={18} /> {t('navbar.wallet')}</NavLink>
                </>
              )}
            </>
          )}

          {/* Auth Button/Dropdown has been moved */}
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isAdmin && !isShop && (
            <Link className="nav-button nav-highlight" to="/partner-register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Store size={18} /> {t('navbar.openShop')}
            </Link>
          )}

          {/* Auth Button/Dropdown */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                aria-label="Thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div style={{ position: 'absolute', top: '100%', right: 0, width: '340px', maxHeight: '400px', overflowY: 'auto', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 1000, marginTop: '8px' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Thông báo</span>
                    {unreadCount > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{unreadCount} chưa đọc</span>}
                  </div>
                  {notifications.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>Chưa có thông báo nào</div>}
                  {notifications.map(n => (
                    <button
                      key={n._id}
                      onClick={async () => {
                        if (!n.isRead) await markNotificationRead(n._id);
                        getMyNotifications().then(d => setNotifications(Array.isArray(d) ? d : []));
                        setShowNotif(false);
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f0f0f0', background: n.isRead ? 'white' : '#f0f7ff', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!n.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', flexShrink: 0, marginTop: '6px' }}></span>}
                        <div>
                          <div style={{ fontWeight: n.isRead ? 400 : 600 }}>{n.title || 'Thông báo'}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>{n.message}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '3px' }}>{new Date(n.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auth Button/Dropdown */}
          {currentUser ? (
            <div className="profile-menu">
              <button className="profile-avatar-button" type="button" aria-label="Mở menu profile">{avatarLetter}</button>
              <div className="profile-dropdown">
                <div style={{ padding: '8px 12px', fontSize: '0.9rem', borderBottom: '1px solid var(--border)' }}>
                  <strong>{currentUser.fullName}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>{currentUser.email}</div>
                </div>
                {isAdmin && <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><LayoutDashboard size={16} /> Vào trang quản trị</Link>}
                {isShop && <Link to="/shop/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Store size={16} /> Vào dashboard cửa hàng</Link>}
                <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Xem thông tin</Link>
                <Link to="/change-password" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><KeyRound size={16} /> Đổi mật khẩu</Link>
                {isCustomer && <Link to="/orders/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><ShoppingBag size={16} /> Lịch sử đơn đặt</Link>}
                {isCustomer && <Link to="/my-wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Wallet size={16} /> Ví của tôi</Link>}
                <Link to="/support-chat" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={16} /> Hỗ trợ</Link>
                <button type="button" onClick={toggleLanguage} style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} /> {i18n.language.startsWith('vi') ? 'Tiếng Anh (EN)' : 'Vietnamese (VI)'}
                </button>
                <button type="button" onClick={handleLogout} style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><LogOut size={16} /> Đăng xuất</button>
              </div>
            </div>
          ) : (
            <>
              <NavLink to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><LogIn size={18} /> Đăng nhập</NavLink>
              <Link className="nav-cta" to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><UserPlus size={18} /> Đăng ký</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
