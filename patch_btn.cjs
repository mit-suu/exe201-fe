const fs = require('fs');
const path = 'src/pages/customer/ProductDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `<button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleAddToCart()}
                    disabled={!rentalDays}
                    style={{ padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >`;

const replaceStr = `<button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleAddToCart()}
                    style={{ padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  >`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed button');
