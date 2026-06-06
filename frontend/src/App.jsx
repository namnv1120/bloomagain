import React, { useState, useEffect, useRef } from 'react';
import { staticData } from './data/staticData';

const renderFacilitySvg = (type) => {
  const commonProps = { width: "100%", height: "130", viewBox: "0 0 240 130", style: { borderRadius: '12px', display: 'block' } };
  if (type === 'clinic' || type === 'hospital' || type === 'medical') {
    return (
      <svg {...commonProps}>
        <defs>
          <linearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d7f1ea" />
            <stop offset="100%" stopColor="#bfead8" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#medGrad)" />
        <circle cx="120" cy="65" r="40" fill="rgba(255, 255, 255, 0.4)" />
        <rect x="105" y="45" width="30" height="40" rx="3" fill="#34a853" opacity="0.15" />
        <path d="M120 50v30M105 65h30" stroke="#34a853" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <defs>
        <linearGradient id="sheGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe1eb" />
          <stop offset="100%" stopColor="#ffb3c6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sheGrad)" />
      <circle cx="120" cy="65" r="40" fill="rgba(255, 255, 255, 0.4)" />
      <path d="M120 80s-20-13-20-25a10 10 0 0120-5 10 10 0 0120 5c0 12-20 25-20 25z" fill="#e91e63" />
    </svg>
  );
};

function App() {
  // Navigation & Page State
  const [activePage, setActivePage] = useState('home');
  const [knowledgeCategory, setKnowledgeCategory] = useState('Giáo dục giới tính');
  const [productCategory, setProductCategory] = useState('Sản phẩm giáo dục');

  // User Profile / Onboarding State
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  // Temp selections inside onboarding (not yet confirmed)
  const [tempGender, setTempGender] = useState(null);
  const [tempAge, setTempAge] = useState(null);

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
  const fullscreenChatEndRef = useRef(null);

  // Facility/Center filtering and expansion
  const [healthRegionFilter, setHealthRegionFilter] = useState('Tất cả');
  const [supportRegionFilter, setSupportRegionFilter] = useState('Tất cả');
  const [expandedFacility, setExpandedFacility] = useState(null);
  const [expandedCenter, setExpandedCenter] = useState(null);

  // Initialize profile from sessionStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('bloomAgainProfile') || 'null');
      if (stored && stored.gender && stored.age) {
        setGender(stored.gender);
        setAge(stored.age);
        setTempGender(stored.gender);
        setTempAge(stored.age);
        setShowOnboarding(false);
      }
    } catch (err) {
      console.warn('Unable to read session storage', err);
    }
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  // Handle auto scroll for chat messages
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatMessagesEndRef.current) {
        chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      if (fullscreenChatEndRef.current) {
        fullscreenChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [chatHistory, isBotTyping, isChatOpen, activePage]);

  // Confirm onboarding selection
  const handleConfirmOnboarding = () => {
    if (!tempGender || !tempAge) return;
    setGender(tempGender);
    setAge(tempAge);
    sessionStorage.setItem('bloomAgainProfile', JSON.stringify({ gender: tempGender, age: tempAge }));
    setShowOnboarding(false);
  };

  // Reset profile / onboarding
  const handleResetProfile = () => {
    sessionStorage.removeItem('bloomAgainProfile');
    setGender(null);
    setAge(null);
    setTempGender(null);
    setTempAge(null);
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
        results.push({ type: 'Bảo trợ trẻ em', title: item.name, meta: item.address });
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

  // Initialize chat history with greeting when opening
  const initChat = () => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          role: 'bot',
          content: 'Xin chào, mình là AI của Bloom Again. Bạn cần giúp gì? (trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ)'
        }
      ]);
    }
  };

  // Chat opening initialization (floating panel)
  const toggleChatPanel = () => {
    setIsChatOpen(prev => {
      const next = !prev;
      if (next) initChat();
      return next;
    });
  };

  // Open home page AI chat button (same as clicking FAB)
  const handleHomeChatOpen = () => {
    initChat();
    setIsChatOpen(true);
  };

  // Go to fullscreen chat page
  const handleGoFullscreenChat = () => {
    initChat();
    setIsChatOpen(false);
    setActivePage('chat-fullscreen');
  };

  // Suggestion Chip handler
  const handleSuggestionClick = (suggestion) => {
    alert(`Mở bài viết minh họa: ${suggestion}`);
  };

  const suggestions = gender ? staticData.suggestions[gender] : [];
  const currentKnowledge = staticData.knowledge[knowledgeCategory];
  const currentProducts = staticData.productCategories[productCategory];

  return (
    <>
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
                  {tempGender && tempAge
                    ? `Đã chọn: ${tempGender} • ${tempAge}`
                    : tempGender
                      ? `Giới tính: ${tempGender} • Chưa chọn độ tuổi`
                      : tempAge
                        ? `Chưa chọn giới tính • ${tempAge}`
                        : 'Chưa chọn đủ thông tin'}
                </div>
              </div>

              <div className="question">
                <h3>Giới tính</h3>
                <div className="choice-grid">
                  {['Nam', 'Nữ', 'LGBTQ+'].map(g => (
                    <button
                      key={g}
                      className={`choice ${g === 'Nam' ? 'male' : g === 'Nữ' ? 'female' : 'lgbtq'} ${tempGender === g ? 'active' : ''}`}
                      onClick={() => setTempGender(g)}
                      type="button"
                    >
                      {tempGender === g ? '✓ ' : ''}{g}
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
                      className={`choice ageChoice ${tempAge === a ? 'active' : ''}`}
                      onClick={() => setTempAge(a)}
                      type="button"
                    >
                      {tempAge === a ? '✓ ' : ''}{a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`onboard-confirm-btn ${tempGender && tempAge ? 'ready' : ''}`}
                onClick={handleConfirmOnboarding}
                disabled={!tempGender || !tempAge}
                type="button"
              >
                {tempGender && tempAge
                  ? `Xác nhận — ${tempGender} • ${tempAge} ✓`
                  : 'Vui lòng chọn đủ giới tính và độ tuổi'}
              </button>
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
              <span>Giáo dục giới tính, sức khoẻ sinh sản &amp; tâm sinh lý teen</span>
            </div>
          </a>

          <nav className="top-nav" aria-label="Điều hướng chính">
            {/* Trang chủ */}
            <button
              className={`nav-btn ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => { setActivePage('home'); setShowSearchResults(false); }}
              type="button"
            >
              Trang chủ
            </button>

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
                  Trung tâm bảo trợ trẻ em
                </button>
                <button className="dropdown-item" type="button" onClick={() => setActivePage('health')}>
                  Cơ sở y tế
                </button>
              </div>
            </div>

            {/* Về chúng tôi */}
            <button
              className={`nav-btn ${activePage === 'about' ? 'active' : ''}`}
              onClick={() => setActivePage('about')}
              type="button"
            >
              Về chúng tôi
            </button>
          </nav>
        </div>
      </header>

      {/* Main Pages */}
      {/* Shell */}
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
                  <button className="btn ai-chat-btn" onClick={handleHomeChatOpen} type="button" id="homeChatBtn">
                    <span className="ai-chat-icon">🤖</span>
                    Chat với AI
                  </button>
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
        {activePage === 'health' && (() => {
          const filteredFacilities = staticData.healthFacilities.filter(
            item => healthRegionFilter === 'Tất cả' || item.region === healthRegionFilter
          );
          const selectedItem = filteredFacilities.find(f => f.name === expandedFacility);

          return (
            <div className="page active">
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Cơ sở y tế thân thiện với teen</h2>
                    <p>Danh sách minh họa để người dùng tìm nơi hỗ trợ an toàn.</p>
                  </div>
                </div>

                {/* Region Selector */}
                <div className="filter-chips">
                  {['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((r) => (
                    <button
                      key={r}
                      className={`filter-chip ${healthRegionFilter === r ? 'active' : ''}`}
                      onClick={() => {
                        setHealthRegionFilter(r);
                        setExpandedFacility(null);
                      }}
                      type="button"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="facilities-grid">
                  {filteredFacilities.map((item, idx) => {
                    const isSelected = expandedFacility === item.name;
                    return (
                      <div 
                        key={idx} 
                        className={`facility-item clickable ${isSelected ? 'selected' : ''}`}
                        onClick={() => setExpandedFacility(isSelected ? null : item.name)}
                      >
                        <div className="facility-item-header">
                          <div className="facility-title-area">
                            <strong>{item.name}</strong>
                            <span className="facility-region">{item.region}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Separate Details Row Below Grid */}
                {selectedItem && (
                  <div className="facility-detail-panel">
                    <div className="facility-detail-panel-header">
                      <h3>Chi tiết cơ sở: {selectedItem.name}</h3>
                      <button className="detail-close-btn" onClick={() => setExpandedFacility(null)}>×</button>
                    </div>
                    <div className="facility-details-grid">
                      <div className="facility-image">
                        {renderFacilitySvg(selectedItem.svgType)}
                      </div>
                      <div className="facility-info-text">
                        <p><strong>⏰ Giờ làm việc:</strong> {selectedItem.workingHours}</p>
                        <p><strong>📞 Điện thoại:</strong> {selectedItem.phone}</p>
                        <p>
                          <strong>📍 Địa chỉ:</strong>{' '}
                          <a 
                            href={selectedItem.gmaps} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gmaps-link"
                          >
                            {selectedItem.address} ↗
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          );
        })()}

        {/* SUPPORT PAGE */}
        {activePage === 'support' && (() => {
          const filteredCenters = staticData.supportCenters.filter(
            item => supportRegionFilter === 'Tất cả' || item.region === supportRegionFilter
          );
          const selectedItem = filteredCenters.find(c => c.name === expandedCenter);

          return (
            <div className="page active">
              <section className="section">
                <div className="section-head">
                  <div>
                    <h2>Trung tâm bảo trợ trẻ em</h2>
                    <p>Danh sách trung tâm hỗ trợ và số hotline tham khảo.</p>
                  </div>
                </div>

                {/* Region Selector */}
                <div className="filter-chips">
                  {['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((r) => (
                    <button
                      key={r}
                      className={`filter-chip ${supportRegionFilter === r ? 'active' : ''}`}
                      onClick={() => {
                        setSupportRegionFilter(r);
                        setExpandedCenter(null);
                      }}
                      type="button"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="facilities-grid">
                  {filteredCenters.map((item, idx) => {
                    const isSelected = expandedCenter === item.name;
                    return (
                      <div 
                        key={idx} 
                        className={`facility-item clickable ${isSelected ? 'selected' : ''}`}
                        onClick={() => setExpandedCenter(isSelected ? null : item.name)}
                      >
                        <div className="facility-item-header">
                          <div className="facility-title-area">
                            <strong>{item.name}</strong>
                            <span className="facility-region">{item.region}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Separate Details Row Below Grid */}
                {selectedItem && (
                  <div className="facility-detail-panel">
                    <div className="facility-detail-panel-header">
                      <h3>Chi tiết trung tâm: {selectedItem.name}</h3>
                      <button className="detail-close-btn" onClick={() => setExpandedCenter(null)}>×</button>
                    </div>
                    <div className="facility-details-grid">
                      <div className="facility-image">
                        {renderFacilitySvg(selectedItem.svgType)}
                      </div>
                      <div className="facility-info-text">
                        <p><strong>⏰ Giờ làm việc:</strong> {selectedItem.workingHours}</p>
                        <p><strong>📞 Hotline:</strong> <span className="hotline-highlight">{selectedItem.hotline}</span></p>
                        <p>
                          <strong>📍 Địa chỉ:</strong>{' '}
                          <a 
                            href={selectedItem.gmaps} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="gmaps-link"
                          >
                            {selectedItem.address} ↗
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          );
        })()}

        {/* ABOUT PAGE */}
        {activePage === 'about' && (
          <div className="page active">
            <div className="about-hero">
              <div className="about-hero-text">
                <div className="eyebrow">🌸 Câu chuyện của chúng tôi</div>
                <h1 className="about-title">Về Bloom Again</h1>
                <p className="about-subtitle">Chúng tôi tin rằng mọi bạn trẻ đều xứng đáng được tiếp cận kiến thức đúng đắn về giới tính và sức khỏe tâm lý, trong một không gian an toàn, thân thiện và không phán xét.</p>
              </div>
              <div className="about-badge-wrap">
                <div className="about-badge">🌼</div>
              </div>
            </div>

            <div className="about-grid">
              <div className="about-card">
                <div className="about-card-icon">🎯</div>
                <h3>Sứ mệnh</h3>
                <p>Cung cấp nền tảng giáo dục giới tính toàn diện, giúp thanh thiếu niên Việt Nam hiểu rõ cơ thể, cảm xúc và quyền của bản thân một cách khoa học và gần gũi.</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">👁️</div>
                <h3>Tầm nhìn</h3>
                <p>Xây dựng thế hệ trẻ Việt tự tin, hiểu biết và có trách nhiệm với bản thân cũng như người xung quanh trong các mối quan hệ và sức khỏe cá nhân.</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">💡</div>
                <h3>Giá trị cốt lõi</h3>
                <p>An toàn, bảo mật, không phán xét. Mọi thông tin đều được kiểm duyệt bởi chuyên gia y tế và tâm lý học có chứng chỉ.</p>
              </div>
            </div>

            <section className="section about-team-section">
              <div className="section-head">
                <div>
                  <h2>Đội ngũ sáng lập</h2>
                  <p>Những người đã xây dựng Bloom Again với tâm huyết vì thế hệ trẻ.</p>
                </div>
              </div>
              <div className="team-grid">
                {[
                  { name: 'Nguyễn Minh Anh', role: 'Nhà sáng lập & Giám đốc điều hành', emoji: '👩‍💼', desc: 'Chuyên gia tâm lý học lâm sàng với 8 năm kinh nghiệm tư vấn cho thanh thiếu niên.' },
                  { name: 'Trần Bảo Long', role: 'Giám đốc Y tế', emoji: '👨‍⚕️', desc: 'Bác sĩ chuyên khoa sản phụ khoa, 10 năm kinh nghiệm giáo dục sức khỏe sinh sản.' },
                  { name: 'Lê Thị Hương', role: 'Trưởng phòng Nội dung', emoji: '👩‍🏫', desc: 'Giáo viên và nhà văn, chuyên viết nội dung giáo dục phù hợp với lứa tuổi teen.' },
                ].map((member, idx) => (
                  <div key={idx} className="team-card">
                    <div className="team-avatar">{member.emoji}</div>
                    <div className="team-info">
                      <strong>{member.name}</strong>
                      <span className="team-role">{member.role}</span>
                      <p>{member.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="section about-stats-section">
              <div className="stats-grid">
                {[
                  { num: '10,000+', label: 'Người dùng tin tưởng' },
                  { num: '150+', label: 'Bài viết chuyên sâu' },
                  { num: '24/7', label: 'AI hỗ trợ liên tục' },
                  { num: '100%', label: 'Miễn phí & Ẩn danh' },
                ].map((stat, idx) => (
                  <div key={idx} className="stat-item">
                    <span className="stat-num">{stat.num}</span>
                    <span className="stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* FULLSCREEN CHAT PAGE */}
        {activePage === 'chat-fullscreen' && (
          <div className="page active fullscreen-chat-page">
            <div className="fullscreen-chat-container">
              <div className="fullscreen-chat-header">
                <button
                  className="fs-back-btn"
                  onClick={() => setActivePage('home')}
                  type="button"
                  aria-label="Quay lại trang chủ"
                >
                  ← Quay lại
                </button>
                <div className="fs-chat-title">
                  <div>
                    <strong>AI của Bloom Again</strong>
                    <span>Trấn an tâm lý • Tư vấn sản phẩm • Kiến thức giới tính • Tìm cơ sở y tế</span>
                  </div>
                </div>
                <div className="fs-status">
                  <span className="fs-online-dot"></span>
                  Đang hoạt động
                </div>
              </div>

              <div className="fullscreen-chat-messages">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                    <div className="msg-content">{msg.content}</div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="msg bot">
                    <div className="msg-content typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={fullscreenChatEndRef} />
              </div>

              <form className="fullscreen-chat-input" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  placeholder="Nhập điều bạn đang quan tâm..."
                  autoComplete="off"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  id="fullscreenChatInput"
                />
                <button className="chat-send" type="submit" id="fullscreenChatSend">Gửi ✈</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {activePage !== 'chat-fullscreen' && (
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>Bloom Again • Giáo dục giới tính kết hợp tâm sinh lý và sức khoẻ sinh sản</div>
            <button className="link-reset" onClick={handleResetProfile} type="button">Đổi lựa chọn onboarding</button>
          </div>
        </footer>
      )}

      {/* Chat FAB - hidden on fullscreen chat page */}
      {activePage !== 'chat-fullscreen' && (
        <button className="chat-fab" onClick={toggleChatPanel} aria-label="Mở chat AI">💬</button>
      )}

      {/* Chat Panel */}
      {activePage !== 'chat-fullscreen' && (
        <section className={`chat-panel ${isChatOpen ? 'open' : ''}`} aria-label="Chat AI Bloom Again">
          <div className="chat-header">
            <div className="chat-header-main">
              <strong>AI của Bloom Again</strong>
              <span>Trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ.</span>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-maximize"
                onClick={handleGoFullscreenChat}
                aria-label="Phóng toàn màn hình"
                title="Mở chat toàn màn hình"
                type="button"
                id="chatMaximizeBtn"
              >
                ⛶
              </button>
              <button className="chat-close" onClick={toggleChatPanel} aria-label="Đóng chat" type="button">×</button>
            </div>
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
      )}
    </>
  );
}

export default App;
