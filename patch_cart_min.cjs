const fs = require('fs');
const path = 'src/pages/customer/Cart.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetHtml = `<input 
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
                        />`;

const newHtml = `<input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { startDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />
                        <span style={{ color: 'var(--muted)' }}>đến</span>
                        <input 
                          type="date" 
                          min={item.startDate || new Date().toISOString().split('T')[0]}
                          value={item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { endDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />`;

content = content.replace(targetHtml, newHtml);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Cart date limits');
