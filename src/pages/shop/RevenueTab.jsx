
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink, Info, AlertTriangle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const RevenueTab = (props) => {

  const {
    products, orders, reviews, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleBankSubmit,
    withdrawAmount, setWithdrawAmount, handleWithdraw,
    handlePrintReport,
    replyText, setReplyText, handleReplySubmit,
    handleMarkNotifRead,
    handleProductEdit, handleProductDelete,
    newBusyDate, setNewBusyDate, handleAddBusyDate, handleRemoveBusyDate,
    selectedOrder, setSelectedOrder,
    checkingInOrder, setCheckingInOrder, checkInImages, setCheckInImages,
    checkingOutOrder, setCheckingOutOrder, checkOutImages, setCheckOutImages,
    disputingOrder, setDisputingOrder, disputeReason, setDisputeReason, disputeAmount, setDisputeAmount,
    handleStatusChange,
    navigate,
    setShowProductForm,
    loadData,
    platformConfig, depositAmount, setDepositAmount, qrCode, setQrCode, orderCode, setOrderCode, pendingTxId, setPendingTxId, handleDeposit,
    VIETNAM_BANKS, VIETNAM_BANKS_MAP
  } = props;

  const pendingRevenue = (orders || []).filter(o => ['Pending', 'Approved'].includes(o.status)).reduce((sum, o) => sum + (o.pricing?.lenderRevenue || o.totalAmount || 0), 0);
  const withdrawnAmount = (transactions || []).filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingWithdrawalAmount = (transactions || []).filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
            <div className="admin-section-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
              <div className="card" style={{ alignSelf: 'start' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary-strong), var(--primary))', color: 'white', padding: '25px', borderRadius: '18px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                  <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '0.9rem', fontWeight: 600 }}>Số dư khả dụng</p>
                  <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>
                    {money(wallet?.balance)} <span style={{ fontSize: '1rem', opacity: 0.8 }}>đ</span>
                  </h2>
                  {wallet?.balance < 0 && (
                    <div style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.25)', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fca5a5' }}>
                      <AlertTriangle size={14} style={{ color: '#fca5a5', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Đang nợ phí dịch vụ: {money(Math.abs(wallet.balance))} đ
                    </div>
                  )}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', opacity: 0.8 }}>Tiền đóng băng (Cọc)</p>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{money(wallet?.frozenBalance)} đ</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', opacity: 0.8 }}>Tổng tài sản</p>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{money((wallet?.balance || 0) + (wallet?.frozenBalance || 0))} đ</h3>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '15px', background: 'var(--surface-soft)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: '1.4' }}>
                  <Info size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                  <span>
                    Hạn mức nợ phí sàn tối đa cho phép: <strong>-{money(platformConfig?.maxDebtLimit !== undefined ? platformConfig.maxDebtLimit : 5000000)} đ</strong>. Cửa hàng sẽ bị khóa nếu số dư ví khả dụng âm vượt quá hạn mức này.
                  </span>
                </div>

                {/* Quick Transaction Section */}
                <div style={{ marginTop: '25px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Giao dịch nhanh</h3>

                  {/* Form Nạp tiền */}
                  <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="number"
                      placeholder="Nhập số tiền nạp..."
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" className="primary-button" style={{ whiteSpace: 'nowrap' }}>Nạp tiền</button>
                  </form>
                  {wallet?.balance < 0 && (
                    <button
                      type="button"
                      onClick={() => setDepositAmount(Math.abs(wallet.balance).toString())}
                      className="button"
                      style={{ width: '100%', marginBottom: '15px', color: '#991b1b', background: '#fef2f2', border: '1px solid #fee2e2', fontWeight: 'bold', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Info size={15} style={{ color: '#991b1b' }} /> Tự động điền số tiền trả nợ: {money(Math.abs(wallet.balance))} đ
                    </button>
                  )}

                  {qrCode && (
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '15px', color: 'var(--text)' }}>Quét mã QR để nạp tiền</p>

                      <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <QRCodeCanvas value={qrCode} size={160} level="M" />
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'left', background: 'white', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>Nội dung chuyển khoản (BẮT BUỘC):</p>
                        <h3 style={{ margin: 0, color: 'var(--primary-strong)', fontSize: '1.3rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{orderCode}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '8px', marginBottom: 0 }}>
                          * Ghi chính xác nội dung trên để hệ thống tự động cộng tiền.
                        </p>
                      </div>

                      <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Clock size={15} style={{ color: '#9ca3af' }} /> Đang chờ thanh toán nhận diện...
                      </p>

                      <button
                        type="button"
                        className="button"
                        style={{ marginTop: '10px', width: '100%' }}
                        onClick={() => { setQrCode(null); setPendingTxId(null); loadData(); }}
                      >
                        Đóng
                      </button>
                    </div>
                  )}

                  {/* Form Rút tiền */}
                  <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                    <input
                      type="number"
                      placeholder="Nhập số tiền rút..."
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button type="submit" className="button" style={{ whiteSpace: 'nowrap' }}>Rút tiền</button>
                  </form>
                </div>
              </div>

              <div className="card" style={{ alignSelf: 'start' }}>
                <h3 style={{ margin: '0 0 20px 0' }}>Tài khoản ngân hàng</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>
                  Vui lòng nhập chính xác để nhận tiền rút doanh thu từ hệ thống.
                </p>
                <form onSubmit={handleBankSubmit} style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Ngân hàng</label>
                    <select
                      value={bankForm.bankName}
                      onChange={e => setBankForm({ ...bankForm, bankName: e.target.value, bin: VIETNAM_BANKS_MAP[e.target.value] || '' })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">-- Chọn Ngân hàng --</option>
                      {VIETNAM_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Mã BIN</label>
                      <input
                        type="text"
                        placeholder="Tự động điền"
                        value={bankForm.bin}
                        onChange={e => setBankForm({ ...bankForm, bin: e.target.value })}
                        maxLength="6"
                        readOnly
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--muted)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Số Tài khoản</label>
                      <input
                        placeholder="VD: 1029384756"
                        value={bankForm.accountNumber}
                        onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Chủ Tài khoản</label>
                    <input
                      placeholder="VD: NGUYEN VAN A"
                      value={bankForm.accountHolderName}
                      onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value.toUpperCase() })}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>
                  <button type="submit" className="primary-button" style={{ marginTop: '10px' }}>Lưu thông tin</button>
                </form>
              </div>
            </div>

            <section className="admin-stat-grid">
              <article className="order-summary-card">
                <strong style={{ color: 'var(--accent)' }}>{money(revenueStats.totalRevenue)} đ</strong>
                <span>Tổng doanh thu thực nhận</span>
              </article>
              <article className="order-summary-card">
                <strong>{money(revenueStats.monthlyRevenue)} đ</strong>
                <span>Doanh thu tháng này</span>
              </article>
              <article className="order-summary-card">
                <strong>{money(revenueStats.dailyRevenue)} đ</strong>
                <span>Doanh thu hôm nay</span>
              </article>
              <article className="order-summary-card">
                <strong style={{ color: 'var(--success)' }}>{revenueStats.successfulOrders}</strong>
                <span>Đơn hàng giao nhận thành công</span>
              </article>
            </section>

            
            {/* Minh bạch dòng tiền */}
            <article className="card" style={{ marginTop: '5px' }}>
              <div className="section-heading compact-heading">
                <p className="eyebrow">Minh bạch tài chính</p>
                <h2>Chi tiết dòng tiền Cửa hàng</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền cọc đang giữ</p>
                  <h3 style={{ margin: 0, color: 'var(--primary-strong)' }}>{money(wallet?.frozenBalance || 0)} đ</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '5px' }}>Thuộc các đơn đang thuê chưa trả đồ</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#fffbeb' }}>
                  <p style={{ color: '#b45309', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Doanh thu chờ xử lý</p>
                  <h3 style={{ margin: 0, color: '#b45309' }}>{money(pendingRevenue)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Từ các đơn Pending / Approved</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#eff6ff' }}>
                  <p style={{ color: '#1d4ed8', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền đang chờ rút</p>
                  <h3 style={{ margin: 0, color: '#1d4ed8' }}>{money(pendingWithdrawalAmount)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Yêu cầu rút tiền chưa duyệt</p>
                </div>
                <div style={{ padding: '15px', borderRadius: '14px', border: '1px solid var(--border)', background: '#f0fdf4' }}>
                  <p style={{ color: '#15803d', fontSize: '0.85rem', margin: '0 0 5px', fontWeight: 'bold' }}>Tiền đã rút thành công</p>
                  <h3 style={{ margin: 0, color: '#15803d' }}>{money(withdrawnAmount)} đ</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '5px' }}>Lũy kế từ trước đến nay</p>
                </div>
              </div>
            </article>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
              <button onClick={handlePrintReport} className="primary-button" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                <Download size={16} /> Xuất báo cáo doanh thu đơn giản
              </button>
            </div>

            <div className="admin-section-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* CSS Bar Chart: Top Rented Items */}
              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Thống kê sản phẩm</p>
                  <h2>Sản phẩm thuê nhiều nhất</h2>
                </div>
                <div style={{ display: 'grid', gap: '15px', marginTop: '10px' }}>
                  {revenueStats.topProducts && revenueStats.topProducts.map((p, idx) => {
                    const maxVal = Math.max(...revenueStats.topProducts.map(x => x.count), 1);
                    const percentage = (p.count / maxVal) * 100;
                    return (
                      <div key={idx} style={{ display: 'grid', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <strong>{p.name}</strong>
                          <span>{p.count} lượt đặt</span>
                        </div>
                        {/* Custom CSS Bar Chart */}
                        <div style={{ height: '12px', background: 'var(--surface-soft)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, var(--primary-strong), var(--accent))',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                  {(!revenueStats.topProducts || revenueStats.topProducts.length === 0) && (
                    <div className="empty-state">Chưa có đủ số liệu đặt thuê để xếp hạng.</div>
                  )}
                </div>
              </article>

              {/* Monthly Revenue visual breakdown block */}
              <article className="card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Đơn hàng</p>
                  <h2>Tỷ lệ hoàn thành đơn đặt</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', height: '100%' }}>
                  <div style={{ background: 'var(--surface-soft)', padding: '20px', borderRadius: '18px', textAlign: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--success)' }}>
                      {orders.length > 0
                        ? `${Math.round((revenueStats.successfulOrders / orders.length) * 100)}%`
                        : '0%'
                      }
                    </h3>
                    <p style={{ color: 'var(--muted)', margin: '5px 0 0', fontWeight: '800' }}>Tỷ lệ đơn hàng thành công</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <strong>{revenueStats.successfulOrders}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Hoàn thành</span>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <strong>{revenueStats.cancelledOrders}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Bị hủy</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* Lịch sử giao dịch ví của Shop */}
            <article className="card" style={{ marginTop: '20px' }}>
              <div className="section-heading compact-heading">
                <p className="eyebrow">Lịch sử tài chính</p>
                <h2>Lịch sử giao dịch ví của Shop</h2>
              </div>
              {transactions.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '15px' }}>Chưa có lịch sử giao dịch nào.</div>
              ) : (
                <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                  {transactions.slice(0, 15).map(tx => (
                    <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ display: 'block', textTransform: 'capitalize', fontSize: '0.95rem' }}>
                          {tx.type === 'deposit' ? 'Nạp tiền' : tx.type === 'withdrawal' ? 'Rút tiền' : tx.type === 'payment' ? 'Thanh toán' : tx.type === 'refund' ? 'Hoàn tiền' : tx.type}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.description}
                          {tx.order && <span style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>Đơn hàng: #{typeof tx.order === 'object' ? tx.order._id?.slice(-8).toUpperCase() : tx.order?.slice(-8).toUpperCase()}</span>}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: ['deposit', 'refund'].includes(tx.type) ? 'var(--success)' : 'var(--danger)', fontSize: '1rem' }}>
                          {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}{money(tx.amount)} đ
                        </strong>
                        <span style={{
                          display: 'block', fontSize: '0.75rem', fontWeight: 'bold',
                          color: tx.status === 'completed' ? 'var(--success)' : tx.status === 'pending' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
  );
};

export default RevenueTab;


