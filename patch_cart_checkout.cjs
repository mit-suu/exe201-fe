const fs = require('fs');
const path = 'src/pages/customer/Cart.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports if missing
if (!content.includes('import { createOrder }')) {
  content = content.replace(
    "import { getCurrentUser } from '../../services/auth.js';",
    "import { getCurrentUser } from '../../services/auth.js';\nimport { createOrder } from '../../services/orders.js';\nimport toast from 'react-hot-toast';"
  );
}

// 2. Add state to Cart component
const stateVars = `  const [submitting, setSubmitting] = useState(false);
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
      toast.success('Đặt hàng thành công!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };
`;

if (!content.includes('const [submitting, setSubmitting]')) {
  content = content.replace(
    "  const user = getCurrentUser();\n",
    "  const user = getCurrentUser();\n\n" + stateVars
  );
}

// 3. Add checkout form UI above total
const formHtml = `
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
`;

content = content.replace(
  "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>\n            <span style={{ fontWeight: '800' }}>TỔNG CỘNG</span>\n            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent)' }}>{money(totalCartValue)}đ</span>\n          </div>",
  formHtml + "          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>\n            <span style={{ fontWeight: '800' }}>TỔNG CỘNG</span>\n            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent)' }}>{money(totalCartValue)}đ</span>\n          </div>"
);

// 4. Update the button
const targetButton = `<button 
            className="primary-button" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={() => {
              if (!user) {
                navigate('/login');
              } else {
                // To support multi-checkout in future. For now direct user to checkout the first item or let them know.
                // It's a rental platform, multiple different lenders in one checkout is complex.
                // As an MVP, we'll let them click individual products or implement a simple loop.
                alert('Tính năng thanh toán hàng loạt đang phát triển. Vui lòng bấm vào từng sản phẩm để hoàn tất đặt đơn!');
              }
            }}
          >
            Thanh toán ({cart.length}) <ArrowRight size={18} />
          </button>`;

const newButton = `<button 
            className="primary-button" 
            disabled={submitting}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}
            onClick={handleCheckout}
          >
            {submitting ? 'Đang xử lý...' : \`Thanh toán (\${cart.length})\`} {!submitting && <ArrowRight size={18} />}
          </button>`;

content = content.replace(targetButton, newButton);

fs.writeFileSync(path, content, 'utf8');
console.log('Added checkout functionality to Cart.jsx');
