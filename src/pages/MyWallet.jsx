import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getBalance, getTransactions, getWithdrawalRequests, updateBankAccount, depositWallet, withdrawWallet } from '../services/wallet.js';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket.js';
import { VIETNAM_BANKS, VIETNAM_BANKS_MAP } from '../constants/banks.js';
import { toast } from 'react-hot-toast';
import { Clock, AlertTriangle, Check, X, ShieldAlert, AlertCircle, Info } from 'lucide-react';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const MyWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bankForm, setBankForm] = useState({ bin: '', bankName: '', accountNumber: '', accountHolderName: '' });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [pendingTxId, setPendingTxId] = useState(null);

  const loadWallet = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [walletData, txData, withdrawalData] = await Promise.all([
        getBalance(),
        getTransactions(),
        getWithdrawalRequests()
      ]);
      setWallet(walletData);
      setTransactions(txData?.data || []);
      setWithdrawals(withdrawalData?.data || []);
      if (walletData?.bankAccount) {
        const bankAcc = { ...walletData.bankAccount };
        if (!bankAcc.bin && bankAcc.bankName) {
          bankAcc.bin = VIETNAM_BANKS_MAP[bankAcc.bankName] || '';
        }
        setBankForm(bankAcc);
      }
    } catch (err) {
      toast.error('Lỗi tải thông tin ví.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  // Khởi tạo Socket
  useEffect(() => {
    const socket = connectSocket();

    if (socket) {
      console.log('Socket initialized in MyWallet!', socket.id);

      socket.on('wallet_updated', (data) => {
        console.log('✅✅✅ NHẬN ĐƯỢC SOCKET TỪ BACKEND!', data);

        // Cập nhật Wallet
        setWallet(prev => ({
          ...prev,
          balance: data.balance,
          frozenBalance: data.frozenBalance
        }));

        // Nếu mã nạp tiền đang mở thì đóng lại
        if (data.status === 'completed') {
          setQrCode(null);
          setPendingTxId(null);
          toast.success('Ting ting! Số dư của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
          // Reload giao dịch để hiển thị lịch sử mới nhất
          getTransactions().then(txData => setTransactions(txData?.data || []));
        }
      });
    }

    return () => {
      console.log('MyWallet unmounted, disconnecting socket');
      disconnectSocket();
    };
  }, []);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBankAccount(bankForm);
      toast.success('Đã cập nhật thông tin ngân hàng thành công.');
      loadWallet();
    } catch (err) {
      toast.error('Lỗi cập nhật ngân hàng: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      return toast.error('Số tiền nạp tối thiểu là 10,000 đ');
    }
    try {
      const res = await depositWallet(Number(depositAmount));
      if (res.qrString) {
        setQrCode(res.qrString);
        setOrderCode(res.orderCode);
        setPendingTxId(res.transactionId);
        toast.success('Vui lòng dùng ứng dụng ngân hàng quét mã QR. Hệ thống sẽ tự động nhận diện khi bạn chuyển xong.');
      }
      setDepositAmount('');
      loadWallet(false);
    } catch (err) {
      toast.error('Lỗi tạo yêu cầu nạp tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 10000) {
      return toast.error('Số tiền rút tối thiểu là 10,000 đ');
    }
    if (!wallet?.bankAccount?.accountNumber) {
      return toast.error('Vui lòng cập nhật thông tin tài khoản ngân hàng trước khi rút tiền.');
    }
    try {
      await withdrawWallet(Number(withdrawAmount));
      toast.success('Đã gửi yêu cầu rút tiền thành công. Admin sẽ xử lý trong vòng 24h.');
      setWithdrawAmount('');
      loadWallet();
    } catch (err) {
      toast.error('Lỗi rút tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải ví...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '30px' }}>Ví của tôi (BuildLab Wallet)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Số dư ví */}
        <div className="card" style={{ padding: '30px', background: 'linear-gradient(135deg, var(--primary-strong), var(--accent))', color: 'white', borderRadius: '16px' }}>
          <p style={{ margin: '0 0 10px 0', opacity: 0.9, fontSize: '1.1rem' }}>Số dư khả dụng</p>
          <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800 }}>{money(wallet?.balance)} đ</h2>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '15px' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', opacity: 0.8 }}>Tiền đang đóng băng (Cọc)</p>
              <h3 style={{ margin: 0 }}>{money(wallet?.frozenBalance)} đ</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', opacity: 0.8 }}>Tổng tài sản</p>
              <h3 style={{ margin: 0 }}>{money((wallet?.balance || 0) + (wallet?.frozenBalance || 0))} đ</h3>
            </div>
          </div>
        </div>

        {/* Nạp & Rút tiền */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0 }}>Giao dịch nhanh</h3>

          <form onSubmit={handleDeposit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              placeholder="Nhập số tiền nạp..."
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="primary-button" style={{ whiteSpace: 'nowrap' }}>Nạp tiền</button>
          </form>

          {qrCode && (
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Quét mã QR để chuyển khoản</p>

              <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <QRCodeCanvas value={qrCode} size={220} level="M" />
              </div>

              <div style={{ marginTop: '20px', textAlign: 'left', background: 'white', padding: '15px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <p style={{ margin: '0 0 8px' }}>Nội dung chuyển khoản (BẮT BUỘC):</p>
                <h3 style={{ margin: 0, color: 'var(--primary-strong)', fontSize: '1.5rem', letterSpacing: '2px' }}>{orderCode}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '8px', marginBottom: 0 }}>
                  * Lưu ý: Ghi đúng nội dung trên để hệ thống tự động cộng tiền vào ví của bạn.
                </p>
              </div>

              <p style={{ marginTop: '15px', fontSize: '0.85rem', color: 'var(--muted)', animation: 'pulse 2s infinite' }}>
                Đang chờ thanh toán...
              </p>

              <button
                className="button"
                style={{ marginTop: '20px', width: '100%' }}
                onClick={() => { setQrCode(null); setPendingTxId(null); loadWallet(); }}
              >
                Đóng
              </button>
            </div>
          )}

          <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <input
              type="number"
              placeholder="Nhập số tiền rút..."
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="button" style={{ whiteSpace: 'nowrap' }}>Rút tiền</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Liên kết ngân hàng */}
        <div className="card">
          <h3 style={{ margin: '0 0 20px 0' }}>Tài khoản ngân hàng</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>
            Vui lòng nhập chính xác để nhận tiền rút từ hệ thống.
          </p>
          <form onSubmit={handleBankSubmit} style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Ngân hàng</label>
              <select
                value={bankForm.bankName}
                onChange={e => setBankForm({ ...bankForm, bankName: e.target.value, bin: VIETNAM_BANKS_MAP[e.target.value] || '' })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              >
                <option value="">-- Chọn Ngân hàng --</option>
                {VIETNAM_BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Mã BIN (6 chữ số)</label>
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
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>Tên Chủ Tài khoản</label>
              <input
                placeholder="VD: NGUYEN VAN A"
                value={bankForm.accountHolderName}
                onChange={e => setBankForm({ ...bankForm, accountHolderName: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <button type="submit" className="primary-button">Lưu thông tin</button>
          </form>
        </div>

        {/* Yêu cầu rút tiền */}
        {withdrawals.length > 0 && (
          <div className="card">
            <h3 style={{ margin: '0 0 20px 0' }}>Lịch sử yêu cầu rút tiền</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {withdrawals.map(w => (
                <div key={w._id} style={{ 
                  background: 'var(--surface-soft)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  borderLeft: `4px solid ${w.status === 'completed' ? 'var(--success)' : w.status === 'rejected' ? 'var(--danger)' : 'var(--warning)'}`
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600 }}>
                        Rút {money(w.amount)} đ
                      </p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {new Date(w.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: w.status === 'completed' ? 'var(--success-light)' : 
                                   w.status === 'rejected' ? 'var(--danger-light)' : 
                                   'var(--warning-light)',
                        color: w.status === 'completed' ? 'var(--success-strong)' : 
                               w.status === 'rejected' ? 'var(--danger-strong)' : 
                               'var(--warning-strong)'
                      }}>
                        {w.status === 'completed' ? 'Hoàn tất' : 
                         w.status === 'rejected' ? 'Từ chối' : 
                         w.status === 'processing' ? 'Đang xử lý' : 
                         'Chờ duyệt'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem' }}>
                    <div>
                      <p style={{ margin: '0 0 2px 0', color: 'var(--muted)', fontSize: '0.75rem' }}>Ngân hàng</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{w.bankAccount?.bankName}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px 0', color: 'var(--muted)', fontSize: '0.75rem' }}>Số tài khoản</p>
                      <p style={{ margin: 0, fontWeight: 600, fontFamily: 'monospace' }}>{w.bankAccount?.accountNumber}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 2px 0', color: 'var(--muted)', fontSize: '0.75rem' }}>Chủ tài khoản</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{w.bankAccount?.accountHolderName}</p>
                    </div>
                  </div>

                  {w.status === 'processing' && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--primary-strong)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Clock size={15} style={{ flexShrink: 0 }} />
                      <span>Admin đã bắt đầu chuyển khoản, hệ thống đang chờ ngân hàng xác nhận. Thường mất từ 5-30 phút.</span>
                    </div>
                  )}

                  {w.status === 'pending' && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--warning-strong)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Info size={15} style={{ flexShrink: 0 }} />
                      <span>Yêu cầu của bạn đang chờ admin duyệt và xử lý. Thường mất từ 1-24 giờ.</span>
                    </div>
                  )}

                  {w.status === 'rejected' && w.rejectionReason && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(220, 53, 69, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--danger-strong)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                      <span>Lý do từ chối: <strong>{w.rejectionReason}</strong></span>
                    </div>
                  )}

                  {w.qrString && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--muted)' }}>Mã tham chiếu: <strong style={{ fontFamily: 'monospace' }}>{w.orderCode}</strong></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lịch sử giao dịch */}
        <div className="card">
          <h3 style={{ margin: '0 0 20px 0' }}>Lịch sử giao dịch</h3>
          {transactions.length === 0 ? (
            <div className="empty-state">Chưa có giao dịch nào.</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {transactions.map(tx => (
                <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', textTransform: 'capitalize' }}>
                      {tx.type === 'deposit' ? 'Nạp tiền' : tx.type === 'withdrawal' ? 'Rút tiền' : tx.type === 'payment' ? 'Thanh toán' : tx.type}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {new Date(tx.createdAt).toLocaleString('vi-VN')} • {tx.description}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: ['deposit', 'refund'].includes(tx.type) ? 'var(--success)' : 'var(--danger)' }}>
                      {['deposit', 'refund'].includes(tx.type) ? '+' : '-'}{money(tx.amount)} đ
                    </strong>
                    <span style={{
                      display: 'block', fontSize: '0.75rem',
                      color: tx.status === 'completed' ? 'var(--success)' : tx.status === 'pending' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyWallet;
