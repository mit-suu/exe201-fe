import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api.js';
import { saveSession } from '../../services/auth.js';
import { ANALYTICS_EVENTS, trackEvent as trackGAEvent } from '../../utils/analytics.js';

const GOOGLE_CLIENT_ID = '963268003293-cffckh6o68llm8e0fc42499b0l86587s.apps.googleusercontent.com';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: '100%',
        });
      }
    };
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await api.post('/auth/google', { idToken: response.credential });
      const loggedInUser = res.data.data.user;
      saveSession(loggedInUser, res.data.data.accessToken);
      trackGAEvent(ANALYTICS_EVENTS.LOGIN, {
        method: 'google',
        user_role: loggedInUser?.role || loggedInUser?.roles?.[0],
      });
      const roles = loggedInUser?.roles || [];
      const isAdmin = roles.includes('admin');
      const isShop = !isAdmin && (roles.includes('lender') || roles.includes('both'));
      window.location.href = isAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/';
    } catch (err) {
      toast.error('Đăng nhập Google thất bại');
    }
  };

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
      trackGAEvent(ANALYTICS_EVENTS.LOGIN, {
        method: 'email',
        user_role: loggedInUser?.role || loggedInUser?.roles?.[0],
      });
      const roles = loggedInUser?.roles || [];
      const isAdmin = roles.includes('admin');
      const isShop = !isAdmin && (roles.includes('lender') || roles.includes('both'));
      window.location.href = isAdmin ? '/admin' : isShop ? '/shop/dashboard' : '/';
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại');
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

        <form onSubmit={handleSubmit} className="input-group auth-form">
          <label>Email</label>
          <input type="email" name="email" placeholder="admin@buildlab.vn" value={form.email} onChange={handleChange} required />
          <label>Mật khẩu</label>
          <input type="password" name="password" placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} required />
          <button type="submit" className="primary-button">Đăng nhập</button>
        </form>

        <div className="auth-divider">
          <span>hoặc</span>
        </div>

        <div ref={googleBtnRef} className="google-btn-wrapper"></div>

        <p className="auth-switch">Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </div>
    </section>
  );
};

export default Login;

