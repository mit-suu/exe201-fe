import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getCurrentUser } from '../services/auth.js';

const Navbar = ({ user }) => {
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
              <NavLink to="/admin">Dashboard</NavLink>
            </>
          )}

          {/* Shop Menu */}
          {isShop && (
            <>
              <NavLink to="/shop/dashboard">Dashboard</NavLink>
              <NavLink to="/shop/costumes">My Costumes</NavLink>
              <NavLink to="/shop/orders">Orders</NavLink>
              <NavLink to="/shop/revenue">Revenue</NavLink>
              <NavLink to="/shop/profile">Shop Profile</NavLink>
            </>
          )}

          {/* Customer / Guest Menu */}
          {!isAdmin && !isShop && (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/products">Costumes</NavLink>
              {isCustomer && (
                <>
                  <NavLink to="/orders/history">Orders</NavLink>
                  <NavLink to="/profile">Profile</NavLink>
                </>
              )}
            </>
          )}

          {/* Auth Button/Dropdown */}
          {currentUser ? (
            <div className="profile-menu">
              <button className="profile-avatar-button" type="button" aria-label="Mở menu profile">{avatarLetter}</button>
              <div className="profile-dropdown">
                <div style={{ padding: '8px 12px', fontSize: '0.9rem', borderBottom: '1px solid var(--border)' }}>
                  <strong>{currentUser.fullName}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '2px' }}>{currentUser.email}</div>
                </div>
                <Link to="/profile">Xem thông tin</Link>
                <Link to="/change-password">Đổi mật khẩu</Link>
                {isCustomer && <Link to="/orders/history">Lịch sử đơn đặt</Link>}
                <Link to="/support-chat">Hỗ trợ</Link>
                <button type="button" onClick={handleLogout} style={{ color: 'var(--danger)' }}>Đăng xuất</button>
              </div>
            </div>
          ) : (
            <>
              <NavLink to="/login">Đăng nhập</NavLink>
              <Link className="nav-cta" to="/register">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
