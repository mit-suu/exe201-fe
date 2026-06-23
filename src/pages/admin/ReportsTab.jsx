const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const ReportsTab = ({ reportData }) => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section className="admin-stat-grid">
        <article className="order-summary-card">
          <strong style={{ color: 'var(--accent)' }}>{money(reportData.totalRevenue)} đ</strong>
          <span>Tổng doanh số giao dịch</span>
        </article>
        <article className="order-summary-card">
          <strong>{reportData.totalOrders}</strong>
          <span>Tổng đơn thuê toàn hệ thống</span>
        </article>
        <article className="order-summary-card">
          <strong>{reportData.totalUsers}</strong>
          <span>Khách hàng hoạt động</span>
        </article>
        <article className="order-summary-card">
          <strong>{reportData.totalShops}</strong>
          <span>Cửa hàng (Shops) đăng ký</span>
        </article>
        <article className="order-summary-card">
          <strong>{reportData.totalProducts}</strong>
          <span>Số lượng trang phục đăng listing</span>
        </article>
      </section>

      <div className="admin-section-grid" style={{ gridTemplateColumns: '1.12fr 0.88fr' }}>
        <article className="card">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Tăng trưởng tài chính</p>
            <h2>Biểu đồ doanh thu theo tháng</h2>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', height: '240px', padding: '20px 10px 10px', background: 'var(--surface-soft)', borderRadius: '18px', marginTop: '10px' }}>
            {reportData.monthlyRevenue && reportData.monthlyRevenue.map((mr, idx) => {
              const maxVal = Math.max(...reportData.monthlyRevenue.map(x => x.value), 1);
              const heightPercent = (mr.value / maxVal) * 80 + 10;
              return (
                <div key={idx} style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>{money(mr.value)} đ</span>
                  <div style={{ width: '100%', maxHeight: '180px', height: `${heightPercent}px`, background: 'linear-gradient(180deg, var(--accent), var(--primary-strong))', borderRadius: '8px 8px 0 0', transition: 'height 0.4s ease' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '800' }}>{mr.label}</span>
                </div>
              );
            })}
            {(!reportData.monthlyRevenue || reportData.monthlyRevenue.length === 0) && (
              <div className="chat-empty" style={{ margin: 'auto' }}>Chưa có đủ số liệu tháng.</div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact-heading">
            <p className="eyebrow">Xếp hạng cửa hàng</p>
            <h2>Shops có doanh thu cao nhất</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {reportData.revenueByShop && reportData.revenueByShop.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--surface-soft)', borderRadius: '12px' }}>
                <strong>{idx + 1}. {item.shop}</strong>
                <strong style={{ color: 'var(--accent)' }}>{money(item.revenue)} đ</strong>
              </div>
            ))}
            {(!reportData.revenueByShop || reportData.revenueByShop.length === 0) && (
              <div className="empty-state">Nền tảng chưa ghi nhận giao dịch nào.</div>
            )}
          </div>
        </article>
      </div>

      <article className="card" style={{ maxWidth: '650px' }}>
        <div className="section-heading compact-heading">
          <p className="eyebrow">Thống kê sản phẩm</p>
          <h2>Trang phục được thuê nhiều nhất</h2>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {reportData.topProducts && reportData.topProducts.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <strong>{p.name}</strong>
              <span><strong>{p.count}</strong> lượt thuê</span>
            </div>
          ))}
          {(!reportData.topProducts || reportData.topProducts.length === 0) && (
            <div className="empty-state">Chưa có trang phục nào được thuê.</div>
          )}
        </div>
      </article>
    </div>
  );
};

export default ReportsTab;
