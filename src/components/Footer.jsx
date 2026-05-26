import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-grid">
      <div>
        <h2>BuildLab</h2>
        <p>Nền tảng cho thuê trang phục cho kỷ yếu, lễ cưới, tiệc tối, biểu diễn và concept chụp ảnh.</p>
      </div>
      <div>
        <h3>Khám phá</h3>
        <Link to="/">Catalog trang phục</Link>
        <Link to="/register">Tạo tài khoản</Link>
        <Link to="/login">Đăng nhập</Link>
      </div>
      <div>
        <h3>Hỗ trợ</h3>
        <p>Chat với admin trong dashboard sau khi đăng nhập.</p>
        <p>AI hỗ trợ tư vấn chọn trang phục theo nhu cầu.</p>
      </div>
      <div>
        <h3>Quy trình</h3>
        <p>Chọn đồ, đặt lịch thuê, thanh toán PayOS và theo dõi trạng thái đơn hàng.</p>
      </div>
    </div>
    <div className="footer-bottom">BuildLab Costume Rental • Thiết kế màu phẳng, hiện đại và dễ sử dụng.</div>
  </footer>
);

export default Footer;
