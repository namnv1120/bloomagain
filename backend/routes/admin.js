const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  AdminUser,
  Article,
  ArticleProduct,
  ArticleNote,
  Product,
  Facility,
  SupportCenter,
  Suggestion,
  VisitorStat
} = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Helper to sanitize MongoDB documents for client consumption
function cleanDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  return obj;
}

function cleanDocs(docs) {
  return docs.map(cleanDoc);
}

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu username hoặc password' });
  }

  try {
    const user = await AdminUser.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
    }

    const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Apply auth to all routes below ──────────────────────────────────────────
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════════════════

router.get('/articles', async (req, res) => {
  try {
    const articles = await Article.find().sort({ category: 1, createdAt: 1 });
    const notes = await ArticleNote.find();
    const notesMap = Object.fromEntries(notes.map(n => [n.article_cat, n.note]));
    res.json(cleanDocs(articles).map(a => ({ ...a, note: notesMap[a.category] || '' })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/articles', async (req, res) => {
  const { category, title, description } = req.body;
  if (!category || !title || !description) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const result = await Article.create({ category, title, description });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/articles/:id', async (req, res) => {
  const { category, title, description } = req.body;
  try {
    await Article.findByIdAndUpdate(req.params.id, { category, title, description });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/articles/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Article Notes ────────────────────────────────────────────────────────────
router.get('/article-notes', async (req, res) => {
  try {
    const notes = await ArticleNote.find();
    res.json(cleanDocs(notes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/article-notes/:cat', async (req, res) => {
  const { note } = req.body;
  try {
    const existing = await ArticleNote.findOne({ article_cat: req.params.cat });
    if (existing) {
      await ArticleNote.updateOne({ article_cat: req.params.cat }, { note });
    } else {
      await ArticleNote.create({ article_cat: req.params.cat, note });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Article Products ─────────────────────────────────────────────────────────
router.get('/article-products', async (req, res) => {
  try {
    const prods = await ArticleProduct.find().sort({ article_cat: 1, createdAt: 1 });
    res.json(cleanDocs(prods));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/article-products', async (req, res) => {
  const { article_cat, name, price, link } = req.body;
  try {
    const result = await ArticleProduct.create({ article_cat, name, price, link: link || '#' });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/article-products/:id', async (req, res) => {
  const { article_cat, name, price, link } = req.body;
  try {
    await ArticleProduct.findByIdAndUpdate(req.params.id, { article_cat, name, price, link });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/article-products/:id', async (req, res) => {
  try {
    await ArticleProduct.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════

router.get('/products', async (req, res) => {
  try {
    const prods = await Product.find().sort({ category: 1, createdAt: 1 });
    res.json(cleanDocs(prods));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/products', async (req, res) => {
  const { category, name, price, description, link, suggested_categories } = req.body;
  if (!category || !name || !price) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const result = await Product.create({
      category,
      name,
      price,
      description: description || '',
      link: link || '#',
      suggested_categories: suggested_categories || []
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/products/:id', async (req, res) => {
  const { category, name, price, description, link, suggested_categories } = req.body;
  try {
    await Product.findByIdAndUpdate(req.params.id, {
      category,
      name,
      price,
      description,
      link,
      suggested_categories: suggested_categories || []
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// FACILITIES
// ═══════════════════════════════════════════════════════════════════════

router.get('/facilities', async (req, res) => {
  try {
    const rows = await Facility.find().sort({ createdAt: 1 });
    res.json(cleanDocs(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/facilities', async (req, res) => {
  const { name, address, phone, note, region, working_hours, gmaps, svg_type, rating } = req.body;
  if (!name || !address || !region) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const result = await Facility.create({
      name,
      address,
      phone: phone || '',
      note: note || '',
      region,
      working_hours: working_hours || '',
      gmaps: gmaps || '',
      svg_type: svg_type || 'clinic',
      rating: rating || 5
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/facilities/:id', async (req, res) => {
  const { name, address, phone, note, region, working_hours, gmaps, svg_type, rating } = req.body;
  try {
    await Facility.findByIdAndUpdate(req.params.id, {
      name,
      address,
      phone,
      note,
      region,
      working_hours,
      gmaps,
      svg_type,
      rating: rating || 5
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/facilities/:id', async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// SUPPORT CENTERS
// ═══════════════════════════════════════════════════════════════════════

router.get('/support-centers', async (req, res) => {
  try {
    const rows = await SupportCenter.find().sort({ createdAt: 1 });
    res.json(cleanDocs(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/support-centers', async (req, res) => {
  const { name, address, hotline, region, working_hours, gmaps, svg_type, rating, note } = req.body;
  if (!name || !address || !region) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const result = await SupportCenter.create({
      name,
      address,
      hotline: hotline || '',
      region,
      working_hours: working_hours || '',
      gmaps: gmaps || '',
      svg_type: svg_type || 'shelter',
      rating: rating || 5,
      note: note || ''
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/support-centers/:id', async (req, res) => {
  const { name, address, hotline, region, working_hours, gmaps, svg_type, rating, note } = req.body;
  try {
    await SupportCenter.findByIdAndUpdate(req.params.id, {
      name,
      address,
      hotline,
      region,
      working_hours,
      gmaps,
      svg_type,
      rating: rating || 5,
      note: note || ''
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/support-centers/:id', async (req, res) => {
  try {
    await SupportCenter.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════

router.get('/suggestions', async (req, res) => {
  try {
    const rows = await Suggestion.find().sort({ gender: 1, age: 1, createdAt: 1 });
    res.json(cleanDocs(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/suggestions', async (req, res) => {
  const { gender, age, label, icon, category } = req.body;
  if (!gender || !age || !label || !category) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    const result = await Suggestion.create({
      gender,
      age,
      label,
      icon: icon || '💡',
      category
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/admin/reset-db ── XOÁ TOÀN BỘ DB VÀ SEED LẠI (endpoint tạm thời) ──
router.post('/reset-db', async (req, res) => {
  try {
    // Xoá toàn bộ collections (giữ lại AdminUser)
    await Article.deleteMany({});
    await ArticleNote.deleteMany({});
    await ArticleProduct.deleteMany({});
    await Product.deleteMany({});
    await Facility.deleteMany({});
    await SupportCenter.deleteMany({});
    await Suggestion.deleteMany({});
    await VisitorStat.deleteMany({});

    // ── Seed data ──────────────────────────────────────────────────────────
    const staticData = {
      knowledge: {
        'Giáo dục giới tính': {
          note: 'Nền tảng cơ bản để hiểu cơ thể, ranh giới an toàn và cách tìm hỗ trợ đúng cách.',
          products: [
            { name: 'Sách hướng dẫn an toàn tuổi teen', price: '129.000đ', link: '#' },
            { name: 'Poster kiến thức sinh sản', price: '59.000đ', link: '#' }
          ],
          articles: [
            { title: 'Cơ thể thay đổi thế nào trong tuổi dậy thì?', desc: 'Tổng quan các thay đổi thường gặp để teen hiểu giai đoạn phát triển.' },
            { title: 'Ranh giới cá nhân và cách nói không an toàn', desc: 'Học cách nhận biết giới hạn cơ thể và giao tiếp tôn trọng.' }
          ]
        },
        'Tâm sinh lý tuổi dậy thì': {
          note: 'Giai đoạn dao động cảm xúc và hormone là bình thường nhưng cần hiểu đúng.',
          products: [
            { name: 'Nhật ký cảm xúc tuổi teen', price: '79.000đ', link: '#' },
            { name: 'Bộ thẻ tự chăm sóc bản thân', price: '99.000đ', link: '#' }
          ],
          articles: [
            { title: 'Vì sao dễ cáu gắt, buồn bã thất thường?', desc: 'Hormone, áp lực và giấc ngủ tác động trực tiếp tới tâm trạng.' },
            { title: 'Ngủ đủ và vận động nhẹ giúp gì cho hormone?', desc: 'Thói quen nhỏ giúp cơ thể cân bằng trong thời kỳ phát triển.' }
          ]
        },
        'Tâm lý yêu đương tuổi học trò': {
          note: 'Tình cảm tuổi học trò cần đi cùng sự tôn trọng và ranh giới rõ ràng.',
          products: [
            { name: 'Sổ tay giao tiếp trong tình yêu', price: '89.000đ', link: '#' },
            { name: 'Bộ sticker nhắc ranh giới', price: '35.000đ', link: '#' }
          ],
          articles: [
            { title: 'Khi thích một người, mình nên làm gì trước?', desc: 'Nhận diện cảm xúc và nhịp độ phù hợp để không bị áp lực.' },
            { title: 'Làm sao vượt qua cảm giác bị từ chối?', desc: 'Cách tự trấn an và trò chuyện với người tin cậy.' }
          ]
        },
        'Biện pháp tránh thai': {
          note: 'Chọn phương pháp dựa trên độ tuổi, sức khỏe và tư vấn chuyên môn.',
          products: [
            { name: 'Bao cao su tiêu chuẩn', price: '45.000đ', link: '#' },
            { name: 'Bộ nhắc lịch chu kỳ', price: '49.000đ', link: '#' }
          ],
          articles: [
            { title: 'Bao cao su hoạt động như thế nào?', desc: 'Giải thích cơ chế bảo vệ kép để hạn chế rủi ro.' },
            { title: 'Những hiểu lầm phổ biến về tránh thai', desc: 'Phân biệt thông tin đúng sai để tự bảo vệ tốt hơn.' }
          ]
        },
        'Chăm sóc cơ thể': {
          note: 'Chăm sóc cơ thể đúng cách giúp teen thấy thoải mái hơn mỗi ngày.',
          products: [
            { name: 'Sữa tắm dịu nhẹ pH cân bằng', price: '169.000đ', link: '#' },
            { name: 'Dung dịch vệ sinh dịu nhẹ', price: '89.000đ', link: '#' }
          ],
          articles: [
            { title: 'Làm sạch cơ thể thế nào để không gây kích ứng?', desc: 'Chọn sản phẩm dịu nhẹ và quan sát phản ứng cơ thể.' },
            { title: 'Mùi cơ thể ở tuổi teen có đáng lo?', desc: 'Mồ hôi và hormone thay đổi là bình thường nếu biết chăm sóc đúng.' }
          ]
        },
        'Tình dục an toàn': {
          note: 'Ưu tiên đồng thuận, kiến thức và bảo vệ sức khỏe trong mọi quyết định.',
          products: [
            { name: 'Bao cao su latex mỏng', price: '55.000đ', link: '#' },
            { name: 'Gel bôi trơn gốc nước', price: '95.000đ', link: '#' }
          ],
          articles: [
            { title: '3 nguyên tắc cơ bản của tình dục an toàn', desc: 'Đồng thuận rõ ràng và bảo vệ phù hợp là điều bắt buộc.' },
            { title: 'Làm gì khi nghi ngờ có nguy cơ phơi nhiễm?', desc: 'Không hoảng loạn và tìm cơ sở y tế càng sớm càng tốt.' }
          ]
        },
        'Bài tập hỗ trợ (xương, hormone)': {
          note: 'Vận động đúng hỗ trợ xương khớp, giấc ngủ và nội tiết ổn định hơn.',
          products: [
            { name: 'Thảm tập tại nhà', price: '219.000đ', link: '#' },
            { name: 'Dây kháng lực nhẹ', price: '99.000đ', link: '#' }
          ],
          articles: [
            { title: 'Bài tập nhẹ hỗ trợ phát triển xương', desc: 'Động tác kéo giãn và chịu lực vừa phải dễ duy trì hằng ngày.' },
            { title: 'Vận động tác động thế nào đến hormone?', desc: 'Tập đều giúp tinh thần và năng lượng ổn định hơn.' }
          ]
        }
      },
      productCategories: {
        'Sản phẩm giáo dục': [
          { name: 'Sổ tay giới tính tuổi teen', price: '129.000đ', desc: 'Kiến thức giới tính khoa học, ngôn ngữ gần gũi phù hợp lứa tuổi 13–24.', link: '#' },
          { name: 'Bộ thẻ tình huống an toàn', price: '89.000đ', desc: 'Giúp teen nhận biết ranh giới và xử lý tình huống thực tế qua thẻ bài.', link: '#' },
          { name: 'Nhật ký cảm xúc & tự khám phá', price: '75.000đ', desc: 'Sổ tay hướng dẫn viết nhật ký cảm xúc, khám phá bản thân mỗi ngày.', link: '#' }
        ],
        'Sản phẩm vệ sinh': [
          { name: 'Dung dịch vệ sinh dịu nhẹ', price: '89.000đ', desc: 'pH cân bằng, phù hợp dùng hằng ngày.', link: '#' },
          { name: 'Khăn ướt vệ sinh không cồn', price: '49.000đ', desc: 'Tiện lợi khi đi học hoặc đi xa.', link: '#' },
          { name: 'Bọt rửa dịu da nhạy cảm', price: '129.000đ', desc: 'Không hương liệu mạnh, hạn chế kích ứng.', link: '#' }
        ],
        'Sản phẩm tránh thai': [
          { name: 'Bao cao su tiêu chuẩn', price: '45.000đ', desc: 'Chất liệu latex phổ biến, dễ tìm mua.', link: '#' },
          { name: 'Bao cao su mỏng nhẹ', price: '62.000đ', desc: 'Thiết kế mỏng hơn, cảm giác tự nhiên.', link: '#' },
          { name: 'Que thử thai nhanh', price: '28.000đ', desc: 'Dụng cụ kiểm tra nhanh tại nhà.', link: '#' }
        ],
        'Sản phẩm chăm sóc cơ thể': [
          { name: 'Sữa tắm dịu nhẹ', price: '169.000đ', desc: 'Làm sạch nhẹ, giảm khô căng da.', link: '#' },
          { name: 'Lăn khử mùi cho teen', price: '79.000đ', desc: 'Mùi hương nhẹ, dùng đi học hằng ngày.', link: '#' },
          { name: 'Kem dưỡng ẩm phục hồi', price: '189.000đ', desc: 'Hỗ trợ hàng rào bảo vệ da.', link: '#' }
        ]
      },
      healthFacilities: [
        { name: 'Phòng khám Sức khỏe Tuổi Trẻ An Tâm', address: '128 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', phone: '028 39 88 1122', note: 'Thân thiện với teen', region: 'TP. Hồ Chí Minh', working_hours: '08:00 - 18:00 (Thứ 2 - Thứ Bảy)', gmaps: 'https://maps.google.com/?q=Phòng+khám+An+Tâm', svg_type: 'clinic' },
        { name: 'Trung tâm Y khoa Blossom Care', address: '56 Lý Thường Kiệt, Cầu Giấy, Hà Nội', phone: '024 66 29 7788', note: 'Thân thiện với teen', region: 'Hà Nội', working_hours: '08:00 - 20:00 (Tất cả các ngày)', gmaps: 'https://maps.google.com/?q=Blossom+Care', svg_type: 'hospital' },
        { name: 'Phòng khám Dịch vụ An Toàn Xanh', address: '19 Pasteur, Hải Châu, Đà Nẵng', phone: '0236 37 22 911', note: 'Thân thiện với teen', region: 'Đà Nẵng', working_hours: '07:30 - 17:00 (Thứ 2 - Thứ Sáu)', gmaps: 'https://maps.google.com/?q=An+Toàn+Xanh', svg_type: 'medical' }
      ],
      supportCenters: [
        { name: 'Trung tâm Bảo trợ Hoa Nắng', address: '77 Trần Hưng Đạo, Quận 1, TP.HCM', hotline: '1800 1111', region: 'TP. Hồ Chí Minh', working_hours: 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)', gmaps: 'https://maps.google.com/?q=Hoa+Nắng', svg_type: 'shelter' },
        { name: 'Nhà hỗ trợ Trẻ Em Bình Yên', address: '12 Hoàng Diệu, Ba Đình, Hà Nội', hotline: '1800 2222', region: 'Hà Nội', working_hours: 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)', gmaps: 'https://maps.google.com/?q=Bình+Yên', svg_type: 'peace' },
        { name: 'Mái ấm Tuổi Mới', address: '45 Lê Duẩn, Thanh Khê, Đà Nẵng', hotline: '1800 3333', region: 'Đà Nẵng', working_hours: '08:00 - 21:00 (Hàng ngày)', gmaps: 'https://maps.google.com/?q=Tuổi+Mới', svg_type: 'shelter_alt' }
      ],
      suggestions: {
        'Nam': {
          '13-17 tuổi': [
            { label: 'Mộng tinh có phải lo lắng không?', icon: '🤔', category: 'Tâm sinh lý tuổi dậy thì' },
            { label: 'Mụn trứng cá tuổi dậy thì', icon: '💊', category: 'Chăm sóc cơ thể' },
            { label: 'Bạn bè rủ xem phim 18+ thì sao?', icon: '🛡️', category: 'Giáo dục giới tính' }
          ],
          '18-24 tuổi': [
            { label: 'Top 5 bao cao su được mua nhiều nhất', icon: '🏆', category: 'Biện pháp tránh thai' },
            { label: 'Dấu hiệu rối loạn nội tiết ở nam', icon: '⚕️', category: 'Tâm sinh lý tuổi dậy thì' },
            { label: 'Xuất tinh sớm phải làm sao?', icon: '❓', category: 'Tình dục an toàn' }
          ],
          'Khác': [
            { label: 'Kế hoạch hóa gia đình cho nam giới', icon: '👨‍👩‍👦', category: 'Biện pháp tránh thai' },
            { label: 'Quản lý stress & testosterone', icon: '💪', category: 'Bài tập hỗ trợ (xương, hormone)' },
            { label: 'Khám sức khỏe sinh sản định kỳ', icon: '🏥', category: 'Tình dục an toàn' }
          ]
        },
        'Nữ': {
          '13-17 tuổi': [
            { label: 'Kinh nguyệt lần đầu cần chuẩn bị gì?', icon: '🌸', category: 'Chăm sóc cơ thể' },
            { label: 'Đau bụng kinh phải làm gì?', icon: '💊', category: 'Chăm sóc cơ thể' },
            { label: 'Bị trêu chọc về ngoại hình thì sao?', icon: '💬', category: 'Tâm sinh lý tuổi dậy thì' }
          ],
          '18-24 tuổi': [
            { label: 'Trễ kinh 1 tuần có thai không?', icon: '❓', category: 'Biện pháp tránh thai' },
            { label: 'Top 3 dung dịch vệ sinh bác sĩ khuyên dùng', icon: '🏆', category: 'Chăm sóc cơ thể' },
            { label: 'Biện pháp tránh thai phù hợp cho tuổi 18-24', icon: '🛡️', category: 'Biện pháp tránh thai' }
          ],
          'Khác': [
            { label: 'Đặt vòng hay uống thuốc tránh thai?', icon: '💊', category: 'Biện pháp tránh thai' },
            { label: 'PCOS là gì và ảnh hưởng như thế nào?', icon: '⚕️', category: 'Chăm sóc cơ thể' },
            { label: 'Sức khỏe khi mang thai lần đầu', icon: '🤱', category: 'Tình dục an toàn' }
          ]
        },
        'LGBTQ+': {
          '13-17 tuổi': [
            { label: 'Hiểu về bản thân khi mới nhận ra giới tính', icon: '🏳️‍🌈', category: 'Giáo dục giới tính' },
            { label: 'Nói chuyện với bố mẹ về giới tính thế nào?', icon: '💬', category: 'Tâm lý yêu đương tuổi học trò' },
            { label: 'Tìm cộng đồng an toàn online', icon: '🤝', category: 'Giáo dục giới tính' }
          ],
          '18-24 tuổi': [
            { label: 'Sức khoẻ tình dục an toàn cho cộng đồng', icon: '🛡️', category: 'Tình dục an toàn' },
            { label: 'Cơ sở y tế thân thiện với LGBT', icon: '🏥', category: 'Tình dục an toàn' },
            { label: 'Hỗ trợ tâm lý giới tính', icon: '💙', category: 'Tâm sinh lý tuổi dậy thì' }
          ],
          'Khác': [
            { label: 'Quyền của người LGBT tại Việt Nam', icon: '⚖️', category: 'Giáo dục giới tính' },
            { label: 'Hỗ trợ tâm lý cặp đôi cùng giới', icon: '💑', category: 'Tâm lý yêu đương tuổi học trò' },
            { label: 'Chăm sóc sức khoẻ khi sử dụng hormone', icon: '💊', category: 'Chăm sóc cơ thể' }
          ]
        }
      }
    };

    // Seed products
    for (const [cat, prods] of Object.entries(staticData.productCategories)) {
      for (const p of prods) {
        await Product.create({ category: cat, name: p.name, price: p.price, description: p.desc, link: p.link || '#', suggested_categories: [] });
      }
    }

    // Seed articles & notes
    for (const [cat, data] of Object.entries(staticData.knowledge)) {
      for (const art of data.articles) {
        await Article.create({ category: cat, title: art.title, description: art.desc });
      }
      await ArticleNote.create({ article_cat: cat, note: data.note });
    }

    // Seed facilities
    for (const f of staticData.healthFacilities) {
      await Facility.create({ name: f.name, address: f.address, phone: f.phone || '', note: f.note || '', region: f.region, working_hours: f.working_hours, gmaps: f.gmaps || '', svg_type: f.svg_type || 'clinic' });
    }

    // Seed support centers
    for (const c of staticData.supportCenters) {
      await SupportCenter.create({ name: c.name, address: c.address, hotline: c.hotline, region: c.region, working_hours: c.working_hours, gmaps: c.gmaps || '', svg_type: c.svg_type || 'shelter' });
    }

    // Seed suggestions
    for (const [gender, ageGroups] of Object.entries(staticData.suggestions)) {
      for (const [age, items] of Object.entries(ageGroups)) {
        for (const item of items) {
          await Suggestion.create({ gender, age, label: item.label, icon: item.icon || '💡', category: item.category });
        }
      }
    }

    res.json({ success: true, message: '✅ Reset DB và seed lại thành công!' });
  } catch (err) {
    console.error('Reset DB error:', err);
    res.status(500).json({ error: 'Reset thất bại', detail: err.message });
  }
});

router.put('/suggestions/:id', async (req, res) => {
  const { gender, age, label, icon, category } = req.body;
  try {
    await Suggestion.findByIdAndUpdate(req.params.id, {
      gender,
      age,
      label,
      icon,
      category
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/suggestions/:id', async (req, res) => {
  try {
    await Suggestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/admin/stats ── Get visitor onboarding statistics ──────────────────
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalCount = await VisitorStat.countDocuments();

    // Group by gender
    const genderStats = await VisitorStat.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Group by age
    const ageStats = await VisitorStat.aggregate([
      { $group: { _id: '$age', count: { $sum: 1 } } }
    ]);

    // Group by gender and age combination
    const combinedStats = await VisitorStat.aggregate([
      { $group: { _id: { gender: '$gender', age: '$age' }, count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalCount,
      gender: genderStats.map(item => ({ gender: item._id, count: item.count })),
      age: ageStats.map(item => ({ age: item._id, count: item.count })),
      combined: combinedStats.map(item => ({
        gender: item._id.gender,
        age: item._id.age,
        count: item.count
      }))
    });
  } catch (err) {
    console.error('Error fetching visitor stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
