import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { getContractByOrder, signContract } from '../services/contracts.js';

const ContractModal = ({ order, onClose, role }) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [showContract, setShowContract] = useState(false);

  useEffect(() => {
    if (order?._id) {
      setLoading(true);
      getContractByOrder(order._id)
        .then(c => setContract(c))
        .catch(() => setContract(null))
        .finally(() => setLoading(false));
    }
  }, [order?._id]);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('exe201-user') || '{}');
      setUserFullName(u?.fullName || '');
    } catch { setUserFullName(''); }
  }, []);

  const handleSign = async () => {
    if (!signature) return toast.error('Vui lòng nhập họ tên để ký hợp đồng');
    if (signature.trim() !== userFullName.trim()) return toast.error('Chữ ký phải khớp chính xác với họ tên tài khoản của bạn');
    try {
      setSigning(true);
      const r = await signContract(order._id);
      toast.success(r.message);
      const updated = await getContractByOrder(order._id);
      setContract(updated);
      setSignature('');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Lỗi ký hợp đồng');
    } finally { setSigning(false); }
  };

  const mySigned = role === 'renter' ? contract?.signatures?.renterSignedAt : contract?.signatures?.lenderSignedAt;
  const isFullySigned = contract?.status === 'Signed';
  const isSigned = !!mySigned;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '600px', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Hợp Đồng Điện Tử Thuê Trang Phục</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>&times;</button>
        </div>

        {/* Body - scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Đang tải hợp đồng...</div>
          ) : !contract ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Đơn hàng này chưa có hợp đồng. Hợp đồng sẽ được tạo khi shop xác nhận đơn.</div>
          ) : (
            <>
              {/* Nội dung hợp đồng giống PartnerRegister */}
              <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><small style={{ fontWeight: 400 }}>Độc lập - Tự do - Hạnh phúc</small></h3>
              <h4 style={{ textAlign: 'center', marginBottom: '16px' }}>HỢP ĐỒNG THUÊ TRANG PHỤC</h4>

              <p>Hợp đồng này ("Hợp đồng") được thiết lập giữa <strong>Người Thuê</strong> và <strong>Chủ Gian Hàng (Shop)</strong> trên nền tảng BuildLab Costume Rental.</p>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', whiteSpace: 'pre-wrap', fontSize: '0.85rem', border: '1px solid var(--border)', margin: '16px 0', maxHeight: '200px', overflowY: 'auto' }}>
                {contract.terms}
              </div>

              <strong>Điều 1: Trách nhiệm của Người Thuê</strong>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem' }}>
                <li>Thanh toán đầy đủ tiền thuê và tiền cọc theo quy định.</li>
                <li>Hoàn trả trang phục đúng thời hạn, đúng tình trạng ban đầu.</li>
                <li>Bồi thường thiệt hại nếu làm hỏng, mất trang phục theo giá trị sản phẩm.</li>
                <li>Chịu phí phạt trễ hạn: 150% giá thuê/ngày nếu trả trễ.</li>
              </ul>

              <strong>Điều 2: Trách nhiệm của Shop</strong>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem' }}>
                <li>Giao trang phục đúng mô tả, đúng size, đúng thời gian đã thỏa thuận.</li>
                <li>Đảm bảo trang phục sạch sẽ, an toàn, không hư hỏng trước khi giao.</li>
                <li>Hoàn trả tiền cọc cho Người Thuê sau khi nhận lại đồ và kiểm tra tình trạng.</li>
              </ul>

              <strong>Điều 3: Ký kết điện tử</strong>
              <p style={{ fontSize: '0.85rem' }}>Bằng việc nhập chính xác Họ và Tên dưới đây, các bên xác nhận đã đọc, hiểu rõ và đồng ý chịu ràng buộc bởi tất cả các điều khoản trong Hợp đồng này. Chữ ký điện tử này có giá trị pháp lý tương đương với chữ ký tay theo quy định của Luật Giao dịch điện tử.</p>

              {/* Trạng thái chữ ký */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                <div style={{ background: 'var(--surface-soft)', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>👤 Người Thuê</div>
                  <div style={{ color: contract.signatures?.renterSignedAt ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {contract.signatures?.renterSignedAt ? `✅ Đã ký ${new Date(contract.signatures.renterSignedAt).toLocaleDateString('vi-VN')}` : '❌ Chưa ký'}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-soft)', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>🏪 Shop</div>
                  <div style={{ color: contract.signatures?.lenderSignedAt ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {contract.signatures?.lenderSignedAt ? `✅ Đã ký ${new Date(contract.signatures.lenderSignedAt).toLocaleDateString('vi-VN')}` : '❌ Chưa ký'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Signature area (giống PartnerRegister) */}
        {contract && !loading && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface-soft)' }}>
            {!isSigned ? (
              <>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Ký tên điện tử (Nhập chính xác Họ và Tên của bạn):
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={`Nhập: ${userFullName}`}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '15px' }}
                />
                <button
                  type="button"
                  className="primary-button"
                  style={{ width: '100%' }}
                  disabled={signing || !signature.trim() || signature.trim() !== userFullName.trim()}
                  onClick={handleSign}
                >
                  {signing ? 'Đang xử lý...' : 'Ký Hợp Đồng'}
                </button>
                {signature && signature.trim() !== userFullName.trim() && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                    Chữ ký phải khớp chính xác với tên tài khoản (<strong>{userFullName}</strong>)
                  </p>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--success)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={18} /> Bạn đã ký hợp đồng này
                </div>
                <div style={{ fontStyle: 'italic', color: 'var(--muted)', marginBottom: '15px' }}>
                  Chữ ký số: <strong>{userFullName}</strong>
                  {isFullySigned && <span style={{ color: 'var(--success)', marginLeft: '8px' }}>| ✅ Hợp đồng đã hoàn tất</span>}
                </div>
                <button type="button" className="button" onClick={onClose}>Đóng</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractModal;
