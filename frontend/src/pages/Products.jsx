import React, { useState, useEffect } from 'react';

export default function Products({
  productCategoriesData,
  productCategory,
  setProductCategory,
  currentProducts
}) {
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [productCategory]);

  const handleLinkClick = (e, link) => {
    const isLinkEmpty = !link || link === '#' || link.trim() === '';
    if (isLinkEmpty) {
      e.preventDefault();
      setToast('⚠️ Link sản phẩm đang được cập nhật...');
    }
  };

  const ITEMS_PER_PAGE = 12;
  const totalItems = currentProducts?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const displayedProducts = (currentProducts || []).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const standardOrder = ['Sản phẩm giáo dục', 'Sản phẩm vệ sinh', 'Sản phẩm tránh thai', 'Sản phẩm chăm sóc cơ thể'];
  const categoriesList = Object.keys(productCategoriesData || {}).sort((a, b) => {
    const idxA = standardOrder.indexOf(a);
    const idxB = standardOrder.indexOf(b);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  return (
    <div className="page active">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Trang sản phẩm theo phân loại</h2>
            <p>Có thể đi vào từng nhóm từ menu Sản phẩm hoặc qua gợi ý của chat AI.</p>
          </div>
        </div>
        <div className="chips">
          {categoriesList.map(name => (
            <button
              key={name}
              className={`chip ${name === productCategory ? 'active' : ''}`}
              onClick={() => setProductCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {displayedProducts.map((product, idx) => {
            const isLinkEmpty = !product.link || product.link === '#' || product.link.trim() === '';
            return (
              <div key={idx} className="product-item">
                <strong>{product.name}</strong>
                <span>{product.desc}</span>
                <div className="product-item-footer">
                  <span className="product-price">Giá: {product.price}</span>
                  <a
                    href={product.link || '#'}
                    target={isLinkEmpty ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="product-link-btn"
                    onClick={(e) => handleLinkClick(e, product.link)}
                  >
                    Xem chi tiết ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="filter-chips" style={{ justifyContent: 'center', marginTop: '32px' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`filter-chip ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                type="button"
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>

      {toast && (
        <div className="client-toast" role="status">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
