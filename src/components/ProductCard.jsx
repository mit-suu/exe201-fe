import { useState } from 'react';
import { Link } from 'react-router-dom';

const money = (value) => Number(value || 0).toLocaleString('vi-VN');

const categoryLabels = {
  traditional: 'Truyền thống',
  wedding: 'Váy cưới',
  party: 'Dạ hội',
  cosplay: 'Cosplay',
};

const conditionLabels = {
  new: 'Mới',
  excellent: 'Rất tốt',
  good: 'Tốt',
  maintenance: 'Bảo trì',
};

const ProductCard = ({ product }) => {
  const [imageSrc, setImageSrc] = useState(product.images?.[0] || 'https://placehold.co/800x620/f1f5f9/111827?text=BuildLab');

  return (
    <article className="product-card">
      <Link className="product-image-link" to={`/products/${product._id}`}>
        <img src={imageSrc} alt={product.name} onError={() => setImageSrc('https://placehold.co/800x620/f1f5f9/111827?text=BuildLab')} />
        <span className="product-badge">{product.category?.name || categoryLabels[product.category?.slug || product.category] || product.category?.slug || product.category}</span>
      </Link>
      <div className="product-body">
        <div className="product-title-row">
          <div>
            <h3>{product.name}</h3>
            <p>{conditionLabels[product.condition] || product.condition} • Còn {product.stockQuantity || 0} bộ</p>
          </div>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="size-row">
          {(product.sizes || []).slice(0, 4).map((size) => <span key={size}>{size}</span>)}
        </div>
        <div className="price-row">
          <div>
            <span>Giá thuê</span>
            <strong>{money(product.rentalPrice)} đ/ngày</strong>
          </div>
          <div>
            <span>Tiền cọc</span>
            <strong>{money(product.depositPrice)} đ</strong>
          </div>
        </div>
        <Link className="primary-button product-button" to={`/products/${product._id}`}>Xem chi tiết và thuê</Link>
      </div>
    </article>
  );
};

export default ProductCard;
