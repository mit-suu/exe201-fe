import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentUser } from '../services/auth.js';
import { getMessages, getMyConversation, sendMessage } from '../services/chats.js';

const formatTime = (value) => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

const ChatBox = ({ conversationId: adminConversationId }) => {
  const currentUser = getCurrentUser();
  const [conversationId, setConversationId] = useState(adminConversationId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const load = useCallback(async (showError = true) => {
    try {
      if (showError) setError('');
      const conversation = adminConversationId ? { _id: adminConversationId } : await getMyConversation();
      setConversationId(conversation._id);
      const data = await getMessages(conversation._id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      if (showError) setError(err?.response?.data?.message || 'Không tải được chat');
    }
  }, [adminConversationId]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(false), 2500);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !conversationId) return;
    setText('');
    const optimisticMessage = {
      _id: `local-${Date.now()}`,
      text: trimmed,
      senderRole: currentUser?.role === 'admin' ? 'admin' : 'customer',
      sender: currentUser,
      createdAt: new Date().toISOString(),
    };
    setMessages((items) => [...items, optimisticMessage]);
    try {
      await sendMessage(conversationId, trimmed);
      await load(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không gửi được tin nhắn');
      setMessages((items) => items.filter((item) => item._id !== optimisticMessage._id));
    }
  };

  return (
    <div className="messenger-chat">
      <div className="messenger-header">
        <div className="support-avatar">BL</div>
        <div>
          <strong>BuildLab Support</strong>
          <span>Đang hỗ trợ thuê trang phục</span>
        </div>
      </div>

      <div className="messenger-messages">
        {messages.map((message) => {
          const mine = currentUser?.role === 'admin' ? message.senderRole === 'admin' : message.senderRole === 'customer';
          return (
            <div key={message._id} className={`message-row ${mine ? 'mine' : 'theirs'}`}>
              <div className="message-bubble">
                <p>{message.text}</p>
                <span>{message.sender?.fullName || (mine ? 'Bạn' : 'Admin')} {formatTime(message.createdAt)}</span>
              </div>
            </div>
          );
        })}
        {!messages.length && <div className="chat-empty">Chưa có tin nhắn. Hãy gửi câu hỏi cho BuildLab Support.</div>}
        <div ref={bottomRef} />
      </div>

      {error && <div className="alert">{error}</div>}
      <form onSubmit={submit} className="chat-composer">
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhập tin nhắn..." />
        <button type="submit">Gửi</button>
      </form>
    </div>
  );
};

export default ChatBox;
