import ChatBox from '../../components/ChatBox.jsx';

const ChatTab = ({ conversations, selectedConvId, setSelectedConvId }) => {
  return (
    <div className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Hộp thư hỗ trợ</p>
        <h2>Trò chuyện với khách hàng</h2>
      </div>
      <div className="admin-chat-layout" style={{ minHeight: '520px' }}>
        <div className="conversation-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {conversations.map((c) => (
            <div key={c._id} className={`conversation-item ${selectedConvId === c._id ? 'active' : ''}`} onClick={() => setSelectedConvId(c._id)}>
              <strong>{c.customer?.fullName || 'Khách hàng'}</strong>
              <span>{c.lastMessage || 'Chưa có tin nhắn'}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>
                {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString('vi-VN') : ''}
              </span>
            </div>
          ))}
          {conversations.length === 0 && <div className="empty-state">Chưa có hội thoại hỗ trợ nào.</div>}
        </div>
        <div className="chat-container">
          {selectedConvId ? (
            <ChatBox conversationId={selectedConvId} />
          ) : (
            <div className="chat-empty">
              Chọn một đoạn hội thoại để bắt đầu chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatTab;

