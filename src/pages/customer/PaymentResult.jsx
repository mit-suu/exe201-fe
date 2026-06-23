import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';

const statusText = {
  success: 'Thanh toán Stripe thành công. Đơn của bạn sẽ được cập nhật sau khi Stripe xác nhận.',
  cancelled: 'Bạn đã hủy thanh toán Stripe. Đơn vẫn ở trạng thái chờ thanh toán nếu đã được tạo.',
  unknown: 'Chưa xác định được trạng thái thanh toán.',
};

const PaymentResult = () => {
  const [params] = useSearchParams();
  const provider = params.get('provider') || 'stripe';
  const status = params.get('status') || params.get('code') || 'unknown';
  const orderId = params.get('orderId');
  const [confirmMessage, setConfirmMessage] = useState('');

  useEffect(() => {
    if (provider !== 'stripe' || status !== 'success' || !orderId) return;
    api.post(`/payments/stripe/orders/${orderId}/confirm`)
      .then(() => setConfirmMessage('Đã xác nhận thanh toán Stripe và cập nhật đơn thành đã thanh toán.'))
      .catch((error) => setConfirmMessage(error?.response?.data?.message || 'Chưa xác nhận được Stripe. Hãy thử refresh hoặc kiểm tra webhook.'));
  }, [provider, status, orderId]);

  return (
    <section className="card centered-card payment-result-card">
      <p className="eyebrow">{provider === 'stripe' ? 'Stripe Checkout' : 'Thanh toán'}</p>
      <h1>Kết quả thanh toán</h1>
      <p>Trạng thái: <strong>{status}</strong></p>
      <p>{statusText[status] || statusText.unknown}</p>
      {confirmMessage && <div className="alert">{confirmMessage}</div>}
      <div className="hero-actions centered-actions">
        <Link className="primary-button" to="/dashboard">Về dashboard</Link>
        <Link className="secondary-button" to="/">Tiếp tục thuê đồ</Link>
      </div>
    </section>
  );
};

export default PaymentResult;

