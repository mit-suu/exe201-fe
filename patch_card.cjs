const fs = require('fs');
const path = 'src/components/ProductCard.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useNavigate')) {
  content = content.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link, useNavigate } from 'react-router-dom';"
  );
}

if (!content.includes('const navigate = useNavigate()')) {
  content = content.replace(
    "const ProductCard = ({ product }) => {",
    "const ProductCard = ({ product }) => {\n  const navigate = useNavigate();"
  );
}

content = content.replace(
  '<article className="product-card">',
  '<article className="product-card" style={{ cursor: \'pointer\' }} onClick={(e) => { if (!e.target.closest(\'a\') && !e.target.closest(\'button\')) navigate(\'/products/\' + product._id); }}>'
);

content = content.replace(
  '<h3>{product.name}</h3>',
  '<h3><Link to={`/products/${product._id}`} style={{ color: \'inherit\', textDecoration: \'none\' }}>{product.name}</Link></h3>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Made ProductCard clickable');
