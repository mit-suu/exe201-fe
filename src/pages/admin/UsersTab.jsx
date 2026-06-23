const UsersTab = ({ customers, handleToggleUserStatus }) => {
  return (
    <section className="card admin-table-card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Thành viên</p>
        <h2>Quản lý tài khoản khách hàng ({customers.length})</h2>
      </div>
      <div className="user-list full-user-list">
        {customers.map((c) => (
          <div className="user-list-item" style={{ padding: '16px' }} key={c._id}>
            <div className="user-avatar" style={{ background: 'var(--primary-strong)' }}>
              {c.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>{c.fullName}</strong>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.email} • ĐT: {c.phone || 'Chưa cập nhật'}</p>
            </div>
            <span className={`status-pill ${c.isActive !== false ? 'active' : 'inactive'}`}>
              {c.isActive !== false ? 'Active' : 'Blocked'}
            </span>
            <button onClick={() => handleToggleUserStatus(c._id, c.isActive !== false)} className={`button ${c.isActive !== false ? 'danger' : ''}`} style={{ minHeight: '36px', fontSize: '0.82rem' }}>
              {c.isActive !== false ? 'Block tài khoản' : 'Mở khóa tài khoản'}
            </button>
          </div>
        ))}
        {customers.length === 0 && <div className="empty-state">Không tìm thấy khách hàng nào.</div>}
      </div>
    </section>
  );
};
export default UsersTab;