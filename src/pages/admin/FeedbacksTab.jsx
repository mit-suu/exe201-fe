import { useState } from 'react';
import { MessageSquare, Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const formatTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '';

const statusColors = {
  'Chờ xử lý': 'var(--warning)',
  'Đang xem': 'var(--info)',
  'Đã xử lý': 'var(--success)'
};

const FeedbacksTab = ({ feedbacks, handleUpdateFeedback }) => {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState('');

  const filtered = feedbacks.filter(f => {
    if (filterStatus && f.status !== filterStatus) return false;
    if (filterType && f.type !== filterType) return false;
    return true;
  });

  const openFeedback = (fb) => {
    setSelectedFeedback(fb);
    setAdminNotes(fb.adminNotes || '');
    setStatus(fb.status || 'Chờ xử lý');
  };

  const handleSave = () => {
    handleUpdateFeedback(selectedFeedback._id, { status, adminNotes });
    setSelectedFeedback(null);
  };

  return (
    <div className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Quản lý phản hồi</p>
        <h2>Phản hồi & Góp ý từ khách hàng/shop</h2>
      </div>

      <div className="filters-row">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="Chờ xử lý">Chờ xử lý</option>
          <option value="Đang xem">Đang xem</option>
          <option value="Đã xử lý">Đã xử lý</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="Bug">Bug</option>
          <option value="Đề xuất">Đề xuất</option>
          <option value="Phàn nàn">Phàn nàn</option>
          <option value="Khác">Khác</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người gửi</th>
              <th>Vai trò</th>
              <th>Loại</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(fb => (
              <tr key={fb._id}>
                <td>{formatTime(fb.createdAt)}</td>
                <td>{fb.user ? fb.user.email : 'Khách vãng lai'}</td>
                <td>{fb.user ? (fb.user.roles.includes('lender') ? 'Shop' : 'Khách') : 'N/A'}</td>
                <td>{fb.type}</td>
                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fb.title}</td>
                <td>
                  <span style={{ color: statusColors[fb.status], fontWeight: 'bold' }}>{fb.status}</span>
                </td>
                <td>
                  <button className="secondary-button" onClick={() => openFeedback(fb)}>Xem chi tiết</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có phản hồi nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', padding: '0', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 25px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0', fontSize: '1.2rem' }}>Chi tiết phản hồi</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Từ: {selectedFeedback.user ? selectedFeedback.user.email : 'Khách vãng lai'}</span>
                </div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: 'var(--surface-soft)', color: 'var(--text)' }}>
                {selectedFeedback.type}
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: '25px', display: 'grid', gap: '20px' }}>
              
              <div>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>Tiêu đề</strong>
                <h4 style={{ margin: '0', fontSize: '1.1rem', color: 'var(--text)' }}>{selectedFeedback.title}</h4>
              </div>

              <div>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>Nội dung chi tiết</strong>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedFeedback.content}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>Trạng thái xử lý</strong>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                  >
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Đang xem">Đang xem</option>
                    <option value="Đã xử lý">Đã xử lý</option>
                  </select>
                </div>
              </div>

              <div>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>Ghi chú nội bộ (Chỉ Admin xem)</strong>
                <textarea 
                  value={adminNotes} 
                  onChange={e => setAdminNotes(e.target.value)} 
                  rows="3" 
                  placeholder="Ghi chú kết quả xử lý..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical' }}
                />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '20px 25px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button className="secondary-button" onClick={() => setSelectedFeedback(null)}>Đóng lại</button>
              <button className="primary-button" onClick={handleSave}>Lưu cập nhật</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbacksTab;
