import React, { useState, useEffect } from 'react';

export default function Home({
  gender,
  age,
  suggestions,
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchResults,
  searchSummary,
  handleSearchSubmit,
  handleSuggestionClick,
  handleHomeChatOpen,
  navigate
}) {
  const [framesReady, setFramesReady] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = 10;
    for (let i = 1; i <= total; i++) {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === total) setFramesReady(true);
      };
      img.src = `/${i}.png`;
    }
  }, []);

  return (
    <div className="page active">
      <div className="hero">
        <div>
          <div className="eyebrow">Hãy để những cánh hoa nở lại</div>
          <h1>Đồng hành cùng tuổi trẻ an toàn và hiểu biết</h1>
          <p className="subtitle">Trang web giáo dục giới tính kết hợp tâm sinh lý, tạo không gian tìm hiểu nhẹ nhàng, bảo mật và không phán xét.</p>
          <div className="trustline">🔒 Bảo mật • An toàn • Hoàn toàn ẩn danh • Không phán xét</div>
          <div className="hero-actions">
            <button className="btn ai-chat-btn" onClick={handleHomeChatOpen} type="button" id="homeChatBtn">
              <span className="ai-btn-text">
                <span className="ai-btn-label">🐧 Chat với LUM ngay</span>
                <span className="ai-btn-sub">Hỏi đáp tức thì • Miễn phí • Hoàn toàn ẩn danh</span>
              </span>
            </button>
            <div className="hero-secondary-actions">
              <button className="btn hero-btn" onClick={() => navigate('/knowledge')} type="button">
                📚 Kiến thức
              </button>
              <button className="btn hero-btn" onClick={() => navigate('/products')} type="button">
                🛍️ Sản phẩm
              </button>
            </div>
          </div>
        </div>
        <div className="mascot-wrap">
          <div style={{ position: 'relative', width: 'min(100%, 400px)', aspectRatio: '1' }}>
            <div className="mascot-sprite" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
              <div className={`mascot-frame ${framesReady ? 'animate' : ''}`} id="mascotAnimator" />
            </div>
            <div className="mascot-bubble-wrap">
              <span className="mascot-bubble" style={{ animationDelay: '0s' }}>Ngày hôm nay của bạn thế nào?</span>
              <span className="mascot-bubble" style={{ animationDelay: '4s' }}>Hãy tâm sự với mình ở đây nhé.</span>
              <span className="mascot-bubble" style={{ animationDelay: '8s' }}>Ở đây bạn luôn ẨN DANH.</span>
              <span className="mascot-bubble" style={{ animationDelay: '12s' }}>Kiến thức, tâm sự mình đều có.</span>
              <span className="mascot-bubble" style={{ animationDelay: '16s' }}>Khám phá Bloom Again ngay!</span>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Gợi ý vấn đề theo lựa chọn của bạn</h2>
            <p>{gender ? `Gợi ý nhanh cho ${gender}${age ? ` • ${age}` : ''}:` : 'Chọn giới tính và độ tuổi để nhận gợi ý phù hợp.'}</p>
          </div>
        </div>
        <div className="chips">
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <button key={idx} className="chip" onClick={() => handleSuggestionClick(item)}>
                {item.icon && <span style={{ marginRight: '6px' }}>{item.icon}</span>}
                {item.label || item}
              </button>
            ))
          ) : (
            <div className="notice">Hãy đổi lựa chọn ở footer để nhận gợi ý phù hợp.</div>
          )}
        </div>
      </section>

      <section className="section home-search-section">
        <div className="search-container">
          <h2>Bạn muốn tìm kiếm điều gì hôm nay?</h2>
          <p>Khám phá kiến thức giáo dục giới tính, sản phẩm, và các cơ sở hỗ trợ y tế, tâm lý uy tín.</p>
          <form onSubmit={handleSearchSubmit} className="home-search-box">
            <input
              type="search"
              placeholder="Nhập từ khóa tìm kiếm (ví dụ: tuổi dậy thì, bao cao su, cơ sở y tế...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">
              <span className="search-btn-icon">🔍</span> Tìm kiếm
            </button>
          </form>
        </div>
      </section>

      {showSearchResults && (
        <section className="section" id="searchResultsSection">
          <div className="section-head">
            <div>
              <h2>Kết quả tìm kiếm</h2>
              <p>{searchSummary}</p>
            </div>
          </div>
          <div className="search-results">
            {searchResults.length > 0 ? (
              searchResults.map((r, idx) => (
                <div key={idx} className="search-item">
                  <strong>{r.title}</strong>
                  <span>{r.type} • {r.meta}</span>
                </div>
              ))
            ) : (
              <div className="notice">Không tìm thấy kết quả phù hợp.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
