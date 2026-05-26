import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { saveSession } from '../services/auth.js';

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
      saveSession(response.data.data.user, response.data.data.accessToken);
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <section className="form-card">
      <h2>Đăng nhập</h2>
      <p>Quản lý thông tin thuê đồ hoặc truy cập trang admin khi có quyền.</p>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="input-group">
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
        <label>Mật khẩu</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />
        <button type="submit" className="primary-button">Đăng nhập</button>
      </form>
      <p>Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </section>
  );
};

export default Login;
