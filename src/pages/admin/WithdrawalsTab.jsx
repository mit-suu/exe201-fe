import { Info } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const WithdrawalsTab = ({ withdrawals, handleProcessWithdrawal, visibleWithdrawalQr, setVisibleWithdrawalQr }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Tài chính</p>
        <h2>Yêu cầu rút tiền từ người dùng</h2>
      </div>
      <div className="table-list">
        {withdrawals.map((w) => (
          <div className="table-row" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} key={w._id}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 8px 0' }}>
                  Người yêu cầu: <strong>{w.user?.fullName}</strong> • {w.user?.email}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  {new Date(w.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`status-pill ${w.status === 'completed' ? 'active' : w.status === 'rejected' ? 'inactive' : 'warning'}`}>
                  {w.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-soft)', padding: '12px', borderRadius: '8px', border: '2px solid var(--primary)' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>THÔNG TIN CHUYỂN KHOẢN</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tiền</p>
                  <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-strong)' }}>{money(w.amount)} đ</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Mã tham chiếu</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent)' }}>{w.orderCode}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Ngân hàng</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.bankName}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Số tài khoản</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{w.bankAccount?.accountNumber}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Chủ tài khoản</p>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{w.bankAccount?.accountHolderName}</p>
                </div>
              </div>
            </div>

            {(w.status === 'pending' || w.status === 'processing') && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {w.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleProcessWithdrawal(w._id, 'processing')}
                        className="primary-button"
                        style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                      >
                        Bắt đầu chuyển
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(w._id, 'rejected')}
                        className="button danger"
                        style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {w.status === 'processing' && (
                    <button
                      onClick={() => handleProcessWithdrawal(w._id, 'rejected')}
                      className="button danger"
                      style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                    >
                      Từ chối
                    </button>
                  )}
                  <button
                    className="button"
                    style={{ minHeight: '34px', fontSize: '0.8rem', padding: '0 14px' }}
                    onClick={() => setVisibleWithdrawalQr(visibleWithdrawalQr === w._id ? null : w._id)}
                  >
                    {visibleWithdrawalQr === w._id ? 'Ẩn QR' : 'Xem QR'}
                  </button>
                </div>

                {w.status === 'processing' && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    background: '#fef3c7',
                    padding: '6px 10px',
                    borderRadius: '6px'
                  }}>
                    Hệ thống sẽ tự động cập nhật trạng thái
                  </div>
                )}
              </div>
            )}

            {visibleWithdrawalQr === w._id && w.qrString && (
              <div style={{ textAlign: 'center', background: '#fff', padding: '16px', borderRadius: '12px', border: '2px solid var(--border)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <Info size={16} style={{ color: '#6b7280' }} /> Quét mã này để chuyển khoản
                </p>
                <div style={{ display: 'inline-block', background: 'white', padding: '8px', borderRadius: '8px' }}>
                  <QRCodeCanvas value={w.qrString} size={150} level="M" />
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Nội dung: <strong>{w.orderCode}</strong></p>
              </div>
            )}

            {w.rejectionReason && (
              <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger)' }}>Lý do từ chối: {w.rejectionReason}</p>
              </div>
            )}
          </div>
        ))}
        {withdrawals.length === 0 && <div className="empty-state">Không có yêu cầu rút tiền nào.</div>}
      </div>
    </section>
  );
};
export default WithdrawalsTab;