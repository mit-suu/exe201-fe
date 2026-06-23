import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.js';
import { Trash2, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import { getCurrentUser } from '../../services/auth.js';
import { createOrder } from '../../services/orders.js';
import toast from 'react-hot-toast';
import { ANALYTICS_EVENTS, trackEvent as trackGAEvent } from '../../utils/analytics.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const Cart = () => {
  const { cart, removeFromCart, clearCart, updateCartItem } = useCart();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const handleCheckout = async () => {
    if (!user) return navigate('/login');
    
    const hasInvalidDates = cart.some(i => !i.startDate || !i.endDate || i.rentalDays < 1);
    if (hasInvalidDates) {
      return toast.error('Vui lòng chọn thời gian thuê hợp lệ cho tất cả sản phẩm!');
    }

    try {
      setSubmitting(true);
      for (const item of cart) {
        await createOrder({
          productId: item.product._id,
          startDate: item.startDate,
          endDate: item.endDate,
          size: item.size,
          paymentMethod: paymentMethod,
          shippingAddress: shippingAddress || user?.address || 'Tại cửa hàng',
          phone: phone || user?.phone,
          note: note
        });
      }
      trackGAEvent(ANALYTICS_EVENTS.SUBMIT_BOOKING, {
        items_count: cart.length,
        value: totalCartValue,
        currency: 'VND',
        payment_method: paymentMethod,
      });
      toast.success('Đặt hàng thành công!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <ShoppingBag size={64} style={{ color: 'var(--border)', margin: '0 auto 20px' }} />
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>Hãy chọn cho mình những trang phục tuyệt vời nhé!</p>
        <Link to="/products" className="primary-button" style={{ display: 'inline-flex' }}>Khám phá trang phục</Link>
      </div>
    );
  }

  const totalCartValue = cart.reduce((sum, item) => sum + item.totalAmount + item.depositFee, 0);

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '60vh' }}>
      <h1 style={{ margin: '0 0 30px' }}>Giỏ hàng ({cart.length} sản phẩm)</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: '20px' }}>
          {cart.map((item, index) => {
            const product = item.product;
            const shopName = product.lender?.lenderName || product.lender?.fullName || 'Shop';
            const imgUrl = (product.images?.[0]?.url || product.images?.[0]) || 'https://placehold.co/100x100?text=Image';

            return (
              <div key={index} className="card" style={{ display: 'flex', gap: '20px', padding: '20px', position: 'relative' }}>
                <img src={imgUrl} alt={product.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '700', marginBottom: '4px' }}><Store size={14} style={{ verticalAlign: 'text-bottom' }} /> {shopName}</div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>
                    <Link to={`/products/${product._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.name}</Link>
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text)', marginTop: '8px' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)' }}>Size:</strong> 
                      <span style={{ padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)', display: 'inline-block' }}>{item.size || 'Freesize'}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)' }}>Thời gian thuê ({item.rentalDays || 0} ngày):</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          value={item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { startDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />
                        <span style={{ color: 'var(--muted)' }}>đến</span>
                        <input 
                          type="date" 
                          min={item.startDate || new Date().toISOString().split('T')[0]}
                          value={item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => updateCartItem(index, { endDate: e.target.value })} 
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'inherit', fontFamily: 'inherit' }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--primary)' }}>Phí thuê: {money(item.totalAmount)}đ</div>
                      <div style={{ color: 'var(--muted)' }}>Cọc: {money(item.depositFee)}đ</div>
                    </div>
                    <button onClick={() => removeFromCart(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: '25px', position: 'sticky', top: '100px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Tóm tắt giỏ hàng</h3>
          
          <div style={{ display: 'grid', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Tổng phí thuê</span>
              <span>{money(cart.reduce((s, i) => s + i.totalAmount, 0))}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Tổng tiền cọc</span>
              <span>{money(cart.reduce((s, i) => s + i.depositFee, 0))}đ</span>
            </div>
          </div>
          

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Phương thức thanh toán</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', marginBottom: '12px', color: 'var(--text)' }}>
              <option value="cash">Tiền mặt khi nhận hàng</option>
              <option value="wallet">Ví nội bộ BuildLab</option>
            </select>
            
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Địa chỉ nhận hàng (tùy chọn)</label>
            <input type="text" placeholder={user?.address || 'Nhận tại cửa hàng'} value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', marginBottom: '12px', color: 'var(--text)' }} />
            
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>Ghi chú (tùy chọn)</label>
            <input type="text" placeholder="Yêu cầu đặc biệt..." value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontWeight: '800' }}>TỔNG CỘNG</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent)' }}>{money(totalCartValue)}đ</span>
          </div>

          <button 
            className="primary-button" 
            disabled={submitting}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}
            onClick={handleCheckout}
          >
            {submitting ? 'Đang xử lý...' : `Thanh toán (${cart.length})`} {!submitting && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
