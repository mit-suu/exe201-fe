import { Tags, X } from 'lucide-react';

const CategoriesTab = ({ categories, newCategory, setNewCategory, handleAddCategory, handleDeleteCategory }) => {
  return (
    <section className="card">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Cấu hình phân loại</p>
        <h2>Quản lý các danh mục trang phục</h2>
      </div>
      <form onSubmit={handleAddCategory} className="inline-form" style={{ maxWidth: '580px', marginBottom: '20px' }}>
        <input placeholder="Nhập danh mục mới (ví dụ: party, festival)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
        <button className="primary-button" type="submit" style={{ gridColumn: 'span 2' }}>+ Thêm danh mục</button>
      </form>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map((c, idx) => (
          <span key={idx} style={{ background: 'var(--surface-soft)', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', textTransform: 'capitalize', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Tags size={14} style={{ color: '#9ca3af' }} /> {c}
            {handleDeleteCategory && (
              <button 
                type="button" 
                onClick={() => handleDeleteCategory(c)} 
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: '6px', color: 'var(--danger)' }}
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
      </div>
    </section>
  );
};
export default CategoriesTab;