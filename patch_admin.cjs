const fs = require('fs');
const path = 'src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `{selectedOrder.status === 'pending' && (
                <button onClick={() => handleOverrideOrderStatus(selectedOrder._id, 'confirmed')} className="primary-button">Duyệt nhận đơn</button>
              )}`;
const newStr = `{selectedOrder.status === 'Pending' && (
                <button onClick={() => handleOverrideOrderStatus(selectedOrder._id, 'Approved')} className="primary-button">Duyệt nhận đơn</button>
              )}`;

content = content.replace(oldStr, newStr);

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced');
