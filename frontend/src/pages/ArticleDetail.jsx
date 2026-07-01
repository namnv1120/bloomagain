import React, { useEffect } from 'react';
import { toSlug } from '../utils';

export default function ArticleDetail({ article, allKnowledge, navigate }) {
  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article]);

  if (!article) {
    return (
      <div className="page active" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ fontSize: '1.5rem', color: '#1e2035', marginBottom: '12px' }}>Không tìm thấy bài viết</h2>
        <p style={{ color: '#566474', marginBottom: '24px' }}>Bài viết có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <button 
          onClick={() => navigate('/knowledge')}
          style={{
            padding: '12px 24px',
            borderRadius: '24px',
            border: 'none',
            background: '#b55139',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(181, 81, 57, 0.25)'
          }}
        >
          Quay lại Kho kiến thức
        </button>
      </div>
    );
  }

  // Calculate estimated reading time
  const wordCount = article.content ? article.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Get other articles in same category
  const categoryData = allKnowledge?.[article.category] || {};
  const relatedArticles = (categoryData.articles || [])
    .filter(a => a.title !== article.title)
    .slice(0, 3);

  // Get related products
  const relatedProducts = (categoryData.products || []).slice(0, 3);

  return (
    <div className="page active" style={{ paddingBottom: '60px' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/knowledge')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#566474',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
            fontSize: '0.95rem',
            transition: 'color 0.2s'
          }}
          onMouseOver={e => e.target.style.color = '#b55139'}
          onMouseOut={e => e.target.style.color = '#566474'}
        >
          ← Quay lại Kho kiến thức
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2.5fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Main Content Area */}
        <article style={{
          background: '#fff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.03)'
        }}>
          <div style={{ padding: '40px' }}>
            {/* Meta Info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ 
                backgroundColor: '#f8ece6', 
                color: '#b55139', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 700
              }}>
                {article.category}
              </span>
              <span style={{ color: '#8a99a8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⏱️ {readingTime} phút đọc
              </span>
            </div>

            {/* Title & Desc */}
            <h1 style={{ 
              fontSize: '2.2rem', 
              color: '#1e2035', 
              margin: '0 0 16px 0', 
              fontWeight: 800, 
              lineHeight: 1.25,
              letterSpacing: '-0.02em'
            }}>
              {article.title}
            </h1>
            
            <p style={{ 
              color: '#566474', 
              fontStyle: 'italic', 
              margin: '0 0 32px 0', 
              fontSize: '1.1rem', 
              lineHeight: 1.5,
              borderLeft: '4px solid #b55139',
              paddingLeft: '16px'
            }}>
              {article.desc}
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(93, 110, 126, 0.1)', margin: '0 0 32px 0' }} />

            {/* Rich Content Body */}
            <div 
              className="article-rich-content"
              dangerouslySetInnerHTML={{ __html: article.content || `<p style="white-space: pre-wrap; line-height: 1.8;">${article.desc}</p>` }}
              style={{
                color: '#2d3748',
                fontSize: '1.05rem',
                lineHeight: '1.8'
              }}
            />
          </div>
        </article>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1e2035', margin: '0 0 16px 0', fontWeight: 700 }}>Sản phẩm hỗ trợ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {relatedProducts.map((product, idx) => (
                  <div key={idx} style={{
                    paddingBottom: idx !== relatedProducts.length - 1 ? '14px' : '0',
                    borderBottom: idx !== relatedProducts.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                  }}>
                    <strong style={{ display: 'block', fontSize: '0.92rem', color: '#1e2035', marginBottom: '4px' }}>{product.name}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#b55139', fontWeight: 700 }}>{product.price}</span>
                      <a 
                        href={product.link || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '0.8rem', color: '#566474', textDecoration: 'none', fontWeight: 600 }}
                        onMouseOver={e => e.target.style.color = '#b55139'}
                        onMouseOut={e => e.target.style.color = '#566474'}
                      >
                        Chi tiết →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Articles in Category */}
          {relatedArticles.length > 0 && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.03)'
            }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1e2035', margin: '0 0 16px 0', fontWeight: 700 }}>Bài viết liên quan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {relatedArticles.map((art, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/article/${toSlug(art.title)}`)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    {art.imageUrl ? (
                      <img 
                        src={art.imageUrl} 
                        alt="" 
                        style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} 
                      />
                    ) : (
                      <div style={{ width: '64px', height: '48px', background: '#f8ece6', borderRadius: '8px', flexShrink: 0 }} />
                    )}
                    <div>
                      <h4 style={{ 
                        fontSize: '0.88rem', 
                        color: '#1e2035', 
                        margin: 0, 
                        fontWeight: 600,
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {art.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
