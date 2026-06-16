const ConfigTab = ({ platformConfig, setPlatformConfig, adminBankInfo, setAdminBankInfo, handleSaveConfig }) => {
  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Tham số</p>
        <h2>Thiết lập cấu hình chiết khấu nền tảng & Banners</h2>
      </div>
      <form onSubmit={handleSaveConfig} className="input-group" style={{ maxWidth: '680px', gap: '18px' }}>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Phí hoa hồng commission nền tảng (%)</label>
          <input type="number" value={platformConfig.platformFeePercent || platformConfig.platformFeePercentage || 0} onChange={(e) => setPlatformConfig({ ...platformConfig, platformFeePercent: Number(e.target.value) })} required />
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Hệ thống tự động trừ phí hoa hồng này từ mỗi đơn hàng thành công của Shop.</p>
        </div>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Hạn mức nợ phí sàn tối đa để khóa Shop (đ)</label>
          <input type="number" value={platformConfig.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000} onChange={(e) => setPlatformConfig({ ...platformConfig, maxDebtLimit: Number(e.target.value) })} required />
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>Nếu ví của Shop bị âm vượt quá hạn mức nợ này, hệ thống sẽ tự động khóa Shop.</p>
        </div>
        <div>
          <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Banners trang chủ (Mỗi dòng một URL ảnh)</label>
          <textarea value={(platformConfig.banners || []).join('\n')} onChange={(e) => setPlatformConfig({ ...platformConfig, banners: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} placeholder="https://picsum.photos/seed/banner/1200/500" style={{ minHeight: '120px' }} />
        </div>
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Tài khoản ngân hàng nhận tiền nạp (EMVCo QR)</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Mã Ngân Hàng (BIN)</label>
              <input type="text" placeholder="VD: 970422 (MBBank)" value={adminBankInfo.bin || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, bin: e.target.value })} required />
              <small style={{ color: 'var(--muted)', display: 'block', marginTop: '4px' }}>Tra cứu mã BIN tại trang chủ Napas hoặc VietQR.</small>
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Số Tài Khoản</label>
              <input type="text" placeholder="VD: 0123456789" value={adminBankInfo.accountNumber || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountNumber: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontWeight: '600', display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Tên Chủ Tài Khoản</label>
              <input type="text" placeholder="VD: NGUYEN VAN A" value={adminBankInfo.accountName || ''} onChange={(e) => setAdminBankInfo({ ...adminBankInfo, accountName: e.target.value.toUpperCase() })} required />
            </div>
          </div>
        </div>
        <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>Lưu cấu hình hệ thống</button>
      </form>
    </section>
  );
};
export default ConfigTab;