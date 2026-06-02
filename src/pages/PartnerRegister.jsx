import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { saveSession } from '../services/auth.js';
import vnUnits from '../../vn_units.json';

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [lenderForm, setLenderForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'lender',
    acceptEContract: false
  });
  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    ward: ''
  });
  const [regError, setRegError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [signature, setSignature] = useState('');
  const [isContractSigned, setIsContractSigned] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licenseUrl, setLicenseUrl] = useState('');
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);

  const selectedProvince = useMemo(
    () => vnUnits.find((p) => p.FullName === shopInfo.city),
    [shopInfo.city]
  );
  const wardsList = selectedProvince?.Wards || [];

  const handleLenderChange = (e) => {
    const { name, type, checked, value } = e.target;
    setLenderForm({ ...lenderForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleShopChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setShopInfo({
        ...shopInfo,
        city: value,
        district: '',
        ward: ''
      });
      return;
    }
    setShopInfo({ ...shopInfo, [name]: value });
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLicenseFile(file);
    setIsUploadingLicense(true);
    setRegError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLicenseUrl(response.data.data.url);
    } catch (err) {
      setRegError('Tải ảnh thất bại. Vui lòng thử lại.');
      setLicenseFile(null);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleLenderSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);

    if (!isContractSigned || !signature) {
      setRegError('Bạn cần ký hợp đồng điện tử trước khi đăng ký.');
      return;
    }
    if (!licenseUrl) {
      setRegError('Bạn cần tải lên ảnh Giấy phép kinh doanh / CCCD.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: lenderForm.fullName,
        email: lenderForm.email,
        password: lenderForm.password,
        roleChoice: 'lender',
        shopInfo: { ...shopInfo, contractSignature: signature, businessLicenseUrl: licenseUrl }
      };
      const response = await api.post('/auth/register', payload);
      const registeredUser = response.data.data.user;
      saveSession(registeredUser, response.data.data.accessToken);
      navigate('/shop/dashboard');
      window.location.reload();
    } catch (err) {
      setRegError(err?.response?.data?.message || 'Đăng ký đối tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page partner-register-page">
      <div className="auth-brand-panel register-panel">
        <span className="logo-mark large" aria-hidden="true"><span className="logo-hanger"></span></span>
        <p className="eyebrow">Dành cho chủ cửa hàng</p>
        <h1>Trở thành đối tác BuildLab.</h1>
        <p>Mở gian hàng và bắt đầu kinh doanh trang phục ngay hôm nay. Quản lý đơn hàng, doanh thu và khách hàng dễ dàng.</p>
        <div className="auth-highlight-grid">
          <span>Tăng doanh thu</span>
          <span>Quản lý dễ dàng</span>
          <span>Hỗ trợ 24/7</span>
        </div>
      </div>

      <div className="form-card auth-card partner-register-card">
        <div className="auth-card-heading">
          <p className="eyebrow">Đăng ký đối tác</p>
          <h2>Mở gian hàng</h2>
          <p>Điền thông tin để tạo tài khoản chủ shop.</p>
        </div>
        
        {regError && <div className="alert">{regError}</div>}

        <form onSubmit={handleLenderSubmit} className="partner-modal-form">
          <div className="form-section">
            <div className="form-section-title">Thông tin tài khoản</div>
            <div className="form-row">
              <div className="input-group">
                <label>Họ tên chủ shop</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Nguyễn Văn A"
                  value={lenderForm.fullName}
                  onChange={handleLenderChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Email liên hệ</label>
                <input
                  type="email"
                  name="email"
                  placeholder="shop@example.com"
                  value={lenderForm.email}
                  onChange={handleLenderChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Mật khẩu đăng nhập</label>
              <input
                type="password"
                name="password"
                placeholder="Tạo mật khẩu"
                value={lenderForm.password}
                onChange={handleLenderChange}
                required
              />
            </div>

            <div className="input-group econtract-box" style={{ background: 'var(--surface-soft)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Hợp đồng Đối tác</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>Cần ký điện tử trước khi mở gian hàng</p>
                </div>
                {!isContractSigned ? (
                  <button 
                    type="button" 
                    className="primary-button" 
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => setShowContractModal(true)}
                  >
                    Xem & Ký Hợp Đồng
                  </button>
                ) : (
                  <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>✅ Đã ký hợp đồng</span>
                    <button type="button" onClick={() => setShowContractModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>(Xem lại)</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Hồ sơ xác minh</div>
            <div className="input-group">
              <label>Ảnh Giấy Phép Kinh Doanh / CCCD</label>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'var(--surface-soft)', position: 'relative' }}>
                {licenseUrl ? (
                  <div>
                    <img src={licenseUrl} alt="License" style={{ maxHeight: '150px', borderRadius: '8px', marginBottom: '10px' }} />
                    <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>✅ Đã tải ảnh thành công</div>
                    <button type="button" onClick={() => { setLicenseUrl(''); setLicenseFile(null); }} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textDecoration: 'underline' }}>
                      Tải ảnh khác
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLicenseUpload}
                      disabled={isUploadingLicense}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {isUploadingLicense ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <span className="pd-loading-spinner" style={{ width: 24, height: 24 }}></span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Đang tải ảnh lên...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
                        <span style={{ fontSize: '2rem' }}>📄</span>
                        <span>Nhấn hoặc Kéo thả ảnh vào đây</span>
                        <small>Hỗ trợ JPG, PNG (Tối đa 5MB)</small>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Thông tin cửa hàng</div>
            <div className="input-group">
              <label>Tên cửa hàng (Shop Name)</label>
              <input
                type="text"
                name="shopName"
                placeholder="Ví dụ: BuildLab Wedding"
                value={shopInfo.shopName}
                onChange={handleShopChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="090..."
                  value={shopInfo.phone}
                  onChange={handleShopChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Tỉnh/Thành phố</label>
                <select name="city" value={shopInfo.city} onChange={handleShopChange} required>
                  <option value="">Chọn Tỉnh/TP</option>
                  {vnUnits.map((p) => (
                    <option key={p.Code} value={p.FullName}>
                      {p.FullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Quận/Huyện/Khu vực</label>
                <input
                  type="text"
                  name="district"
                  placeholder="Ví dụ: Hải Châu, Sơn Trà..."
                  value={shopInfo.district}
                  onChange={handleShopChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Phường/Xã</label>
                <select
                  name="ward"
                  value={shopInfo.ward}
                  onChange={handleShopChange}
                  required
                  disabled={!shopInfo.city}
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wardsList.map((w) => (
                    <option key={w.Code} value={w.FullName}>
                      {w.FullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Địa chỉ cụ thể</label>
              <input
                type="text"
                name="addressLine1"
                placeholder="Số nhà, tên đường..."
                value={shopInfo.addressLine1}
                onChange={handleShopChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Địa chỉ bổ sung</label>
              <input
                type="text"
                name="addressLine2"
                placeholder="(Không bắt buộc) Tòa nhà, khu vực..."
                value={shopInfo.addressLine2}
                onChange={handleShopChange}
              />
            </div>
          </div>

          <button type="submit" className="primary-button partner-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : 'Đăng ký đối tác ngay'}
          </button>
        </form>
        <p className="auth-switch">Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>

      {/* Contract Modal */}
      {showContractModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', width: '100%', maxWidth: '600px', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Hợp Đồng Điện Tử Dành Cho Chủ Gian Hàng</h2>
              <button type="button" onClick={() => setShowContractModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>&times;</button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/><small>Độc lập - Tự do - Hạnh phúc</small></h3>
              <h4 style={{ textAlign: 'center' }}>HỢP ĐỒNG CUNG CẤP DỊCH VỤ SÀN GIAO DỊCH ĐIỆN TỬ</h4>
              
              <p>Hợp đồng này ("Hợp đồng") được thiết lập bởi và giữa Nền tảng BuildLab Costume Rental ("Nền tảng") và Chủ Gian Hàng (Lender).</p>
              
              <strong>Điều 1: Mục đích</strong>
              <p>Nền tảng cung cấp không gian trực tuyến để Chủ Gian Hàng đăng tải, cho thuê trang phục của mình. Nền tảng thu phí dịch vụ 15% trên mỗi giao dịch thuê đồ thành công.</p>
              
              <strong>Điều 2: Nghĩa vụ của Chủ Gian Hàng</strong>
              <ul>
                <li>Đảm bảo trang phục cho thuê đúng mô tả, sạch sẽ và an toàn.</li>
                <li>Không hủy đơn hàng đột ngột khi không có lý do chính đáng.</li>
                <li>Tuân thủ các quy định về giải quyết khiếu nại (Dispute) của nền tảng.</li>
              </ul>

              <strong>Điều 3: Quản lý rủi ro và Đặt cọc</strong>
              <p>Nền tảng sẽ giữ hộ tiền cọc của Khách thuê (Renter). Tiền cọc này sẽ được hoàn trả cho Khách thuê hoặc đền bù cho Chủ Gian Hàng tùy thuộc vào tình trạng trang phục khi hoàn trả.</p>

              <strong>Điều 4: Ký kết điện tử</strong>
              <p>Bằng việc nhập chính xác Họ và Tên dưới đây, Chủ Gian Hàng xác nhận đã đọc, hiểu rõ và đồng ý chịu ràng buộc bởi tất cả các điều khoản trong Hợp đồng này. Chữ ký điện tử này có giá trị pháp lý tương đương với chữ ký tay theo quy định của Luật Giao dịch điện tử.</p>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface-soft)' }}>
              {!isContractSigned ? (
                <>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Ký tên điện tử (Nhập chính xác Họ và Tên của bạn):
                  </label>
                  <input 
                    type="text" 
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Nhập tên của bạn để ký..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '15px' }}
                  />
                  <button 
                    type="button"
                    className="primary-button"
                    style={{ width: '100%' }}
                    disabled={!signature || signature.trim() === '' || signature !== lenderForm.fullName}
                    onClick={() => {
                      setIsContractSigned(true);
                      setShowContractModal(false);
                    }}
                  >
                    Ký Hợp Đồng
                  </button>
                  {signature && signature !== lenderForm.fullName && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '8px', textAlign: 'center' }}>
                      Chữ ký phải khớp chính xác với "Họ tên chủ shop" ({lenderForm.fullName})
                    </p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--success)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Hợp đồng đã được ký!</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--muted)', marginBottom: '15px' }}>Chữ ký số: <strong>{signature}</strong></div>
                  <button type="button" className="button" onClick={() => setShowContractModal(false)}>Đóng</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PartnerRegister;