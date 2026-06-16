import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../services/auth.js';
import { Home, Shirt, ShoppingBag, Wallet, User, Store, LogIn, UserPlus, Settings, LogOut, LayoutDashboard, MessageCircle, BarChart3, KeyRound } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';

const Navbar = ({ user }) => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const currentUser = user ?? getCurrentUser();

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
              <NavLink to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Home size={18} /> Home</NavLink>
              <NavLink to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Shirt size={18} /> Costumes</NavLink>
              <NavLink to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <ShoppingBag size={18} /> 
                Giỏ hàng
                {cart.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>{cart.length}</span>}
              </NavLink>
              {isCustomer && (
                <>
                  <NavLink to="/orders/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ShoppingBag size={18} /> Orders</NavLink>
                  <NavLink to="/my-wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Wallet size={18} /> My Wallet</NavLink>
                </>
              )}
            </>
          )}

          {/* Auth Button/Dropdown has been moved */}
        </nav>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isAdmin && !isShop && (
            <Link className="nav-button nav-highlight" to="/partner-register" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Store size={18} /> Mở gian hàng
            </Link>
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
