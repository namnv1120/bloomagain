import React, { useState, useEffect } from 'react';

export default function Knowledge({
  knowledge,
  knowledgeCategory,
  setKnowledgeCategory,
  currentKnowledge
}) {
  const [toast, setToast] = useState(null);
  const [productPage, setProductPage] = useState(1);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setProductPage(1);
  }, [knowledgeCategory]);

  const handleLinkClick = (e, link) => {
    const isLinkEmpty = !link || link === '#' || link.trim() === '';
    if (isLinkEmpty) {
      e.preventDefault();
      setToast('⚠️ Link sản phẩm đang được cập nhật...');
    }
  };

  const PRODUCTS_PER_PAGE = 5;
  const totalProducts = currentKnowledge?.products?.length || 0;
  const totalProductPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const displayedProducts = (currentKnowledge?.products || []).slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="page active">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Kho kiến thức</h2>
            <p>Chọn danh mục để xem bài viết mẫu và gợi ý sản phẩm liên quan.</p>
          </div>
        </div>
        <div className="chips">
          {Object.keys(knowledge || {}).map(name => (
            <button
              key={name}
              className={`chip ${name === knowledgeCategory ? 'active' : ''}`}
              onClick={() => setKnowledgeCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        {!knowledgeCategory ? (
          <div className="select-prompt-card" style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#fff',
            borderRadius: 16,
            border: '1px dashed rgba(93, 110, 126, 0.15)',
            marginTop: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
            <h3 style={{ fontSize: '1.25rem', color: '#1e2035', marginBottom: 8, fontWeight: 700 }}>Khám phá kho kiến thức</h3>
            <p style={{ color: '#566474', maxWidth: 460, margin: '0 auto', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Vui lòng chọn một danh mục chủ đề ở trên để bắt đầu tìm hiểu thông tin hữu ích và sản phẩm hỗ trợ phù hợp.
            </p>
          </div>
        ) : (
          <div className="grid-2 mtop" style={{ alignItems: 'start' }}>
            <div className="articles-grid">
              {(currentKnowledge?.articles || []).map((article, idx) => (
                <article key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    {article.imageUrl ? (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '22px 22px 0 0', display: 'block' }} 
                      />
                    ) : (
                      <div className="img-placeholder" style={{ height: '140px', background: '#f8ece6', display: 'grid', placeItems: 'center', color: '#b55139', fontWeight: 600 }}>Ảnh bài viết</div>
                    )}
                    <div className="card-body">
                      <h3>{article.title}</h3>
                      <p>{article.desc}</p>
                    </div>
                  </div>
                  {article.link && (
                    <div style={{ padding: '0 18px 18px 18px', marginTop: 'auto' }}>
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#b55139',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = '0.75'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        Đọc bài viết chi tiết ↗
                      </a>
                    </div>
                  )}
                </article>
              ))}
              {(!currentKnowledge?.articles || currentKnowledge.articles.length === 0) && (
                <div style={{ textAlign: 'center', color: '#566474', padding: 32, gridColumn: 'span 2' }}>Chưa có bài viết nào trong danh mục này.</div>
              )}
            </div>
            <aside className="section-soft">
              <h3>Gợi ý sản phẩm</h3>
              <div className="product-list">
                {displayedProducts.map((product, idx) => {
                  const isLinkEmpty = !product.link || product.link === '#' || product.link.trim() === '';
                  return (
                    <div key={idx} className="product-item">
                      <strong>{product.name}</strong>
                      {product.desc && (
                        <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', margin: '4px 0 10px 0', lineHeight: 1.4 }}>
                          {product.desc}
                        </span>
                      )}
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
                {(!currentKnowledge?.products || currentKnowledge.products.length === 0) && (
                  <div style={{ color: '#566474', fontSize: '0.85rem' }}>Không có gợi ý sản phẩm cho danh mục này.</div>
                )}
              </div>

              {totalProductPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px', marginBottom: '16px' }}>
                  {Array.from({ length: totalProductPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setProductPage(i + 1)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: '1px solid rgba(93, 110, 126, 0.15)',
                        background: productPage === i + 1 ? '#b55139' : '#fff',
                        color: productPage === i + 1 ? '#fff' : '#566474',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {currentKnowledge?.note && <p className="notice" style={{ marginTop: '16px' }}>{currentKnowledge.note}</p>}
            </aside>
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
