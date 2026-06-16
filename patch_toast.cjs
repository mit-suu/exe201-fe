const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import toast")) {
  content = content.replace(
    "import { useCart } from '../../hooks/useCart.js';",
    "import { useCart } from '../../hooks/useCart.js';\nimport toast from 'react-hot-toast';"
  );
}

// Replace setMessage with toast in handleAddToCart
content = content.replace(
  "setMessage({ text: 'Vui lòng chọn size.', type: 'error' });",
  "toast.error('Vui lòng chọn size trước khi thêm vào giỏ hàng.');"
);

content = content.replace(
  "setMessage({ text: 'Vui lòng chọn thời gian thuê.', type: 'error' });",
  "toast.error('Vui lòng chọn thời gian thuê trước khi thêm vào giỏ hàng.');"
);

content = content.replace(
  "setMessage({ text: 'Đã thêm sản phẩm vào giỏ hàng!', type: 'success' });",
  "toast.success('Đã thêm sản phẩm vào giỏ hàng!');"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Added toast to ProductDetail.jsx');
