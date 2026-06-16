const fs = require('fs');
const path1 = 'src/pages/admin/CostumesTab.jsx';
const path2 = 'src/pages/admin/OrdersTab.jsx';

// Fix CostumesTab
let costumes = fs.readFileSync(path1, 'utf8');
costumes = costumes.replace('p.rentalPricePerDay', 'p.rentalPrice');
costumes = costumes.replace("p.sizes?.join(', ')", 'p.size');
fs.writeFileSync(path1, costumes, 'utf8');

// Fix OrdersTab
let orders = fs.readFileSync(path2, 'utf8');
orders = orders.replace('o.rentalStartDate', 'o.startDate');
orders = orders.replace('o.rentalEndDate', 'o.endDate');

const oldSelect = `<select value={o.status} onChange={(e) => handleOverrideOrderStatus(o._id, e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                <option value="pending">Pending (Chờ duyệt)</option>
                <option value="confirmed">Confirmed (Xác nhận)</option>
                <option value="renting">Renting (Đang thuê)</option>
                <option value="returned">Returned (Đã trả)</option>
                <option value="cancelled">Cancelled (Hủy)</option>
              </select>`;

const newSelect = `<select value={o.status} onChange={(e) => handleOverrideOrderStatus(o._id, e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', width: '150px' }}>
                <option value="Pending">Pending (Chờ duyệt)</option>
                <option value="Approved">Approved (Xác nhận)</option>
                <option value="Shipped">Shipped (Đang giao)</option>
                <option value="Rented">Rented (Đang thuê)</option>
                <option value="Returning">Returning (Đang trả)</option>
                <option value="Returned">Returned (Đã nhận lại)</option>
                <option value="Completed">Completed (Hoàn tất)</option>
                <option value="Canceled">Canceled (Hủy)</option>
                <option value="Disputed">Disputed (Khiếu nại)</option>
              </select>`;

orders = orders.replace(oldSelect, newSelect);
fs.writeFileSync(path2, orders, 'utf8');

console.log('Fixed CostumesTab and OrdersTab data bindings');
