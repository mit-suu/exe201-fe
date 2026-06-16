import { useState } from 'react';
import { changePassword } from '../../services/profile.js';

const ChangePassword = () => {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await changePassword(form);
      setForm({ oldPassword: '', newPassword: '' });
      setMessage('Đã đổi mật khẩu thành công.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Không đổi được mật khẩu.');
    }
  };

  return (
    <section className="profile-page card">
      <div className="profile-page-heading">
        <div className="profile-avatar large-avatar">K</div>
        <div>
          <p className="eyebrow">Security</p>
          <h1>Đổi mật khẩu</h1>
          <p>Cập nhật mật khẩu để bảo vệ tài khoản BuildLab.</p>
        </div>
      </div>
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert">{error}</div>}
      <form className="input-group profile-form" onSubmit={handleSubmit}>
        <label>Mật khẩu hiện tại</label>
        <input type="password" value={form.oldPassword} onChange={(event) => setForm({ ...form, oldPassword: event.target.value })} required />
        <label>Mật khẩu mới</label>
        <input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required />
        <button className="primary-button">Đổi mật khẩu</button>
      </form>
    </section>
  );
};

export default ChangePassword;

