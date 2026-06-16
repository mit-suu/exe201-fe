const fs = require('fs');
const path = 'src/pages/admin/FeedbacksTab.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldModal = `{selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3>Chi tiết phản hồi</h3>
            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <p><strong>Loại:</strong> {selectedFeedback.type}</p>
              <p><strong>Người gửi:</strong> {selectedFeedback.user ? selectedFeedback.user.email : 'Khách vãng lai'}</p>
              <p><strong>Tiêu đề:</strong> {selectedFeedback.title}</p>
              <div style={{ background: 'var(--surface-soft)', padding: '15px', borderRadius: '12px', marginTop: '10px', marginBottom: '15px' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedFeedback.content}</p>
              </div>

              <div>
                <label><strong>Trạng thái xử lý:</strong></label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginTop: '5px', marginBottom: '15px', width: '100%' }}>
                  <option value="Chờ xử lý">Chờ xử lý</option>
                  <option value="Đang xem">Đang xem</option>
                  <option value="Đã xử lý">Đã xử lý</option>
                </select>
              </div>

              <div>
                <label><strong>Ghi chú nội bộ (Admin):</strong></label>
                <textarea 
                  value={adminNotes} 
                  onChange={e => setAdminNotes(e.target.value)} 
                  rows="4" 
                  placeholder="Ghi chú kết quả xử lý (chỉ admin xem)"
                  style={{ marginTop: '5px', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="secondary-button" onClick={() => setSelectedFeedback(null)}>Đóng</button>
              <button className="primary-button" onClick={handleSave}>Lưu cập nhật</button>
            </div>
          </div>
        </div>
      )}`;

const newModal = `{selectedFeedback && (
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
      )}`;

if (!content.includes('import { MessageSquare')) {
  content = content.replace("import { Mail", "import { MessageSquare, Mail");
}

content = content.replace(oldModal, newModal);
fs.writeFileSync(path, content, 'utf8');
console.log('Patched FeedbacksTab modal');
