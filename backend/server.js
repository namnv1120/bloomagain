const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Keyword fallback logic replicated from frontend to keep it clean
const staticSuggestions = {
  Nam: [
    'Top 5 bao cao su được mua nhiều nhất',
    'Dấu hiệu rối loạn nội tiết ở nam',
    'Xuất tinh sớm phải làm sao?'
  ],
  Nữ: [
    'Trễ kinh 1 tuần có thai không?',
    'Top 3 dung dịch vệ sinh bác sĩ khuyên dùng',
    '10 biểu hiện rối loạn nội tiết tố'
  ],
  'LGBTQ+': [
    'Sức khỏe tình dục an toàn cho cộng đồng',
    'Hỗ trợ tâm lý giới tính',
    'Cơ sở y tế thân thiện với LGBT'
  ]
};

function handleKeyword(message) {
  const text = message.toLowerCase();
  if (text.includes('sản phẩm vệ sinh')) {
    return { action: 'redirect', target: 'products', category: 'Sản phẩm vệ sinh', reply: 'Mình đã mở trang Sản phẩm tại nhóm Sản phẩm vệ sinh cho bạn.' };
  }
  if (text.includes('sản phẩm tránh thai') || text.includes('bao cao su')) {
    return { action: 'redirect', target: 'products', category: 'Sản phẩm tránh thai', reply: 'Mình đã mở nhóm Sản phẩm tránh thai. Bạn có thể xem thêm bao cao su và sản phẩm liên quan.' };
  }
  if (text.includes('sản phẩm chăm sóc cơ thể')) {
    return { action: 'redirect', target: 'products', category: 'Sản phẩm chăm sóc cơ thể', reply: 'Mình đã mở trang Sản phẩm tại nhóm Sản phẩm chăm sóc cơ thể cho bạn.' };
  }
  if (text.includes('mang thai ngoài ý muốn')) {
    return { reply: 'Mình hiểu đây là tình huống dễ lo lắng. Hãy hít thở chậm và cân nhắc liên hệ trung tâm tư vấn hoặc cơ sở y tế sớm để được hướng dẫn an toàn.' };
  }
  if (text.includes('cơ sở y tế')) {
    return { action: 'redirect', target: 'health', reply: 'Mình đã mở trang Cơ sở y tế cho bạn. Bạn có thể tham khảo một số địa chỉ thân thiện gần nhất.' };
  }
  if (text.includes('bảo trợ trẻ em') || text.includes('bảo hộ trẻ em')) {
    return { action: 'redirect', target: 'support', reply: 'Mình đã mở trang Trung tâm bảo hộ trẻ em cho bạn. Hãy gọi các số hotline để được trợ giúp khẩn cấp.' };
  }
  if (text.includes('rối loạn nội tiết')) {
    return { reply: 'Rối loạn nội tiết có thể liên quan đến giấc ngủ, stress hoặc dinh dưỡng. Nếu kéo dài, bạn nên đi khám để có tư vấn phù hợp.' };
  }
  return { reply: 'Bạn có thể hỏi mình về: sản phẩm vệ sinh, sản phẩm tránh thai, sản phẩm chăm sóc cơ thể, cơ sở y tế, bảo hộ trẻ em.' };
}

app.post('/api/chat', async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check if NotebookLM Gateway is available
  const notebookUrl = process.env.NOTEBOOKLM_GATEWAY_URL || 'http://localhost:3001/api/ask';
  const useNotebookLM = process.env.USE_NOTEBOOKLM === 'true';

  if (useNotebookLM) {
    try {
      const response = await fetch(notebookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return res.json({ reply: data.answer });
        }
      }
    } catch (err) {
      console.warn('NotebookLM Gateway unavailable, falling back...');
    }
  }

  // Otherwise check for Groq API
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (groqKey) {
    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      
      // Map chat history to OpenAI/Groq format
      const messages = [
        { role: 'system', content: process.env.SYSTEM_PROMPT || 'You are Bloom, a helpful assistant. Reply in Vietnamese.' }
      ];

      (chatHistory || []).forEach(msg => {
        // Exclude system instructions or offline notes in history if any
        if (!msg.content.startsWith('[Lỗi hệ thống]') && !msg.content.startsWith('[Chế độ offline]')) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });

      messages.push({ role: 'user', content: message });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: groqModel,
          messages,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return res.json({ reply });
        }
      } else {
        const errText = await response.text();
        console.error('Groq error:', errText);
      }
    } catch (err) {
      console.error('Groq call failed:', err);
    }
  }

  // Final keyword fallback
  const fallback = handleKeyword(message);
  return res.json({
    reply: `[Chế độ offline] ${fallback.reply}`,
    action: fallback.action,
    target: fallback.target,
    category: fallback.category
  });
});

// Serve frontend build files in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback index.html routing for SPA navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
