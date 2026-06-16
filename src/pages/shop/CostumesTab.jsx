
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const CostumesTab = (props) => {

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('name_asc');
  const [categoriesList, setCategoriesList] = React.useState([]);

  React.useEffect(() => {
    import('../../services/products.js').then(m => m.listCategories())
      .then(data => { if (Array.isArray(data)) setCategoriesList(data); })
      .catch(console.error);
  }, []);

  const {
    user, shopStatus, products, orders, reviews, notifications, revenueStats, transactions, wallet,
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
    productForm, setProductForm, emptyProduct,
    showProductForm, setShowProductForm,
    editingProductId, setEditingProductId,
    handleProductSubmit,
    STANDARD_SIZES, handleSizeToggle,
    customSize, setCustomSize, handleAddCustomSize,
    handleRemoveImage, handleImageUpload, isUploadingImages
  } = props;


  const filteredProducts = (products || []).filter(p => {
    if (filterCategory && filterCategory !== 'all' && p.category !== filterCategory && p.category?.name !== filterCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price_asc') return a.rentalPrice - b.rentalPrice;
    if (sortBy === 'price_desc') return b.rentalPrice - a.rentalPrice;
    return 0;
  });

  return (
    <section className="card admin-table-card">
            <div className="section-heading compact-heading admin-section-toolbar">
              <div>
                <p className="eyebrow">Danh mục trang phục</p>
                <h2>Kho sản phẩm cửa hàng ({products.length})</h2>
              </div>
              <button
                className="primary-button"
                onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); setShowProductForm(true); }}
                disabled={user?.lenderProfile?.status === 'Pending'}
                style={{ opacity: user?.lenderProfile?.status === 'Pending' ? 0.5 : 1, cursor: user?.lenderProfile?.status === 'Pending' ? 'not-allowed' : 'pointer' }}
              >
                + Đăng trang phục mới
              </button>
            </div>

            {showProductForm && (
              <form className="admin-product-form expanded" onSubmit={handleProductSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <div className="admin-form-title" style={{ gridColumn: '1 / -1', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>{editingProductId ? 'Chỉnh sửa thông tin trang phục' : 'Đăng ký trang phục cho thuê mới'}</h3>
                  <button type="button" className="text-button" onClick={() => setShowProductForm(false)}>Đóng form</button>
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Tên trang phục *</label>
                  <input placeholder="Ví dụ: Áo dài hoa cúc cách tân" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Danh mục *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ background: 'white', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}
                  >
                    <option value="" disabled>Chọn danh mục</option>
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Mô tả chi tiết *</label>
                  <textarea placeholder="Mô tả chất liệu vải, phụ kiện đi kèm, hướng dẫn giặt sấy..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Giá thuê theo ngày (đ) *</label>
                  <input type="number" placeholder="Ví dụ: 150000" value={productForm.rentalPrice} onChange={(e) => setProductForm({ ...productForm, rentalPrice: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Tiền cọc yêu cầu (đ)</label>
                  <input type="number" placeholder="Ví dụ: 300000" value={productForm.depositPrice} onChange={(e) => setProductForm({ ...productForm, depositPrice: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Các Size sẵn có *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    {STANDARD_SIZES.map(sz => {
                      const isChecked = Array.isArray(productForm.sizes) && productForm.sizes.includes(sz);
                      return (
                        <label key={sz} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isChecked ? 'var(--primary-light)' : 'var(--surface-soft)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)', fontSize: '0.85rem' }}>
                          <input type="checkbox" checked={isChecked} onChange={() => handleSizeToggle(sz)} style={{ margin: 0 }} />
                          {sz}
                        </label>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input placeholder="Nhập size khác (VD: 36, 37, XL+)" value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }} style={{ flex: 1 }} />
                    <button type="button" className="secondary-button" onClick={handleAddCustomSize} style={{ padding: '0 15px', minHeight: '44px' }}>Thêm</button>
                  </div>
                  {Array.isArray(productForm.sizes) && productForm.sizes.filter(s => !STANDARD_SIZES.includes(s)).length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>Size khác đã thêm:</span>
                      {productForm.sizes.filter(s => !STANDARD_SIZES.includes(s)).map(sz => (
                        <span key={sz} style={{ background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid var(--primary)' }}>
                          {sz} <button type="button" onClick={() => handleSizeToggle(sz)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: 0, lineHeight: 1 }}>&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Màu sắc</label>
                  <input placeholder="Ví dụ: Đỏ cam, Đen huyền bí" value={productForm.color} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Số lượng tồn kho sẵn có *</label>
                  <input type="number" placeholder="1" value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Trạng thái phục vụ</label>
                  <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}>
                    <option value="available">Sẵn sàng cho thuê (Available)</option>
                    <option value="rented">Đang được thuê (Rented)</option>
                    <option value="maintenance">Đang bảo trì/Giặt ủi (Maintenance)</option>
                    <option value="hidden">Ẩn tạm thời (Hidden)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '800', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>Ảnh trang phục *</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', background: 'var(--surface-soft)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: Array.isArray(productForm.images) && productForm.images.length > 0 ? '20px' : '0' }}>
                      {Array.isArray(productForm.images) && productForm.images.map((imgUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={imgUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>&times;</button>
                          {idx === 0 && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '2px', textAlign: 'center' }}>Ảnh chính</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <button type="button" className="secondary-button" disabled={isUploadingImages}>
                        {isUploadingImages ? 'Đang tải ảnh lên...' : '+ Tải ảnh lên (Hỗ trợ nhiều ảnh)'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '10px', marginBottom: 0 }}>Hỗ trợ JPG, PNG. Ảnh đầu tiên sẽ làm ảnh đại diện.</p>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button className="primary-button" type="submit">{editingProductId ? 'Lưu cập nhật' : 'Đăng trang phục'}</button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', padding: '0 20px' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm tên sản phẩm..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </div>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="all">Tất cả danh mục</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}
              >
                <option value="name_asc">Sắp xếp: Tên A-Z</option>
                <option value="name_desc">Sắp xếp: Tên Z-A</option>
                <option value="price_asc">Sắp xếp: Giá thấp đến cao</option>
                <option value="price_desc">Sắp xếp: Giá cao đến thấp</option>
              </select>
            </div>
            <div className="table-list admin-product-list">
              {filteredProducts.map((p) => (
                <div className="table-row admin-product-row" style={{ padding: '16px', gridTemplateColumns: 'auto 1fr auto' }} key={p._id}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]?.url || p.images[0]} alt={p.name} style={{ width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '10px', background: 'var(--surface-soft)', display: 'grid', placeItems: 'center' }}><Shirt size={24} style={{ color: '#6b7280' }} /></div>
                  )}
                  <div style={{ marginLeft: '15px' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--primary-strong)' }}>{p.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Danh mục: <strong style={{ textTransform: 'capitalize' }}>{p.category?.name || p.category}</strong> • Giá: <strong>{money(p.rentalPrice)} đ/ngày</strong> • Cọc: <strong>{money(p.depositPrice)} đ</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '3px' }}>
                      Màu: {p.color || 'Không'} • Sizes: {p.sizes?.join(', ')} • Kho: <strong style={{ color: p.stockQuantity < 2 ? 'var(--danger)' : 'inherit' }}>{p.stockQuantity}</strong>
                    </p>

                    {/* Inline Calendar Busy Dates Manager */}
                    <div style={{ marginTop: '12px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary-strong)', display: 'block', marginBottom: '6px' }}>📅 Thiết lập Lịch bận cho trang phục này</span>

                      {p.unavailableDates && p.unavailableDates.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {p.unavailableDates.map((bd, bIdx) => (
                            <span key={bIdx} style={{ background: 'var(--surface-soft)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {date(bd.startDate)} - {date(bd.endDate)} ({bd.reason || bd.note})
                              <button type="button" onClick={() => handleRemoveBusyDate(p._id, bIdx)} style={{ border: '0', background: 'transparent', color: 'var(--danger)', padding: '0', fontWeight: '900' }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="date" value={newBusyDate.startDate} onChange={(e) => setNewBusyDate({ ...newBusyDate, startDate: e.target.value })} style={{ width: 'auto', padding: '6px', fontSize: '0.8rem' }} />
                        <span>→</span>
                        <input type="date" value={newBusyDate.endDate} onChange={(e) => setNewBusyDate({ ...newBusyDate, endDate: e.target.value })} style={{ width: 'auto', padding: '6px', fontSize: '0.8rem' }} />
                        <input placeholder="Lý do bận" value={newBusyDate.note} onChange={(e) => setNewBusyDate({ ...newBusyDate, note: e.target.value })} style={{ width: '150px', padding: '6px', fontSize: '0.8rem' }} />
                        <button type="button" onClick={() => handleAddBusyDate(p._id)} className="secondary-button" style={{ minHeight: '30px', padding: '0 12px', fontSize: '0.78rem' }}>+ Khóa lịch</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                    <span className={`status-pill ${p.status === 'available' ? 'active' : 'inactive'}`} style={{ alignSelf: 'flex-end', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {p.status}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="button" onClick={() => handleProductEdit(p)}>Sửa</button>
                      <button className="button danger" onClick={() => handleProductDelete(p._id)}>Ẩn</button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="empty-state">Chưa đăng trang phục nào. Hãy bấm nút Thêm trang phục mới để bắt đầu.</div>}
            </div>
          </section>
  );
};

export default CostumesTab;


