const fs = require('fs');

// Patch OrdersTab.jsx
let ordersTab = fs.readFileSync('src/pages/shop/OrdersTab.jsx', 'utf8');
ordersTab = ordersTab.replace(
  /SĐT: \{o\.renter\?\.phone \|\| o\.user\?\.phone \|\| 'N\/A'\}/,
  "SĐT: {o.renter?.phone || o.user?.phone || 'N/A'} • Email: {o.renter?.email || o.user?.email || 'N/A'}"
);
fs.writeFileSync('src/pages/shop/OrdersTab.jsx', ordersTab);
console.log('OrdersTab patched');

// Patch ShopDashboard.jsx (Modal)
let shopDash = fs.readFileSync('src/pages/shop/ShopDashboard.jsx', 'utf8');
shopDash = shopDash.replace(
  /<p style={{ margin: '4px 0' }}><strong>\{selectedOrder\.user\?\.fullName\}<\/strong><\/p>/,
  `<p style={{ margin: '4px 0' }}><strong>{selectedOrder.renter?.fullName || selectedOrder.user?.fullName}</strong></p>`
);
shopDash = shopDash.replace(
  /<p style={{ margin: '2px 0', color: 'var\(--muted\)' }}>Email: \{selectedOrder\.user\?\.email\}<\/p>/,
  `<p style={{ margin: '2px 0', color: 'var(--muted)' }}>Email: {selectedOrder.renter?.email || selectedOrder.user?.email}</p>`
);
shopDash = shopDash.replace(
  /<p style={{ margin: '2px 0', color: 'var\(--muted\)' }}>SĐT: \{selectedOrder\.user\?\.phone \|\| 'N\/A'\}<\/p>/,
  `<p style={{ margin: '2px 0', color: 'var(--muted)' }}>SĐT: {selectedOrder.renter?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                <p style={{ margin: '2px 0', color: 'var(--muted)' }}>Địa chỉ: {selectedOrder.renter?.address || selectedOrder.user?.address || 'N/A'}</p>`
);
fs.writeFileSync('src/pages/shop/ShopDashboard.jsx', shopDash);
console.log('ShopDashboard Modal patched');
