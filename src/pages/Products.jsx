import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { listProducts } from '../services/products.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    q: '',
    category: '',
    size: '',
    color: '',
    minPrice: '',
    maxPrice: '',
    shop: '',
    sort: 'newest'
  });

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local inputs to prevent fetching on every keystroke for text inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [colorQuery, setColorQuery] = useState('');
  const [minPriceQuery, setMinPriceQuery] = useState('');
  const [maxPriceQuery, setMaxPriceQuery] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    setError('');
    listProducts({ ...filters, page, limit: 12 })
      .then((data) => {
        if (data) {
          const items = data.items || (Array.isArray(data) ? data : []);
          setProducts(items);
          if (data.pagination) {
            setPagination(data.pagination);
          }
          
          // Dynamically collect distinct shops from returned products to populate shop filter
          if (items.length > 0) {
            const collectedShops = [];
            items.forEach((item) => {
              if (item.shop && !collectedShops.some(s => s._id === item.shop._id)) {
                collectedShops.push(item.shop);
              }
            });
            setShops(prev => {
              const combined = [...prev, ...collectedShops];
              const unique = [];
              combined.forEach(s => {
                if (!unique.some(x => x._id === s._id)) unique.push(s);
              });
              return unique;
            });
          }
        }
      })
      .catch((err) => {
        setProducts([]);
        setError(err?.response?.data?.message || 'Không tải được sản phẩm.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, page]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    setFilters(prev => ({
      ...prev,
      q: searchQuery,
      color: colorQuery,
      minPrice: minPriceQuery,
      maxPrice: maxPriceQuery
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setColorQuery('');
    setMinPriceQuery('');
    setMaxPriceQuery('');
    setPage(1);
    setFilters({
      q: '',
      category: '',
      size: '',
      color: '',
      minPrice: '',
      maxPrice: '',
      shop: '',
      sort: 'newest'
    });
  };

  const categories = [
    { value: 'traditional', label: 'Traditional (Cổ phục / Áo dài)' },
    { value: 'wedding', label: 'Wedding (Váy cưới / Vest)' },
    { value: 'party', label: 'Party (Dạ hội / Đi tiệc)' },
    { value: 'cosplay', label: 'Cosplay (Anime / Game)' },
    { value: 'festival', label: 'Festival (Lễ hội)' }
  ];

  return (
    <div className="products-page">
      <section className="section-block products-hero">
        <p className="eyebrow">BuildLab Catalog</p>
        <h1>Trang phục thiết kế & sự kiện</h1>
        <p>Tìm kiếm và lọc trang phục lộng lẫy từ hàng trăm shop cho thuê uy tín trên toàn quốc.</p>
      </section>

      <div className="products-layout">
        {/* Left column: Advanced Filters panel */}
        <aside className="card" style={{ padding: '20px', position: 'sticky', top: '100px' }}>
          <div className="section-heading compact-heading" style={{ marginBottom: '15px' }}>
            <p className="eyebrow">Bộ lọc nâng cao</p>
            <h2>Tìm kiếm</h2>
          </div>
          <form onSubmit={handleApplyFilters} className="input-group" style={{ gap: '15px' }}>
            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Tên trang phục</label>
              <input 
                placeholder="Tìm Suit, Áo dài, váy cưới..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Danh mục</label>
              <select 
                value={filters.category} 
                onChange={(e) => { setPage(1); setFilters({ ...filters, category: e.target.value }); }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Size</label>
              <select 
                value={filters.size} 
                onChange={(e) => { setPage(1); setFilters({ ...filters, size: e.target.value }); }}
              >
                <option value="">Tất cả size</option>
                <option value="S">Size S</option>
                <option value="M">Size M</option>
                <option value="L">Size L</option>
                <option value="XL">Size XL</option>
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Màu sắc</label>
              <input 
                placeholder="Ví dụ: Đỏ, Đen, Trắng..." 
                value={colorQuery} 
                onChange={(e) => setColorQuery(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Giá thuê/ngày (đ)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPriceQuery} 
                  onChange={(e) => setMinPriceQuery(e.target.value)} 
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPriceQuery} 
                  onChange={(e) => setMaxPriceQuery(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontWeight: '800', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>Cửa hàng (Shop)</label>
              <select 
                value={filters.shop} 
                onChange={(e) => { setPage(1); setFilters({ ...filters, shop: e.target.value }); }}
              >
                <option value="">Tất cả các shop</option>
                {shops.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px', marginTop: '10px' }}>
              <button type="submit" className="primary-button" style={{ minHeight: '44px' }}>Áp dụng</button>
              <button type="button" onClick={handleClearFilters} className="secondary-button" style={{ minHeight: '44px' }}>Xóa lọc</button>
            </div>
          </form>
        </aside>

        {/* Right column: Results list & sorting & pagination */}
        <section className="section-block" style={{ background: 'transparent', border: '0', boxShadow: 'none', padding: '0' }}>
          <div className="filter-panel" style={{ gridTemplateColumns: '1fr auto', marginBottom: '20px', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontWeight: '800' }}>
                Tìm thấy <strong>{pagination.total}</strong> trang phục
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Sắp xếp:</span>
              <select 
                value={filters.sort} 
                onChange={(e) => { setPage(1); setFilters({ ...filters, sort: e.target.value }); }}
                style={{ width: '200px', background: 'var(--surface-soft)' }}
              >
                <option value="newest">Mới nhất đầu tiên</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {error && <div className="alert">{error}</div>}
          {loading && <div className="empty-state">Đang tìm kiếm trang phục phù hợp...</div>}
          {!loading && !error && products.length === 0 && (
            <div className="empty-state" style={{ padding: '60px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>🔍</span>
              <h3>Không tìm thấy trang phục nào phù hợp</h3>
              <p style={{ color: 'var(--muted)', marginTop: '5px' }}>Vui lòng thay đổi từ khóa hoặc xóa bớt bộ lọc để tìm lại.</p>
              <button onClick={handleClearFilters} className="primary-button" style={{ marginTop: '20px' }}>Hiển thị tất cả</button>
            </div>
          )}

          {!loading && products.length > 0 && (
            <>
              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Dynamic Pagination Component */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)} 
                    className="secondary-button"
                    style={{ minHeight: '40px', padding: '0 16px', borderRadius: '12px' }}
                  >
                    ◀ Trước
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map((pNum) => (
                    <button 
                      key={pNum} 
                      onClick={() => setPage(pNum)} 
                      className={page === pNum ? "primary-button" : "secondary-button"}
                      style={{ 
                        minHeight: '40px', 
                        width: '40px', 
                        padding: '0', 
                        borderRadius: '12px',
                        background: page === pNum ? 'var(--primary-strong)' : 'var(--surface-soft)',
                        color: page === pNum ? 'white' : 'var(--primary-strong)',
                        border: page === pNum ? '0' : '1px solid var(--border)',
                      }}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button 
                    disabled={page === pagination.totalPages} 
                    onClick={() => setPage(page + 1)} 
                    className="secondary-button"
                    style={{ minHeight: '40px', padding: '0 16px', borderRadius: '12px' }}
                  >
                    Sau ▶
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Products;
