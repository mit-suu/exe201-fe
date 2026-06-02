import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getBalance, getTransactions, updateBankAccount, depositWallet, withdrawWallet } from '../services/wallet.js';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket.js';
import { VIETNAM_BANKS } from '../constants/banks.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const MyWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolderName: '' });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [pendingTxId, setPendingTxId] = useState(null);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadWallet = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [walletData, txData] = await Promise.all([
        getBalance(),
        getTransactions()
      ]);
      setWallet(walletData);
      setTransactions(txData?.data || []);
      if (walletData?.bankAccount) {
        setBankForm(walletData.bankAccount);
      }
    } catch (err) {
      setError('Lỗi tải thông tin ví.');
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
          setMessage('Ting ting! Số dư của bạn vừa được cộng thêm ' + money(data.amount) + ' đ');
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
      setMessage(''); setError('');
      await updateBankAccount(bankForm);
      setMessage('Đã cập nhật thông tin ngân hàng thành công.');
      loadWallet();
    } catch (err) {
      setError('Lỗi cập nhật ngân hàng: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 10000) {
      return setError('Số tiền nạp tối thiểu là 10,000 đ');
    }
    try {
      setMessage(''); setError('');
      const res = await depositWallet(Number(depositAmount));
      if (res.qrString) {
        setQrCode(res.qrString);
        setOrderCode(res.orderCode);
        setPendingTxId(res.transactionId);
        setMessage('Vui lòng dùng ứng dụng ngân hàng quét mã QR. Hệ thống sẽ tự động nhận diện khi bạn chuyển xong.');
      }
      setDepositAmount('');
      loadWallet(false);
    } catch (err) {
      setError('Lỗi tạo yêu cầu nạp tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 50000) {
      return setError('Số tiền rút tối thiểu là 50,000 đ');
    }
    if (!wallet?.bankAccount?.accountNumber) {
      return setError('Vui lòng cập nhật thông tin tài khoản ngân hàng trước khi rút tiền.');
    }
    try {
      setMessage(''); setError('');
      await withdrawWallet(Number(withdrawAmount));
      setMessage('Đã gửi yêu cầu rút tiền thành công. Admin sẽ xử lý trong vòng 24h.');
      setWithdrawAmount('');
      loadWallet();
    } catch (err) {
      setError('Lỗi rút tiền: ' + (err?.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải ví...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '30px' }}>Ví của tôi (BuildLab Wallet)</h1>
      
      {message && <div className="alert success-alert" style={{ marginBottom: '20px' }}>{message}</div>}
      {error && <div className="alert" style={{ marginBottom: '20px' }}>{error}</div>}

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
                onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
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
                    <span style={{ display: 'block', fontSize: '0.75rem', 
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
