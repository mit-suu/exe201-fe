import { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { toast } from 'react-hot-toast';

const CouponTab = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', description: '', type: 'percent', value: '', minOrder: 0, maxUses: 100, expiresAt: '' });

  const load = async () => {
    try { const res = await api.get('/coupons'); setCoupons(res.data.data || []); }
    catch { setCoupons([]); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) return toast.error('Nhap ma va gia tri');
    try {
      await api.post('/coupons', { ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxUses: Number(form.maxUses) });
      toast.success('Tao ma thanh cong');
      setForm({ code: '', description: '', type: 'percent', value: '', minOrder: 0, maxUses: 100, expiresAt: '' });
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Loi'); }
  };

  const toggle = async (id) => {
    try { await api.patch(`/coupons/${id}/toggle`); load(); }
    catch { toast.error('Loi'); }
  };

  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Khuyen mai</p>
        <h2>Ma giam gia (Coupon)</h2>
      </div>

      <form onSubmit={handleCreate} className="input-group" style={{ maxWidth: '600px', display: 'grid', gap: '12px', marginBottom: '24px', gridTemplateColumns: '1fr 1fr' }}>
        <div><label>Ma giam gia</label><input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SALE30" required /></div>
        <div><label>Mo ta</label><input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Giam 30%" /></div>
        <div><label>Loai</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="percent">%</option><option value="fixed">Tien mat</option></select></div>
        <div><label>Gia tri</label><input type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === 'percent' ? '30' : '50000'} required /></div>
        <div><label>Don toi thieu</label><input type="number" value={form.minOrder} onChange={e => setForm({...form, minOrder: e.target.value})} /></div>
        <div><label>Luot toi da</label><input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} /></div>
        <div style={{ gridColumn: '1 / -1' }}><label>Het han</label><input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} /></div>
        <button className="primary-button" style={{ gridColumn: '1 / -1' }}>Tao ma giam gia</button>
      </form>

      <table className="admin-table">
        <thead><tr><th>Ma</th><th>Gia tri</th><th>Da dung</th><th>Han</th><th>Trang thai</th><th></th></tr></thead>
        <tbody>
          {coupons.map(c => (
            <tr key={c._id}>
              <td><strong>{c.code}</strong><br /><small style={{color:'var(--muted)'}}>{c.description}</small></td>
              <td>{c.type === 'percent' ? `${c.value}%` : `${Number(c.value).toLocaleString('vi-VN')} d`}</td>
              <td>{c.usedCount}/{c.maxUses}</td>
              <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('vi-VN') : 'Vinh vien'}</td>
              <td><span style={{color: c.isActive ? 'var(--success)' : 'var(--danger)', fontWeight:600}}>{c.isActive ? 'Hoat dong' : 'Tat'}</span></td>
              <td><button className="button" onClick={() => toggle(c._id)} style={{fontSize:'0.8rem'}}>{c.isActive ? 'Tat' : 'Bat'}</button></td>
            </tr>
          ))}
          {coupons.length === 0 && <tr><td colSpan="6" style={{textAlign:'center',color:'var(--muted)'}}>Chua co ma giam gia</td></tr>}
        </tbody>
      </table>
    </section>
  );
};
export default CouponTab;
