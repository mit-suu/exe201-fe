const labels = {
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  renting: 'Đang thuê',
  returned: 'Đã trả',
  cancelled: 'Đã hủy',
  payment_failed: 'Thanh toán lỗi'
};

const StatusBadge = ({ status }) => <span className={`status-chip ${status}`}>{labels[status] || status}</span>;

export default StatusBadge;
