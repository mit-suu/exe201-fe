import ChatBox from '../../components/ChatBox.jsx';

const SupportTab = () => {
  return (
    <div className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Hỗ trợ & Chat Admin</p>
        <h2>Trò chuyện với Ban Quản Trị</h2>
      </div>
      <div style={{ height: '550px' }}>
        <ChatBox />
      </div>
    </div>
  );
};
export default SupportTab;
