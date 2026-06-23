import { useState } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitFeedback } from '../services/feedbacks.js';
import { ANALYTICS_EVENTS, trackEvent as trackGAEvent } from '../utils/analytics.js';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Bug',
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    try {
      setLoading(true);
      await submitFeedback(formData);
      trackGAEvent(ANALYTICS_EVENTS.SUBMIT_FEEDBACK, {
        feedback_type: formData.type,
        title_length: formData.title.length,
        content_length: formData.content.length,
      });
      toast.success('Cảm ơn bạn đã góp ý! Chúng tôi sẽ xem xét sớm nhất.');
      setIsOpen(false);
      setFormData({ type: 'Bug', title: '', content: '' });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquarePlus size={24} />
        </button>
      )}

      {isOpen && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          width: '320px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '15px 20px', 
            background: 'var(--surface-soft)', 
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Góp ý & Báo lỗi</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Loại góp ý</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              >
                <option value="Bug">Báo lỗi (Bug)</option>
                <option value="Đề xuất">Đề xuất tính năng</option>
                <option value="Phàn nàn">Phàn nàn</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Tiêu đề</label>
              <input 
                type="text" 
                required
                maxLength={100}
                placeholder="Tóm tắt ngắn gọn..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Chi tiết</label>
              <textarea 
                required
                maxLength={2000}
                rows="4"
                placeholder="Mô tả chi tiết nội dung bạn muốn gửi..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', resize: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              className="primary-button" 
              disabled={loading}
              style={{ marginTop: '5px' }}
            >
              {loading ? 'Đang gửi...' : 'Gửi góp ý'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
