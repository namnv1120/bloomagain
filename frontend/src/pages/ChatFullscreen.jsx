import React from 'react';

export default function ChatFullscreen({
  chatHistory,
  setChatHistory,
  isBotTyping,
  chatInput,
  setChatInput,
  handleChatSubmit,
  fullscreenChatEndRef,
  navigate
}) {
  return (
    <div className="page active fullscreen-chat-page">
      <div className="fullscreen-chat-container">
        <div className="fullscreen-chat-header">
          <button
            className="fs-back-btn"
            onClick={() => navigate('/')}
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
          <div className="fs-chat-actions">
            {chatHistory.length > 1 && (
              <button
                className="btn secondary"
                onClick={() => setChatHistory([{ role: 'bot', content: 'Xin chào, mình là AI của Bloom Again. Bạn cần giúp gì? (trấn an tâm lý, tư vấn sản phẩm, kiến thức giới tính, tìm cơ sở y tế/bảo trợ)' }])}
                type="button"
              >
                ✨ Đoạn chat mới
              </button>
            )}
            <button className="btn secondary" onClick={() => navigate('/')} type="button">
              Đóng chat
            </button>
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
  );
}
