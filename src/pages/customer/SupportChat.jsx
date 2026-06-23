import ChatBox from '../../components/ChatBox.jsx';

const SupportChat = () => (
  <section className="profile-page card support-chat-page">
    <div className="profile-page-heading">
      <div className="profile-avatar large-avatar">C</div>
      <div>
        <p className="eyebrow">Support</p>
        <h1>Chat với admin</h1>
        <p>Trao đổi trực tiếp với BuildLab để hỏi về sản phẩm, lịch thuê và đơn đặt.</p>
      </div>
    </div>
    <ChatBox />
  </section>
);

export default SupportChat;

