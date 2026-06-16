const fs = require('fs');
const path = 'src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import Cart from')) {
  content = content.replace(
    "import ProductDetail from './pages/customer/ProductDetail.jsx';",
    "import ProductDetail from './pages/customer/ProductDetail.jsx';\nimport Cart from './pages/customer/Cart.jsx';"
  );
  
  content = content.replace(
    '<Route path="/products" element={<Products />} />',
    '<Route path="/products" element={<Products />} />\n          <Route path="/cart" element={<Cart />} />'
  );
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('App.jsx patched with Cart route');
}
