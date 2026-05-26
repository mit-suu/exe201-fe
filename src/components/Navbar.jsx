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

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand-block">
          <span className="brand">BuildLab</span>
          <small>Costume Rental</small>
        </Link>
        <nav className="nav-links">
          <NavLink to="/">Trang phục</NavLink>
          {currentUser ? (
            <>
              <NavLink to="/dashboard">Tài khoản</NavLink>
              {currentUser.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
              <button className="nav-button" onClick={handleLogout}>Đăng xuất</button>
            </>
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
