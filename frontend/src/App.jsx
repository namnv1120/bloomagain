import React, { useState, useEffect, useRef } from 'react';
import { staticData } from './data/staticData';

function App() {
  // Navigation & Page State
  const [activePage, setActivePage] = useState('home');
  const [knowledgeCategory, setKnowledgeCategory] = useState('Giáo dục giới tính');
  const [productCategory, setProductCategory] = useState('Sản phẩm vệ sinh');

  // User Profile / Onboarding State
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);

  // Initialize profile from sessionStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('bloomAgainProfile') || 'null');
      if (stored && stored.gender && stored.age) {
        setGender(stored.gender);
        setAge(stored.age);
        setShowOnboarding(false);
      }
    } catch (err) {
      console.warn('Unable to read session storage', err);
    }
  }, []);

  // Save profile to sessionStorage
  useEffect(() => {
    if (gender && age) {
      sessionStorage.setItem('bloomAgainProfile', JSON.stringify({ gender, age }));
      setShowOnboarding(false);
    }
  }, [gender, age]);

  // Handle auto scroll for chat messages
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isBotTyping]);

  // Reset profile / onboarding
  const handleResetProfile = () => {
    sessionStorage.removeItem('bloomAgainProfile');
    setGender(null);
    setAge(null);
    setShowOnboarding(true);
  };

  // Run Local Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setShowSearchResults(false);
      return;
    }

    const results = [];
    // Search Knowledge Articles
    Object.entries(staticData.knowledge).forEach(([category, info]) => {
      info.articles.forEach(article => {
        if (article.title.toLowerCase().includes(q) || article.desc.toLowerCase().includes(q)) {
          results.push({ type: 'Kiến thức', title: article.title, meta: category });
        }
      });
    });

    // Search Products
    Object.entries(staticData.productCategories).forEach(([category, products]) => {
      products.forEach(product => {
        if (product.name.toLowerCase().includes(q) || product.desc.toLowerCase().includes(q)) {
          results.push({ type: 'Sản phẩm', title: product.name, meta: category });
        }
      });
    });

    // Search Health Facilities
    staticData.healthFacilities.forEach(item => {
      if (item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)) {
        results.push({ type: 'Cơ sở y tế', title: item.name, meta: item.address });
      }
    });

    // Search Support Centers
    staticData.supportCenters.forEach(item => {
      if (item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)) {
        results.push({ type: 'Bảo hộ trẻ em', title: item.name, meta: item.address });
      }
    });

    setSearchResults(results);
    setSearchSummary(`Từ khóa: "${searchQuery}" • ${results.length} kết quả`);
    setShowSearchResults(true);
    setActivePage('home');
  };

  // Chat submit logic interacting with Express backend
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

    // Add user message to history
    const userMessageObj = { role: 'user', content: message };
    const updatedHistory = [...chatHistory, userMessageObj];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsBotTyping(true);

    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:5000' : '';
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatHistory: updatedHistory })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'bot', content: data.reply }]);
      
      // Auto-trigger navigation action if backend returns redirection intent
      if (data.action === 'redirect') {
        if (data.category) {
          if (data.target === 'products') {
            setProductCategory(data.category);
          }
        }
        setActivePage(data.target);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, {
        role: 'bot',
        content: `[Lỗi hệ thống] Không thể kết nối đến server: ${error.message}.`
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // Chat opening initialization
  const toggleChatPanel = () => {
    setIsChatOpen(prev => {
      const next = !prev;
      if (next && chatHistory.length === 0) {
        setChatHistory([
          {
            role: 'bot',
            content: 'Xin chào, mình là AI của Bloom Again. Bạn cần giúp gì? (trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ)'
          }
        ]);
      }
      return next;
    });
  };

  // Suggestion Chip handler
  const handleSuggestionClick = (suggestion) => {
    alert(`Mở bài viết minh họa: ${suggestion}`);
  };

  const suggestions = gender ? staticData.suggestions[gender] : [];
  const currentKnowledge = staticData.knowledge[knowledgeCategory];
  const currentProducts = staticData.productCategories[productCategory];

  return (
    <div>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <div className="onboard" role="dialog" aria-modal="true">
          <div className="onboard-card">
            <div className="onboard-grid">
              <div className="onboard-top">
                <div>
                  <div className="eyebrow">🌸 Chào mừng đến với Bloom Again</div>
                  <h2 className="onboard-title">Chọn nhanh để cá nhân hóa nội dung, không cần thao tác rườm rà.</h2>
                  <p className="onboard-sub">Dữ liệu chỉ lưu trong phiên bằng sessionStorage và có thể đổi ở chân trang.</p>
                </div>
                <div className="status-pill">
                  {gender && age ? `Đã chọn: ${gender} • ${age}` : 'Chưa chọn đủ thông tin'}
                </div>
              </div>

              <div className="question">
                <h3>Giới tính</h3>
                <div className="choice-grid">
                  {['Nam', 'Nữ', 'LGBTQ+'].map(g => (
                    <button
                      key={g}
                      className={`choice ${g === 'Nam' ? 'male' : g === 'Nữ' ? 'female' : 'lgbtq'} ${gender === g ? 'active' : ''}`}
                      onClick={() => setGender(g)}
                      type="button"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="question">
                <h3>Độ tuổi</h3>
                <div className="choice-grid age">
                  {['13-17 tuổi', '18-24 tuổi'].map(a => (
                    <button
                      key={a}
                      className={`choice ageChoice ${age === a ? 'active' : ''}`}
                      onClick={() => setAge(a)}
                      type="button"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="topbar">
        <div className="shell nav-wrap">
          <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); setActivePage('home'); setShowSearchResults(false); }}>
            <div className="brand-mark">🌸</div>
            <div className="brand-text">
              <strong>Bloom Again</strong>
              <span>Giáo dục giới tính & tâm sinh lý teen</span>
            </div>
          </a>

          <nav className="top-nav" aria-label="Điều hướng chính">
            <button
              className={`nav-btn ${activePage === 'knowledge' ? 'active' : ''}`}
              onClick={() => setActivePage('knowledge')}
              type="button"
            >
              Kiến thức
            </button>

            <div className="dropdown">
              <button className={`nav-btn ${activePage === 'products' ? 'active' : ''}`} type="button">
                Sản phẩm
              </button>
              <div className="dropdown-menu">
                {Object.keys(staticData.productCategories).map(cat => (
                  <button
                    key={cat}
                    className="dropdown-item"
                    type="button"
                    onClick={() => {
                      setProductCategory(cat);
                      setActivePage('products');
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="dropdown">
              <button className={`nav-btn ${(activePage === 'support' || activePage === 'health') ? 'active' : ''}`} type="button">
                Giải pháp
              </button>
              <div className="dropdown-menu">
                <button className="dropdown-item" type="button" onClick={() => setActivePage('support')}>
                  Trung tâm bảo hộ trẻ em
                </button>
                <button className="dropdown-item" type="button" onClick={() => setActivePage('health')}>
                  Cơ sở y tế
                </button>
              </div>
            </div>
          </nav>

          <form onSubmit={handleSearchSubmit} className="search-box">
            <input
              type="search"
              placeholder="Tìm bài viết, sản phẩm, giải pháp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Tìm</button>
          </form>
        </div>
      </header>

      {/* Main Pages */}
      <main className="shell">
        {/* HOME PAGE */}
        {activePage === 'home' && (
          <div className="page active">
            <div className="hero">
              <div>
                <div className="eyebrow">Hãy để những cánh hoa nở lại</div>
                <h1>Đồng hành cùng tuổi trẻ an toàn và hiểu biết</h1>
                <p className="subtitle">Trang web giáo dục giới tính kết hợp tâm sinh lý, tạo không gian tìm hiểu nhẹ nhàng, bảo mật và không phán xét.</p>
                <div className="trustline">🔒 Bảo mật • An toàn • Hoàn toàn ẩn danh • Không phán xét</div>
                <div className="hero-actions">
                  <button className="btn primary" onClick={() => setActivePage('knowledge')} type="button">Mở Kiến thức</button>
                  <button className="btn secondary" onClick={() => setActivePage('products')} type="button">Xem Sản phẩm</button>
                </div>
              </div>
              <div className="mascot-wrap">
                <div className="mascot" aria-hidden="true">
                  <div className="flower">🌼</div>
                  <div className="face">◠‿◠</div>
                  <div className="floating-badge">Linh vật đồng hành</div>
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
                      {item}
                    </button>
                  ))
                ) : (
                  <div className="notice">Hãy đổi lựa chọn ở footer để nhận gợi ý phù hợp.</div>
                )}
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
        )}

        {/* KNOWLEDGE PAGE */}
        {activePage === 'knowledge' && (
          <div className="page active">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Kho kiến thức</h2>
                  <p>Chọn danh mục để xem bài viết mẫu và gợi ý sản phẩm liên quan.</p>
                </div>
              </div>
              <div className="chips">
                {Object.keys(staticData.knowledge).map(name => (
                  <button
                    key={name}
                    className={`chip ${name === knowledgeCategory ? 'active' : ''}`}
                    onClick={() => setKnowledgeCategory(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="grid-2 mtop">
                <div className="articles-grid">
                  {currentKnowledge.articles.map((article, idx) => (
                    <article key={idx} className="card">
                      <div className="img-placeholder" style={{ height: '140px', background: '#f8ece6', display: 'grid', placeItems: 'center', color: '#b55139', fontWeight: 600 }}>Ảnh bài viết</div>
                      <div className="card-body">
                        <h3>{article.title}</h3>
                        <p>{article.desc}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="section-soft">
                  <h3>Gợi ý sản phẩm</h3>
                  <div className="product-list">
                    {currentKnowledge.products.map((product, idx) => (
                      <div key={idx} className="product-item">
                        <strong>{product.name}</strong>
                        <span>Giá: {product.price}</span>
                      </div>
                    ))}
                  </div>
                  <p className="notice">{currentKnowledge.note}</p>
                </aside>
              </div>
            </section>
          </div>
        )}

        {/* PRODUCTS PAGE */}
        {activePage === 'products' && (
          <div className="page active">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Trang sản phẩm theo phân loại</h2>
                  <p>Có thể đi vào từng nhóm từ menu Sản phẩm hoặc qua gợi ý của chat AI.</p>
                </div>
              </div>
              <div className="chips">
                {Object.keys(staticData.productCategories).map(name => (
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
                {currentProducts.map((product, idx) => (
                  <div key={idx} className="product-item">
                    <strong>{product.name}</strong>
                    <span>{product.desc}</span><br />
                    <span>Giá: {product.price}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* HEALTH PAGE */}
        {activePage === 'health' && (
          <div className="page active">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Cơ sở y tế thân thiện với teen</h2>
                  <p>Danh sách minh họa để người dùng tìm nơi hỗ trợ an toàn.</p>
                </div>
              </div>
              <div className="facilities-grid">
                {staticData.healthFacilities.map((item, idx) => (
                  <div key={idx} className="facility-item">
                    <strong>{item.name}</strong>
                    <span>{item.address}</span><br />
                    <span>Điện thoại: {item.phone}</span><br />
                    <span>{item.note}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SUPPORT PAGE */}
        {activePage === 'support' && (
          <div className="page active">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Trung tâm bảo hộ trẻ em</h2>
                  <p>Danh sách trung tâm hỗ trợ và số hotline tham khảo.</p>
                </div>
              </div>
              <div className="facilities-grid">
                {staticData.supportCenters.map((item, idx) => (
                  <div key={idx} className="facility-item">
                    <strong>{item.name}</strong>
                    <span>{item.address}</span><br />
                    <span>Hotline: {item.hotline}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="shell footer-inner">
          <div>Bloom Again • Giáo dục giới tính kết hợp tâm sinh lý</div>
          <button className="link-reset" onClick={handleResetProfile} type="button">Đổi lựa chọn onboarding</button>
        </div>
      </footer>

      {/* Chat FAB */}
      <button className="chat-fab" onClick={toggleChatPanel} aria-label="Mở chat AI">💬</button>

      {/* Chat Panel */}
      <section className={`chat-panel ${isChatOpen ? 'open' : ''}`} aria-label="Chat AI Bloom Again">
        <div className="chat-header">
          <div className="chat-header-main">
            <strong>AI của Bloom Again</strong>
            <span>Trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ.</span>
          </div>
          <button className="chat-close" onClick={toggleChatPanel} aria-label="Đóng chat" type="button">×</button>
        </div>

        <div className="chat-messages">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
              {msg.content}
            </div>
          ))}
          {isBotTyping && (
            <div className="msg bot">Đang trả lời...</div>
          )}
          <div ref={chatMessagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleChatSubmit}>
          <input
            type="text"
            placeholder="Nhập điều bạn đang quan tâm..."
            autoComplete="off"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button className="chat-send" type="submit">Gửi</button>
        </form>
      </section>
    </div>
  );
}

export default App;
