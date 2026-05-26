import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { saveSession } from '../services/auth.js';

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
      const response = await api.post('/auth/register', form);
      saveSession(response.data.data.user, response.data.data.accessToken);
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <section className="form-card">
      <h2>Đăng ký tài khoản</h2>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="input-group">
        <label>Họ và tên</label>
        <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required />
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
        <label>Mật khẩu</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />
        <button type="submit" className="primary-button">Tạo tài khoản</button>
      </form>
      <p>Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </section>
  );
};

export default Register;
