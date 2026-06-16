import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../services/profile.js';

const Profile = () => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', street: '', district: '', city: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((user) => {
        const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0] || {};
        setForm({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          street: defaultAddr.street || '',
          district: defaultAddr.district || '',
          city: defaultAddr.city || ''
        });
      })
      .catch((err) => setError(err?.response?.data?.message || 'Không tải được thông tin tài khoản.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const user = await updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        addresses: [{
          label: 'Mặc định',
          fullName: form.fullName,
          phone: form.phone,
          street: form.street,
          district: form.district,
          city: form.city,
          isDefault: true
        }]
      });
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0] || {};
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        street: defaultAddr.street || '',
        district: defaultAddr.district || '',
        city: defaultAddr.city || ''
      });
      setMessage('Đã cập nhật thông tin tài khoản thành công.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Không cập nhật được thông tin.');
    }
  };

  return (
    <section className="profile-page card">
      <div className="profile-page-heading">
        <div className="profile-avatar large-avatar">{(form.fullName || form.email || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Thông tin tài khoản</h1>
          <p>Xem và cập nhật thông tin cá nhân của bạn.</p>
        </div>
      </div>
      {loading && <div className="empty-state">Đang tải thông tin...</div>}
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert">{error}</div>}
      {!loading && (
        <form className="input-group profile-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          <label>Họ và tên</label>
          <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
          
          <label>Email</label>
          <input value={form.email} disabled style={{ background: 'var(--surface-soft)' }} />
          
          <label>Số điện thoại liên lạc</label>
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Nhập số điện thoại..." required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Tỉnh / Thành phố</label>
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Hà Nội, TP. HCM..." required />
            </div>
            <div>
              <label>Quận / Huyện</label>
              <input value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} placeholder="Cầu Giấy, Quận 1..." required />
            </div>
          </div>
          
          <label>Địa chỉ cụ thể (Số nhà, tên đường)</label>
          <input value={form.street} onChange={(event) => setForm({ ...form, street: event.target.value })} placeholder="Ví dụ: 123 Đường Láng..." required />
          
          <button className="primary-button" style={{ marginTop: '10px' }}>Lưu thông tin</button>
        </form>
      )}
    </section>
  );
};

export default Profile;

