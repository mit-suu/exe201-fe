const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /className=["']secondary-button["']\s+onClick=\{\(\) => handleAddToCart\(\)\}\s+disabled=\{!rentalDays\}/;
content = content.replace(regex, 'className="secondary-button"\n                    onClick={() => handleAddToCart()}');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed disabled attribute');
