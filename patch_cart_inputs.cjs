const fs = require('fs');
const path = 'src/pages/customer/Cart.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix imgUrl
content = content.replace(
  "const imgUrl = product.images?.[0] || 'https://placehold.co/100x100?text=Image';",
  "const imgUrl = (product.images?.[0]?.url || product.images?.[0]) || 'https://placehold.co/100x100?text=Image';"
);

// Add updateCartItem to hook destructuring
content = content.replace(
  "const { cart, removeFromCart, clearCart } = useCart();",
  "const { cart, removeFromCart, clearCart, updateCartItem } = useCart();"
);

// Replace the date display with date inputs
const targetHtml = `<div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    <div><strong>Size:</strong> {item.size}</div>
                    <div><strong>Thời gian:</strong> {new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')} ({item.rentalDays} ngày)</div>
                  </div>`;

const newHtml = `<div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text)', marginTop: '8px' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)' }}>Size:</strong> 
                      <span style={{ padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)', display: 'inline-block' }}>{item.size || 'Freesize'}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)' }}>Thời gian thuê ({item.rentalDays || 0} ngày):</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="date" 
                          value={item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { startDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />
                        <span style={{ color: 'var(--muted)' }}>đến</span>
                        <input 
                          type="date" 
                          value={item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { endDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />
                      </div>
                    </div>
                  </div>`;

content = content.replace(targetHtml, newHtml);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched Cart.jsx with date inputs and fixed images');
