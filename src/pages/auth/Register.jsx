import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { saveSession } from '../../services/auth.js';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const payload = { ...form, roleChoice: 'renter' };
      const response = await api.post('/auth/register', payload);
      const registeredUser = response.data.data.user;
      saveSession(registeredUser, response.data.data.accessToken);

      const isShop = ['lender', 'both'].includes(registeredUser?.role);
      navigate(registeredUser?.role === 'admin' ? '/admin' : isShop ? '/shop/dashboard' : '/');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-brand-panel register-panel">
        <span className="logo-mark large" aria-hidden="true"><span className="logo-hanger"></span></span>
        <p className="eyebrow">BuildLab Costume Rental</p>
        <h1>Tạo tài khoản thuê trang phục.</h1>
        <p>Tham gia BuildLab để đặt thuê nhanh, theo dõi đơn hàng và chat trực tiếp với admin.</p>
        <div className="auth-highlight-grid">
          <span>Đa dạng phong cách</span>
          <span>Thanh toán rõ ràng</span>
          <span>Hỗ trợ nhanh</span>
        </div>
      </div>

      <div className="form-card auth-card">
        <div className="auth-card-heading">
          <p className="eyebrow">Đăng ký</p>
          <h2>Bắt đầu với BuildLab</h2>
          <p>Điền thông tin cơ bản để tạo tài khoản người dùng.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="input-group auth-form">
          <label>Họ và tên</label>
          <input type="text" name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={handleChange} required />
          <label>Email</label>
          <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          <label>Mật khẩu</label>
          <input type="password" name="password" placeholder="Tạo mật khẩu" value={form.password} onChange={handleChange} required />

          <button type="submit" className="primary-button" style={{ marginTop: '15px' }}>Tạo tài khoản</button>
        </form>
        <p className="auth-switch">Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </section>
  );
};

export default Register;
