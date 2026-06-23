
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const ProfileTab = (props) => {
  const {
    products, orders, reviews, notifications, revenueStats, transactions, wallet,
    profileForm, setProfileForm, handleProfileSubmit,
    bankForm, setBankForm, handleUpdateBank,
    withdrawalAmount, setWithdrawalAmount, handleWithdraw,
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
    setShowProductForm
  } = props;

  return (
    <section className="card">
            <div className="section-heading compact-heading">
              <p className="eyebrow">Cấu hình Shop</p>
              <h2>Thiết lập thông tin cửa hàng & Chính sách</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="input-group" style={{ maxWidth: '780px', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Tên cửa hàng *</label>
                  <input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Email (Đăng nhập - Không thể sửa)</label>
                  <input value={profileForm.email} disabled style={{ background: 'var(--surface-soft)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Số điện thoại liên lạc *</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Địa chỉ cửa hàng *</label>
                  <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Định vị địa chỉ trên bản đồ *</label>
                <GoogleMapsPicker 
                  initialLat={profileForm.latitude} 
                  initialLng={profileForm.longitude} 
                  initialAddress={profileForm.formattedAddress}
                  onLocationSelect={(loc) => setProfileForm(prev => ({
                    ...prev,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    formattedAddress: loc.formattedAddress,
                    googlePlaceId: loc.googlePlaceId,
                    address: loc.formattedAddress || prev.address,
                    city: loc.city || prev.city || '',
                    district: loc.district || prev.district || '',
                    ward: loc.ward || prev.ward || ''
                  }))} 
                />
              </div>

              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>URL Logo cửa hàng</label>
                <input placeholder="https://picsum.photos/200" value={profileForm.logoUrl} onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })} />
              </div>

              <div>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Mô tả/Giới thiệu cửa hàng</label>
                <textarea placeholder="Lotus chuyên cung cấp váy dạ hội, trang phục lễ hội cao cấp..." value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <h3 style={{ margin: '0 0 15px' }}>Quản lý chính sách cho thuê & Đền bù</h3>

                <div style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Chính sách Thuê & Đặt cọc</label>
                    <textarea
                      placeholder="Thuê tối thiểu 1 ngày, đặt cọc 100% giá trị sản phẩm khi nhận đồ."
                      value={profileForm.rentalPolicy}
                      onChange={(e) => setProfileForm({ ...profileForm, rentalPolicy: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: '800', display: 'block', marginBottom: '5px' }}>Quy định Xử phạt khi Trễ Hạn đồ</label>
                    <textarea
                      placeholder="Trễ hạn đền bù phạt 50.000 đ/ngày trễ."
                      value={profileForm.latePenaltyPolicy}
                      onChange={(e) => setProfileForm({ ...profileForm, latePenaltyPolicy: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button className="primary-button" type="submit" style={{ marginTop: '10px' }}>
                Lưu cấu hình & Chính sách
              </button>
            </form>
          </section>
  );
};

export default ProfileTab;


