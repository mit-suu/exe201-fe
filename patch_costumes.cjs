const fs = require('fs');
let code = fs.readFileSync('src/pages/shop/CostumesTab.jsx', 'utf8');

// 1. Add states at the top of the component
const componentStart = 'const CostumesTab = (props) => {';
const states = `
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('name_asc');
`;
code = code.replace(componentStart, componentStart + '\n' + states);

// 2. Add filtering/sorting logic right before return
const returnStart = '  return (\n    <section className="card admin-table-card">';
const logic = `
  const filteredProducts = (products || []).filter(p => {
    if (filterCategory && filterCategory !== 'all' && p.category !== filterCategory && p.category?.name !== filterCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price_asc') return a.rentalPrice - b.rentalPrice;
    if (sortBy === 'price_desc') return b.rentalPrice - a.rentalPrice;
    return 0;
  });
`;
code = code.replace(returnStart, logic + '\n' + returnStart);

// 3. Update the UI to include the Search/Filter bar and use filteredProducts
const listStart = '<div className="table-list admin-product-list">';
const filterUI = `<div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', padding: '0 20px' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tên sản phẩm..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </div>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="traditional">Traditional (Áo dài/Cổ phục)</option>
                <option value="wedding">Wedding (Váy cưới/Vest)</option>
                <option value="party">Party (Dạ tiệc)</option>
                <option value="cosplay">Cosplay (Anime/Game)</option>
                <option value="festival">Festival (Lễ hội)</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="name_asc">Sắp xếp: Tên A-Z</option>
                <option value="name_desc">Sắp xếp: Tên Z-A</option>
                <option value="price_asc">Sắp xếp: Giá thấp đến cao</option>
                <option value="price_desc">Sắp xếp: Giá cao đến thấp</option>
              </select>
            </div>\n            <div className="table-list admin-product-list">`;
            
code = code.replace(listStart, filterUI);

// 4. Change products.map to filteredProducts.map
code = code.replace(/\{products\.map\(\(p\) => \(/g, '{filteredProducts.map((p) => (');

// 5. Change image size from 60px to 90px
code = code.replace(/width: '60px', height: '60px'/g, "width: '90px', height: '90px'");

fs.writeFileSync('src/pages/shop/CostumesTab.jsx', code, 'utf8');
console.log('CostumesTab updated');
