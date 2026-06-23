
import React from 'react';
import { Download, Edit, Trash2, CalendarX, Plus, Shirt, CheckCircle, Clock, Search, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import GoogleMapsPicker from '../../components/GoogleMapsPicker.jsx';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có';

const DashboardTab = (props) => {
  const {
    products, orders, reviews, lowInventoryProducts, allBusyDates, notifications, revenueStats, transactions, wallet,
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

  const pendingOrdersCount = orders?.filter(o => o.status === 'Pending')?.length || 0;
  const rentedOrdersCount = orders?.filter(o => o.status === 'Rented' || o.status === 'Checked_Out')?.length || 0;
  
  const returningSoonCount = orders?.filter(o => {
    if (o.status !== 'Rented' && o.status !== 'Checked_Out') return false;
    const endDate = new Date(o.rentalDates?.end || o.endDate);
    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    return endDate <= inTwoDays;
  })?.length || 0;

  const lockedDatesCount = allBusyDates?.length || 0;
  
  // Big-size check (XL, XXL, XXXL, v.v)
  const bigSizeCount = products?.filter(p => p.customSize || (p.sizes && (p.sizes.includes('XL') || p.sizes.includes('XXL') || p.sizes.includes('XXXL'))))?.length || 0;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
            <section className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <article className="order-summary-card">
                <strong>{money(revenueStats.totalRevenue)} đ</strong>
                <span>Tổng doanh thu</span>
              </article>
              <article className="order-summary-card">
                <strong>{pendingOrdersCount}</strong>
                <span style={{ color: pendingOrdersCount > 0 ? 'var(--warning)' : 'inherit' }}>Đơn chờ xác nhận</span>
              </article>
              <article className="order-summary-card">
                <strong>{rentedOrdersCount}</strong>
                <span style={{ color: rentedOrdersCount > 0 ? 'var(--success)' : 'inherit' }}>Đơn đang cho thuê</span>
              </article>
              <article className="order-summary-card">
                <strong>{returningSoonCount}</strong>
                <span style={{ color: returningSoonCount > 0 ? 'var(--danger)' : 'inherit' }}>Đơn sắp đến ngày trả</span>
              </article>
              <article className="order-summary-card">
                <strong>{products.length}</strong>
                <span>Tổng SP niêm yết</span>
              </article>
              <article className="order-summary-card">
                <strong>{Math.max(0, products.length - rentedOrdersCount)}</strong>
                <span>Sản phẩm trống</span>
              </article>
              <article className="order-summary-card">
                <strong>{lockedDatesCount}</strong>
                <span>Ngày đang khóa lịch</span>
              </article>
              <article className="order-summary-card" style={{ background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)' }}>
                <strong>{bigSizeCount}</strong>
                <span style={{ color: 'var(--success)' }}>Trang phục Big-Size</span>
              </article>
            </section>

            <div className="admin-section-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
              {/* Left Column: Recent Orders */}
              <article className="card admin-table-card">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Đơn đặt</p>
                  <h2>Đơn đặt mới nhận</h2>
                </div>
                <div className="table-list">
                  {orders.slice(0, 5).map(o => (
                    <div className="table-row admin-order-row" style={{ padding: '14px' }} key={o._id}>
                      <div>
                        <strong>{o.items?.[0]?.name || o.product?.name || 'Trang phục'}</strong>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '3px' }}>
                          Khách hàng: {o.renter?.fullName || o.user?.fullName}
                        </p>
                        <p style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                          Trả: {money(o.pricing?.totalAmount || o.totalAmount)} đ • Thực nhận: <strong style={{ color: 'var(--accent)' }}>{money(o.pricing?.lenderRevenue)} đ</strong>
                        </p>
                      </div>
                      <StatusBadge status={o.status} />
                      <button onClick={() => setSelectedOrder(o)} className="button" style={{ minHeight: '36px', padding: '0 12px', fontSize: '0.8rem' }}>Chi tiết</button>
                    </div>
                  ))}
                  {orders.length === 0 && <div className="empty-state">Cửa hàng chưa có đơn thuê nào.</div>}
                </div>
              </article>

              {/* Right Column: Inventory Stock Warnings & Calendar Widget */}
              <div style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
                {lowInventoryProducts.length > 0 && (
                  <article className="card" style={{ borderColor: 'var(--danger)', background: '#fef2f2' }}>
                    <div className="section-heading compact-heading" style={{ marginBottom: '10px' }}>
                      <p className="eyebrow" style={{ color: 'var(--danger)' }}>Cảnh báo tồn kho</p>
                      <h2 style={{ fontSize: '1.2rem' }}>Sản phẩm sắp hết hàng</h2>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {lowInventoryProducts.map(p => (
                        <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingBottom: '6px', borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
                          <strong>{p.name}</strong>
                          <span style={{ color: 'var(--danger)', fontWeight: '900' }}>Tồn kho: {p.stockQuantity}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                <article className="card">
                  <div className="section-heading compact-heading" style={{ marginBottom: '10px' }}>
                    <p className="eyebrow">Lịch bận trang phục</p>
                    <h2 style={{ fontSize: '1.2rem' }}>Lịch giữ đồ sắp tới</h2>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {allBusyDates.map((bd, idx) => (
                      <div key={idx} style={{ background: 'var(--surface-soft)', padding: '10px', borderRadius: '10px', fontSize: '0.82rem' }}>
                        <strong>{bd.productName}</strong>
                        <div style={{ color: 'var(--muted)', marginTop: '2px' }}>
                          {new Date(bd.startDate).toLocaleDateString('vi-VN')} → {new Date(bd.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--primary)' }}>Lý do: {bd.note || 'Khách đặt'}</div>
                      </div>
                    ))}
                    {allBusyDates.length === 0 && <div className="empty-state" style={{ padding: '20px' }}>Chưa có lịch bận nào được thiết lập.</div>}
                  </div>
                </article>
              </div>
            </div>
          </div>
  );
};

export default DashboardTab;



