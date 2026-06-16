const fs = require('fs');
let code = fs.readFileSync('src/pages/shop/DashboardTab.jsx', 'utf8');

const regex = /<section className="admin-stat-grid">[\s\S]*?<\/section>/;

const replace = `<section className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <article className="order-summary-card">
                <strong>{money(revenueStats.totalRevenue)} đ</strong>
                <span>Tổng doanh thu</span>
              </article>
              <article className="order-summary-card">
                <strong>{pendingOrdersCount}</strong>
                <span style={{ color: pendingOrdersCount > 0 ? 'var(--warning)' : 'inherit' }}>Đơn chờ xác nhận</span>
              </article>
              <article className="order-summary-card">
                <strong>{rentedOrdersCount}</strong>
                <span style={{ color: rentedOrdersCount > 0 ? 'var(--success)' : 'inherit' }}>Đơn đang cho thuê</span>
              </article>
              <article className="order-summary-card">
                <strong>{returningSoonCount}</strong>
                <span style={{ color: returningSoonCount > 0 ? 'var(--danger)' : 'inherit' }}>Đơn sắp đến ngày trả</span>
              </article>
              <article className="order-summary-card">
                <strong>{products.length}</strong>
                <span>Tổng SP niêm yết</span>
              </article>
              <article className="order-summary-card">
                <strong>{Math.max(0, products.length - rentedOrdersCount)}</strong>
                <span>Sản phẩm trống</span>
              </article>
              <article className="order-summary-card">
                <strong>{lockedDatesCount}</strong>
                <span>Ngày đang khóa lịch</span>
              </article>
              <article className="order-summary-card" style={{ background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)' }}>
                <strong>{bigSizeCount}</strong>
                <span style={{ color: 'var(--success)' }}>Trang phục Big-Size</span>
              </article>
            </section>`;

code = code.replace(regex, replace);
fs.writeFileSync('src/pages/shop/DashboardTab.jsx', code, 'utf8');
console.log('Fixed HTML stats');
