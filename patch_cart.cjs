const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `const handleAddToCart = () => {
    if (!form.size || !form.startDate || !form.endDate) {
      setMessage({ text: 'Vui lòng chọn size và thời gian thuê.', type: 'error' });
      return;
    }`;

const newCode = `const handleAddToCart = () => {
    const isSizeRequired = Array.isArray(product.sizes) ? product.sizes.length > 0 : !!product.size;
    if (isSizeRequired && !form.size) {
      setMessage({ text: 'Vui lòng chọn size.', type: 'error' });
      return;
    }
    if (!form.startDate || !form.endDate) {
      setMessage({ text: 'Vui lòng chọn thời gian thuê.', type: 'error' });
      return;
    }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed handleAddToCart in ProductDetail.jsx');
