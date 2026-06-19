import { useState } from 'react';
import api from '../../services/api.js';
import { toast } from 'react-hot-toast';

const EmailMarketingTab = () => {
  const [form, setForm] = useState({ subject: '', content: '', targetRole: 'all' });
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.content) return toast.error('Nhap tieu de va noi dung');
    try {
      setSending(true);
      const res = await api.post('/email-marketing/send', {
        subject: form.subject,
        htmlContent: `<div style="padding:20px;font-family:sans-serif">${form.content.replace(/\n/g, '<br/>')}</div>`,
        targetRole: form.targetRole
      });
      toast.success(res.data.message);
      setForm({ subject: '', content: '', targetRole: 'all' });
    } catch (err) { toast.error(err?.response?.data?.message || 'Loi gui email'); }
    finally { setSending(false); }
  };

  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Marketing</p>
        <h2>Gui Email khuyen mai</h2>
      </div>
      <form onSubmit={handleSend} className="input-group" style={{ maxWidth: '600px', display: 'grid', gap: '14px' }}>
        <div>
          <label>Tieu de email</label>
          <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Khuyen mai thang 6 - Giam 30%" required />
        </div>
        <div>
          <label>Doi tuong nhan</label>
          <select value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})}>
            <option value="all">Tat ca nguoi dung</option>
            <option value="renter">Khach hang</option>
            <option value="lender">Shop</option>
          </select>
        </div>
        <div>
          <label>Noi dung</label>
          <textarea rows="8" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Nhap noi dung khuyen mai..." style={{width:'100%',padding:'12px',borderRadius:'12px',border:'1px solid var(--border)',fontFamily:'inherit'}} required />
        </div>
        <button className="primary-button" disabled={sending} style={{justifySelf:'start'}}>
          {sending ? 'Dang gui...' : 'Gui email'}
        </button>
      </form>
    </section>
  );
};
export default EmailMarketingTab;
