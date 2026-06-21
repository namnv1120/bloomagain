import React, { useState, useEffect, useRef } from 'react';
import { useAppData, fetchSuggestions, API_BASE } from './hooks/useAppData';
import { staticData } from './data/staticData'; // fallback
import { useLocation } from './hooks/useLocation';

// Import Page Components
import Home from './pages/Home';
import Knowledge from './pages/Knowledge';
import Products from './pages/Products';
import Health from './pages/Health';
import Support from './pages/Support';
import About from './pages/About';
import ChatFullscreen from './pages/ChatFullscreen';

function App() {
  // Navigation & Page State synchronized via URL
  const [location, navigate] = useLocation();

  // Helper to resolve active tab based on pathname
  const getActivePage = () => {
    if (location === '/') return 'home';
    if (location === '/knowledge') return 'knowledge';
    if (location === '/products') return 'products';
    if (location === '/health') return 'health';
    if (location === '/support') return 'support';
    if (location === '/about') return 'about';
    if (location === '/chat') return 'chat-fullscreen';
    return 'home'; // fallback
  };

  const activePage = getActivePage();

  const [knowledgeCategory, setKnowledgeCategory] = useState(null);
  const [productCategory, setProductCategory] = useState(() => {
    try {
      return sessionStorage.getItem('bloomAgainProductCat') || 'Sản phẩm giáo dục';
    } catch {
      return 'Sản phẩm giáo dục';
    }
  });

  // Helper to read initial profile synchronously to prevent onboarding flicker on mount
  const getInitialProfile = () => {
    try {
      const stored = sessionStorage.getItem('bloomAgainProfile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.gender && parsed.age) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Unable to read session storage', err);
    }
    return null;
  };

  const initialProfile = getInitialProfile();

  // User Profile / Onboarding State
  const [gender, setGender] = useState(initialProfile ? initialProfile.gender : null);
  const [age, setAge] = useState(initialProfile ? initialProfile.age : null);
  const [showOnboarding, setShowOnboarding] = useState(!initialProfile);
  const [tempGender, setTempGender] = useState(initialProfile ? initialProfile.gender : null);
  const [tempAge, setTempAge] = useState(initialProfile ? initialProfile.age : null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('bloomAgainChat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tự động lưu chatHistory vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bloomAgainChat', JSON.stringify(chatHistory));
    } catch (err) {
      console.warn('Lỗi khi lưu lịch sử chat', err);
    }
  }, [chatHistory]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const fullscreenChatEndRef = useRef(null);

  // Facility/Center filtering and expansion
  const [healthRegionFilter, setHealthRegionFilter] = useState('Tất cả');
  const [supportRegionFilter, setSupportRegionFilter] = useState('Tất cả');
  const [expandedFacility, setExpandedFacility] = useState(null);
  const [expandedCenter, setExpandedCenter] = useState(null);

  // API data
  const { knowledge: apiKnowledge, productCategories: apiProducts, healthFacilities: apiFacilities, supportCenters: apiCenters, loading } = useAppData();
  const knowledge = apiKnowledge || staticData.knowledge;
  const productCategoriesData = apiProducts || staticData.productCategories;
  const healthFacilitiesData = apiFacilities || staticData.healthFacilities;
  const supportCentersData = apiCenters || staticData.supportCenters;

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);

  // Fetch suggestions whenever gender or age changes
  useEffect(() => {
    if (gender && age) {
      fetchSuggestions(gender, age).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [gender, age]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

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
  }, [chatHistory, isBotTyping, isChatOpen, location]);

  // Confirm onboarding selection
  const handleConfirmOnboarding = () => {
    if (!tempGender || !tempAge) return;
    setGender(tempGender);
    setAge(tempAge);
    sessionStorage.setItem('bloomAgainProfile', JSON.stringify({ gender: tempGender, age: tempAge }));
    setShowOnboarding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Report selection to database statistics
    fetch(`${API_BASE}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender: tempGender, age: tempAge })
    }).catch(err => console.warn('Failed to record onboarding stats', err));
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

  // Run Local Search — dùng data từ API (đã load), fallback về staticData nếu chưa có
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setShowSearchResults(false);
      return;
    }

    const results = [];
    // Search Knowledge Articles
    Object.entries(knowledge).forEach(([category, info]) => {
      info.articles.forEach(article => {
        if (article.title.toLowerCase().includes(q) || (article.desc || article.description || '').toLowerCase().includes(q)) {
          results.push({ type: 'Kiến thức', title: article.title, meta: category });
        }
      });
    });

    // Search Products
    Object.entries(productCategoriesData).forEach(([category, products]) => {
      products.forEach(product => {
        if (product.name.toLowerCase().includes(q) || (product.desc || product.description || '').toLowerCase().includes(q)) {
          results.push({ type: 'Sản phẩm', title: product.name, meta: category });
        }
      });
    });

    // Search Health Facilities
    healthFacilitiesData.forEach(item => {
      if (item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)) {
        results.push({ type: 'Cơ sở y tế', title: item.name, meta: item.address });
      }
    });

    // Search Support Centers
    supportCentersData.forEach(item => {
      if (item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)) {
        results.push({ type: 'Bảo trợ trẻ em', title: item.name, meta: item.address });
      }
    });

    setSearchResults(results);
    setSearchSummary(`Từ khóa: "${searchQuery}" • ${results.length} kết quả`);
    setShowSearchResults(true);
    navigate('/');
  };


  // Chat submit logic interacting with Express backend
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;

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
        let path = data.target;
        if (path === 'home') path = '/';
        else if (!path.startsWith('/')) path = '/' + path;
        navigate(path);
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

  const toggleChatPanel = () => {
    setIsChatOpen(prev => {
      const next = !prev;
      if (next) initChat();
      return next;
    });
  };

  const handleHomeChatOpen = () => {
    initChat();
    setIsChatOpen(true);
  };

  const handleGoFullscreenChat = () => {
    initChat();
    setIsChatOpen(false);
    navigate('/chat');
  };

  const handleSuggestionClick = (item) => {
    const cat = typeof item === 'string' ? item : item.category;
    if (cat && knowledge && knowledge[cat]) {
      setKnowledgeCategory(cat);
      navigate('/knowledge');
    }
  };

  const currentKnowledge = knowledge ? knowledge[knowledgeCategory] : null;
  const currentProducts = productCategoriesData ? productCategoriesData[productCategory] : null;

  if (loading) {
    return (
      <div className="client-loading-screen">
        <div className="loading-logo"><img src="/logo.png" alt="Bloom Again Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} /></div>
        <div className="loading-text">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Dialog */}
      {showOnboarding && (
        <div className="onboard" role="dialog" aria-modal="true">
          <div className="onboard-card">
            <div className="onboard-grid">
              <div className="onboard-top">
                <div>
                  <div className="eyebrow"><img src="/logo-nen.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle', marginRight: '6px' }} /> Chào mừng đến với Bloom Again</div>
                  <h2 className="onboard-title">Chọn nhanh để cá nhân hóa nội dung, không cần thao tác rườm rà.</h2>
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
                  {['13-17 tuổi', '18-24 tuổi', 'Khác'].map(a => (
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
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); setShowSearchResults(false); }}>
            <div className="brand-mark"><img src="/logo-nen.png" alt="Bloom Again Logo" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%', display: 'block' }} /></div>
            <div className="brand-text">
              <strong>Bloom Again</strong>
              <span>Giáo dục giới tính, sức khoẻ sinh sản &amp; tâm sinh lý teen</span>
            </div>
          </a>

          <nav className="top-nav" aria-label="Điều hướng chính">
            <button
              className={`nav-btn ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => { navigate('/'); setShowSearchResults(false); }}
              type="button"
            >
              Trang chủ
            </button>

            <button
              className={`nav-btn ${activePage === 'knowledge' ? 'active' : ''}`}
              onClick={() => {
                setKnowledgeCategory(null);
                navigate('/knowledge');
              }}
              type="button"
            >
              Kiến thức
            </button>

            <div className="dropdown">
              <button
                className={`nav-btn ${activePage === 'products' ? 'active' : ''}`}
                type="button"
                onClick={() => {
                  setProductCategory('Tất cả');
                  navigate('/products');
                }}
              >
                Sản phẩm
              </button>
              <div className="dropdown-menu">
                {(() => {
                  const standardOrder = ['Sản phẩm giáo dục', 'Sản phẩm vệ sinh', 'Sản phẩm tránh thai', 'Sản phẩm chăm sóc cơ thể'];
                  return Object.keys(productCategoriesData).sort((a, b) => {
                    const ia = standardOrder.indexOf(a);
                    const ib = standardOrder.indexOf(b);
                    return (ia !== -1 ? ia : 99) - (ib !== -1 ? ib : 99);
                  }).map(cat => (
                    <button
                      key={cat}
                      className={`dropdown-item ${activePage === 'products' && productCategory === cat ? 'active' : ''}`}
                      type="button"
                      onClick={() => {
                        setProductCategory(cat);
                        navigate('/products');
                      }}
                    >
                      {cat}
                    </button>
                  ));
                })()}
              </div>
            </div>

            <div className="dropdown">
              <button className={`nav-btn ${(activePage === 'support' || activePage === 'health') ? 'active' : ''}`} type="button">
                Giải pháp
              </button>
              <div className="dropdown-menu">
                <button className={`dropdown-item ${activePage === 'support' ? 'active' : ''}`} type="button" onClick={() => { navigate('/support'); }}>
                  Trung tâm bảo trợ trẻ em
                </button>
                <button className={`dropdown-item ${activePage === 'health' ? 'active' : ''}`} type="button" onClick={() => { navigate('/health'); }}>
                  Cơ sở y tế
                </button>
              </div>
            </div>

            <button
              className={`nav-btn ${activePage === 'about' ? 'active' : ''}`}
              onClick={() => navigate('/about')}
              type="button"
            >
              Về chúng tôi
            </button>
          </nav>
        </div>
      </header>

      {/* Main Pages */}
      <main className="shell">
        {activePage === 'home' && (
          <Home
            gender={gender}
            age={age}
            suggestions={suggestions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            searchSummary={searchSummary}
            handleSearchSubmit={handleSearchSubmit}
            handleSuggestionClick={handleSuggestionClick}
            handleHomeChatOpen={handleHomeChatOpen}
            navigate={navigate}
          />
        )}

        {activePage === 'knowledge' && (
          <Knowledge
            knowledge={knowledge}
            knowledgeCategory={knowledgeCategory}
            setKnowledgeCategory={setKnowledgeCategory}
            currentKnowledge={currentKnowledge}
          />
        )}

        {activePage === 'products' && (
          <Products
            productCategoriesData={productCategoriesData}
            productCategory={productCategory}
            setProductCategory={setProductCategory}
            currentProducts={currentProducts}
          />
        )}

        {activePage === 'health' && (
          <Health
            healthFacilitiesData={healthFacilitiesData}
            healthRegionFilter={healthRegionFilter}
            setHealthRegionFilter={setHealthRegionFilter}
            expandedFacility={expandedFacility}
            setExpandedFacility={setExpandedFacility}
          />
        )}

        {activePage === 'support' && (
          <Support
            supportCentersData={supportCentersData}
            supportRegionFilter={supportRegionFilter}
            setSupportRegionFilter={setSupportRegionFilter}
            expandedCenter={expandedCenter}
            setExpandedCenter={setExpandedCenter}
          />
        )}

        {activePage === 'about' && (
          <About />
        )}

        {activePage === 'chat-fullscreen' && (
          <ChatFullscreen
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            isBotTyping={isBotTyping}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSubmit={handleChatSubmit}
            fullscreenChatEndRef={fullscreenChatEndRef}
            navigate={navigate}
          />
        )}
      </main>

      {/* Footer */}
      {activePage !== 'chat-fullscreen' && (
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div className="footer-col">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); setShowSearchResults(false); }}>
                  <img src="/logo-nen.png" alt="Bloom Again Logo" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%' }} />
                </a>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#314152', textTransform: 'none', letterSpacing: 'normal' }}>Bloom Again</h3>
                </div>
              </div>
              <p style={{ maxWidth: '280px', marginBottom: '8px' }}>Giáo dục giới tính kết hợp tâm sinh lý và sức khoẻ sinh sản, tạo không gian an toàn cho tuổi teen.</p>
              <button className="link-reset" onClick={handleResetProfile} type="button" style={{ display: 'inline-block', fontWeight: 'bold' }}>Đổi lựa chọn onboarding</button>
            </div>

            <div className="footer-col">
              <h3>Liên hệ & Hỗ trợ</h3>
              <p style={{ maxWidth: '280px', marginBottom: '8px' }}>Hỗ trợ: 096 990 8956</p>
              <p style={{ maxWidth: '280px', marginBottom: '8px' }}>Hợp tác: 039 361 2056</p>
              <p style={{ maxWidth: '280px', marginBottom: '8px' }}>Email: bloomagain.antam@gmail.com</p>
            </div>

            <div className="footer-col">
              <h3>Kết nối với chúng tôi</h3>
              <p>Theo dõi Bloom Again để cập nhật kiến thức mỗi ngày.</p>
              <div className="footer-socials" style={{ display: 'flex', gap: '12px' }}>
                <a href="https://www.facebook.com/share/18NCiR7yfS/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="social-btn" title="Fanpage Facebook" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', backgroundColor: '#f0f2f5', borderRadius: '50%', transition: 'transform 0.2s' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" style={{ width: '28px', height: '28px' }} />
                </a>
                <a href="https://www.tiktok.com/@bloomagain_antam" target="_blank" rel="noreferrer" className="social-btn" title="Tiktok Bloom Again" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', backgroundColor: '#f0f2f5', borderRadius: '50%', transition: 'transform 0.2s' }}>
                  <img src="https://store-images.s-microsoft.com/image/apps.3793.13634052595610511.c45457c9-b4af-46b0-8e61-8d7c0aec3f56.bbc8b3d1-941b-42c2-a610-e100e2aae247" alt="TikTok" style={{ width: '28px', height: '28px' }} />
                </a>
                <a href="https://www.threads.com/@bloomagain.antam" target="_blank" rel="noreferrer" className="social-btn" title="Threads Bloom Again" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', backgroundColor: '#f0f2f5', borderRadius: '50%', transition: 'transform 0.2s' }}>
                  <img src="https://static.vecteezy.com/system/resources/previews/031/737/194/non_2x/threads-social-media-logo-threads-icon-free-png.png" alt="Threads" style={{ width: '28px', height: '28px' }} />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Chat FAB - hidden on fullscreen chat page */}
      {activePage !== 'chat-fullscreen' && (
        <button className="chat-fab" onClick={toggleChatPanel} aria-label="Mở chat AI">💬</button>
      )}

      {/* Chat Panel (Floating Widget) */}
      {activePage !== 'chat-fullscreen' && (
        <section className={`chat-panel ${isChatOpen ? 'open' : ''}`} aria-label="Chat AI Bloom Again">
          <div className="chat-header">
            <div className="chat-header-main">
              <strong>AI của Bloom Again</strong>
              <span>Trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ.</span>
            </div>
            <div className="chat-header-actions">
              {chatHistory.length > 1 && (
                <button
                  className="chat-maximize"
                  onClick={() => setChatHistory([{ role: 'bot', content: 'Xin chào, mình là AI của Bloom Again. Bạn cần giúp gì? (trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ)' }])}
                  aria-label="Đoạn chat mới"
                  title="Bắt đầu đoạn chat mới"
                  type="button"
                >
                  ✨
                </button>
              )}
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
