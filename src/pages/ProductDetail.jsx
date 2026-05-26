import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.js';
import { createOrder } from '../services/orders.js';
import { getProduct } from '../services/products.js';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const ProductDetail = () => {
  const { id } = useParams();
  const user = getCurrentUser();
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({ size: '', rentalStartDate: '', rentalEndDate: '', note: '', paymentMethod: 'cash' });
  const [message, setMessage] = useState('');

  useEffect(() => { getProduct(id).then((item) => { setProduct(item); setForm((old) => ({ ...old, size: item.sizes?.[0] || '' })); }); }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await createOrder({ productId: id, ...form });
      if (result.order?.payment?.checkoutUrl) window.location.href = result.order.payment.checkoutUrl;
      else setMessage(result.paymentMessage || 'Đã tạo đơn thuê. Bạn thanh toán trực tiếp khi nhận trang phục.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Không tạo được đơn thuê');
    }
  };

  if (!product) return <p>Đang tải...</p>;

  return (
    <div className="detail-layout">
      <section className="card">
        <img className="detail-image" src={product.images?.[0] || 'https://placehold.co/900x620?text=BuildLab'} alt={product.name} />
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="meta-row"><span>{product.category}</span><span>{product.condition}</span><span>Còn {product.stockQuantity}</span></div>
      </section>
      <section className="form-card">
        <h2>Đặt thuê</h2>
        <p className="price">{money(product.rentalPricePerDay)} đ/ngày • Cọc {money(product.depositAmount)} đ</p>
        {!user ? <div className="alert">Bạn cần <Link to="/login">đăng nhập</Link> để thuê.</div> : (
          <form onSubmit={submit} className="input-group">
            <label>Size</label><select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>{product.sizes.map((size) => <option key={size}>{size}</option>)}</select>
            <label>Ngày nhận</label><input type="date" required value={form.rentalStartDate} onChange={(e) => setForm({ ...form, rentalStartDate: e.target.value })} />
            <label>Ngày trả</label><input type="date" required value={form.rentalEndDate} onChange={(e) => setForm({ ...form, rentalEndDate: e.target.value })} />
            <label>Ghi chú</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <label>Phương thức thanh toán</label>
            <div className="payment-methods">
              <label className={`payment-method ${form.paymentMethod === 'cash' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="cash" checked={form.paymentMethod === 'cash'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                <span>Thanh toán tiền mặt</span>
                <small>Trả tiền trực tiếp khi nhận trang phục.</small>
              </label>
              <label className={`payment-method ${form.paymentMethod === 'stripe' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="stripe" checked={form.paymentMethod === 'stripe'} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                <span>Thanh toán Stripe</span>
                <small>Thanh toán online bằng thẻ qua Stripe Checkout.</small>
              </label>
            </div>
            <button className="primary-button">{form.paymentMethod === 'stripe' ? 'Thanh toán với Stripe' : 'Tạo đơn thuê'}</button>
          </form>
        )}
        {message && <div className="alert">{message}</div>}
      </section>
    </div>
  );
};

export default ProductDetail;
