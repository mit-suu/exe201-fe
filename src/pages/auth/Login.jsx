import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { saveSession } from '../../services/auth.js';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await api.post('/auth/login', form);
      const loggedInUser = response.data.data.user;
      saveSession(loggedInUser, response.data.data.accessToken);
      const role = loggedInUser?.role;
      const roles = loggedInUser?.roles || [];
      const isAdmin = role === 'admin' || roles.includes('admin');
      const isShop = ['lender', 'both'].includes(role) || roles.includes('lender') || roles.includes('both');
      navigate(isAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-brand-panel">
        <span className="logo-mark large" aria-hidden="true"><span className="logo-hanger"></span></span>
        <p className="eyebrow">BuildLab Costume Rental</p>
        <h1>Chào mừng bạn quay lại.</h1>
        <p>Đăng nhập để quản lý đơn thuê, theo dõi sản phẩm yêu thích hoặc truy cập khu vực admin.</p>
        <div className="auth-highlight-grid">
          <span>Trang phục đẹp</span>
          <span>Đặt thuê nhanh</span>
          <span>Quản trị gọn</span>
        </div>
      </div>

      <div className="form-card auth-card">
        <div className="auth-card-heading">
          <p className="eyebrow">Đăng nhập</p>
          <h2>Vào tài khoản</h2>
          <p>Sử dụng email và mật khẩu đã đăng ký trên BuildLab.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="input-group auth-form">
          <label>Email</label>
          <input type="email" name="email" placeholder="admin@buildlab.vn" value={form.email} onChange={handleChange} required />
          <label>Mật khẩu</label>
          <input type="password" name="password" placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} required />
          <button type="submit" className="primary-button">Đăng nhập</button>
        </form>
        <p className="auth-switch">Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </div>
    </section>
  );
};

export default Login;

