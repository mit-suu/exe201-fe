import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard.jsx';
import { listProducts, listCategories, listSizes } from '../../services/products.js';
import { trackEvent } from '../../hooks/useAnalytics.js';

const categories = [
  { value: 'traditional', title: 'Áo dài & truyền thống', text: 'Trang phục chụp ảnh, lễ hỏi, kỷ yếu và sự kiện văn hóa.' },
  { value: 'wedding', title: 'Váy cưới', text: 'Váy cưới thanh lịch cho tiệc nhỏ, concept studio và lễ cưới.' },
  { value: 'party', title: 'Dạ hội & sự kiện', text: 'Suit, đầm cocktail, dạ hội cho gala, prom và tiệc tối.' },
  { value: 'cosplay', title: 'Cosplay', text: 'Trang phục concept nổi bật cho sự kiện, chụp ảnh và biểu diễn.' },
];

const steps = [
  ['01', 'Chọn trang phục', 'Lọc theo danh mục, size, phong cách và ngân sách phù hợp.'],
  ['02', 'Đặt lịch thuê', 'Chọn size, ngày nhận, ngày trả và ghi chú nhu cầu riêng.'],
  ['03', 'Thanh toán', 'Thanh toán qua PayOS hoặc giữ đơn chờ xác nhận khi chưa cấu hình.'],
  ['04', 'Nhận và trả đồ', 'Theo dõi đơn trong tài khoản, chat với admin khi cần hỗ trợ.'],
];

const features = [
  ['Tư vấn AI', 'Gợi ý trang phục theo sự kiện, màu sắc, size và ngân sách.'],
  ['Chat admin', 'Trao đổi trực tiếp với đội BuildLab về tình trạng đồ và lịch thuê.'],
  ['Quản lý đơn', 'Theo dõi trạng thái thanh toán, chuẩn bị, đang thuê và hoàn trả.'],
  ['Catalog rõ ràng', 'Ảnh sản phẩm, giá thuê, tiền cọc, size và mô tả hiển thị đầy đủ.'],
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', size: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriesList, setCategoriesList] = useState([]);
  const [sizesList, setSizesList] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError('');
    listProducts(filters)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        setProducts([]);
        setError(err?.response?.data?.message || 'Không tải được sản phẩm. Kiểm tra backend và MongoDB rồi thử lại.');
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    listCategories()
      .then(data => {
        if (Array.isArray(data)) setCategoriesList(data);
      })
      .catch(err => console.error('Failed to load categories', err));
      
    listSizes()
      .then(data => {
        if (Array.isArray(data)) setSizesList(data);
      })
      .catch(err => console.error('Failed to load sizes', err));
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (filters.q) {
        trackEvent('SEARCH', `Tìm kiếm ở trang chủ: ${filters.q}`, { query: filters.q, category: filters.category });
      }
    }, 1000);
    return () => clearTimeout(delay);
  }, [filters.q, filters.category]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">BuildLab Costume Rental</p>
          <h1>Thuê trang phục đẹp cho mọi khoảnh khắc quan trọng</h1>
          <p className="hero-text">Khám phá catalog áo dài, váy cưới, suit, đầm dạ hội và cosplay. Đặt lịch thuê nhanh, quản lý đơn rõ ràng, chat với admin và nhận tư vấn AI trong một nền tảng.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#catalog">Xem trang phục</a>
            <Link className="secondary-button" to="/register">Tạo tài khoản</Link>
          </div>
          <div className="hero-stats">
            <div><strong>8+</strong><span>Mẫu khởi tạo</span></div>
            <div><strong>4</strong><span>Danh mục chính</span></div>
            <div><strong>24/7</strong><span>AI hỗ trợ</span></div>
          </div>
        </div>
        <div className="hero-showcase" aria-label="Bộ sưu tập trang phục BuildLab">
          <div className="showcase-card main-showcase">
            <img src="https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=900&q=80" alt="Váy cưới satin" />
            <div><strong>Wedding Collection</strong><span>Váy cưới, vest, phụ kiện</span></div>
          </div>
          <div className="showcase-row">
            <div className="showcase-card small-showcase"><img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80" alt="Suit sự kiện" /></div>
            <div className="showcase-card small-showcase"><img src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=500&q=80" alt="Đầm dự tiệc" /></div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Danh mục nổi bật</p>
          <h2>Chọn nhanh theo nhu cầu thuê</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <button key={category.value} className="category-card" onClick={() => setFilters({ ...filters, category: category.value })}>
              <span>{category.title}</span>
              <p>{category.text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block" id="catalog">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Catalog trang phục</p>
            <h2>Sản phẩm đang có tại BuildLab</h2>
          </div>
          
        </div>

        <div className="filter-panel">
          <input placeholder="Tìm áo dài, suit, cosplay..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Tất cả danh mục</option>
            {categoriesList.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
          <select value={filters.size} onChange={(e) => setFilters({ ...filters, size: e.target.value })}>
            <option value="">Tất cả size</option>
            {sizesList.map((sz, idx) => (
              <option key={idx} value={sz}>{sz}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert">{error}</div>}
        {loading && <div className="empty-state">Đang tải catalog trang phục...</div>}
        {!loading && !error && products.length === 0 && <div className="empty-state">Chưa có sản phẩm hiển thị.</div>}
        {!loading && products.length > 0 && <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}
      </section>

      {featuredProducts.length > 0 && (
        <section className="section-block muted-section">
          <div className="section-heading">
            <p className="eyebrow">Gợi ý nhanh</p>
            <h2>Sản phẩm nổi bật hôm nay</h2>
          </div>
          <div className="product-grid featured-grid">{featuredProducts.map((product) => <ProductCard key={product._id} product={product} />)}</div>
        </section>
      )}

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Quy trình thuê</p>
          <h2>Thuê trang phục dễ hiểu trong 4 bước</h2>
        </div>
        <div className="steps-grid">
          {steps.map(([number, title, text]) => (
            <div className="step-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block feature-section">
        <div className="section-heading">
          <p className="eyebrow">Dịch vụ đi kèm</p>
          <h2>Đủ yếu tố cho một website cho thuê trang phục</h2>
        </div>
        <div className="feature-grid">
          {features.map(([title, text]) => <div className="feature-card" key={title}><h3>{title}</h3><p>{text}</p></div>)}
        </div>
      </section>

      <section className="section-block partner-cta-section">
        <div className="partner-cta-copy">
          <p className="eyebrow">Dành cho chủ cửa hàng</p>
          <h2>Trở thành đối tác cho thuê của BuildLab</h2>
          <p>
            Mở gian hàng để quản lý đơn hàng, lịch thuê và kết nối với khách hàng ngay trên nền tảng.
          </p>
        </div>
          <Link className="primary-button" to="/partner-register">
            Mở gian hàng
          </Link>
      </section>

      <section className="cta-section">
        <div>
          <p className="eyebrow">Sẵn sàng bắt đầu?</p>
          <h2>Tạo tài khoản để đặt thuê, theo dõi đơn hàng và chat hỗ trợ.</h2>
        </div>
        <Link className="primary-button" to="/register">Đăng ký ngay</Link>
      </section>
    </div>
  );
};

export default Home;

