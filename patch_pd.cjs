const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

// Import useCart
if (!content.includes('useCart')) {
  content = content.replace(
    "import { trackEvent } from '../../hooks/useAnalytics.js';",
    "import { trackEvent } from '../../hooks/useAnalytics.js';\nimport { useCart } from '../../hooks/useCart.js';"
  );
}

// Add handleAddToCart
if (!content.includes('const handleAddToCart')) {
  content = content.replace(
    "const { id } = useParams();",
    "const { id } = useParams();\n  const { addToCart } = useCart();"
  );

  content = content.replace(
    "const handleFormSubmit = (e) => {",
    `const handleAddToCart = () => {
    if (!form.size || !form.startDate || !form.endDate) {
      setMessage({ text: 'Vui lòng chọn size và thời gian thuê.', type: 'error' });
      return;
    }
    addToCart({
      product,
      size: form.size,
      startDate: form.startDate,
      endDate: form.endDate,
      rentalDays,
      totalAmount: costBreakdown?.total || 0,
      depositFee: costBreakdown?.deposit || 0
    });
    trackEvent('ADD_TO_CART', 'Thêm vào giỏ hàng', { productId: product._id, productName: product.name });
    setMessage({ text: 'Đã thêm sản phẩm vào giỏ hàng!', type: 'success' });
  };

  const handleFormSubmit = (e) => {`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('ProductDetail.jsx updated');
