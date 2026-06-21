const express = require('express');
const router = express.Router();
const {
  Article,
  ArticleCategory,
  ArticleProduct,
  ArticleNote,
  Product,
  Facility,
  SupportCenter,
  Suggestion,
  VisitorStat,
  AboutPage
} = require('../db/database');

// ─── GET /api/categories ── Danh sách các danh mục bài viết ─────────────────
router.get('/categories', async (req, res) => {
  try {
    const cats = await ArticleCategory.find().sort({ name: 1 });
    res.json(cats.map(c => c.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/knowledge ── Tất cả categories + articles + products + notes ───
router.get('/knowledge', async (req, res) => {
  try {
    const categories = await ArticleCategory.find().sort({ name: 1 });
    const articles = await Article.find().sort({ category: 1, createdAt: 1 });
    const products = await Product.find({ suggested_categories: { $exists: true, $not: { $size: 0 } } });
    const artNotes = await ArticleNote.find();

    // Group by category, initialized with db categories
    const result = {};
    for (const cat of categories) {
      result[cat.name] = { articles: [], products: [], note: '' };
    }

    for (const art of articles) {
      if (!result[art.category]) {
        result[art.category] = { articles: [], products: [], note: '' };
      }
      result[art.category].articles.push({
        title: art.title,
        desc: art.description,
        imageUrl: art.imageUrl || '',
        link: art.link || '',
        content: art.content || ''
      });
    }
    for (const prod of products) {
      for (const cat of prod.suggested_categories || []) {
        if (!result[cat]) {
          result[cat] = { articles: [], products: [], note: '' };
        }
        result[cat].products.push({
          name: prod.name,
          price: prod.price,
          link: prod.link,
          desc: prod.description || ''
        });
      }
    }
    for (const note of artNotes) {
      if (result[note.article_cat]) {
        result[note.article_cat].note = note.note;
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/products ── Tất cả product categories ──────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ category: 1, createdAt: 1 });
    const result = {};
    for (const p of products) {
      if (!result[p.category]) result[p.category] = [];
      result[p.category].push({ name: p.name, price: p.price, desc: p.description, link: p.link });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/facilities ─────────────────────────────────────────────────────
router.get('/facilities', async (req, res) => {
  try {
    const rows = await Facility.find().sort({ createdAt: 1 });
    const facilities = rows.map(f => ({
      name: f.name,
      address: f.address,
      phone: f.phone,
      note: f.note,
      region: f.region,
      workingHours: f.working_hours,
      gmaps: f.gmaps,
      svgType: f.svg_type,
      rating: f.rating || 5,
      imageUrl: f.imageUrl || '',
      website: f.website || ''
    }));
    res.json(facilities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/support-centers ────────────────────────────────────────────────
router.get('/support-centers', async (req, res) => {
  try {
    const rows = await SupportCenter.find().sort({ createdAt: 1 });
    const centers = rows.map(c => ({
      name: c.name,
      address: c.address,
      hotline: c.hotline,
      region: c.region,
      workingHours: c.working_hours,
      gmaps: c.gmaps,
      svgType: c.svg_type,
      rating: c.rating || 5,
      note: c.note || '',
      imageUrl: c.imageUrl || '',
      website: c.website || ''
    }));
    res.json(centers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/suggestions?gender=Nam&age=18-24 tuổi ─────────────────────────
router.get('/suggestions', async (req, res) => {
  try {
    const { gender, age } = req.query;
    if (!gender || !age) {
      return res.json([]);
    }
    const rows = await Suggestion.find({ gender, age }).sort({ createdAt: 1 });
    const result = rows.map(r => ({
      id: r._id.toString(),
      gender: r.gender,
      age: r.age,
      label: r.label,
      icon: r.icon,
      category: r.category,
      created_at: r.created_at
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/stats ── Record visitor gender and age selection ──────────────────
router.post('/stats', async (req, res) => {
  try {
    const { gender, age } = req.body;
    if (!gender || !age) {
      return res.status(400).json({ error: 'Gender and Age are required' });
    }
    const stat = new VisitorStat({ gender, age });
    await stat.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving visitor stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/about-page ── Public: Lấy nội dung trang Về chúng tôi ────────────────
router.get('/about-page', async (req, res) => {
  try {
    let doc = await AboutPage.findOne();
    if (!doc) {
      // Fallback: trả về dữ liệu mặc định nếu chưa có trong DB
      return res.json({
        eyebrow: 'Câu chuyện của chúng tôi',
        heroTitle: 'Về Bloom Again',
        heroSubtitle: 'Chúng tôi tin rằng mọi bạn trẻ đều xứng đáng được tiếp cận kiến thức đúng đắn về giới tính và sức khỏe tâm lý, trong một không gian an toàn, thân thiện và không phán xét.',
        missionTitle: 'Sứ mệnh', missionText: 'Cung cấp nền tảng giáo dục giới tính toàn diện.',
        visionTitle: 'Tầm nhìn', visionText: 'Xây dựng thế hệ trẻ Việt tự tin, hiểu biết.',
        valuesTitle: 'Giá trị cốt lõi', valuesText: 'An toàn, bảo mật, không phán xét.',
        teamSectionTitle: 'Đội ngũ sáng lập',
        teamSectionSubtitle: 'Những người đã xây dựng Bloom Again với tâm huyết vì thế hệ trẻ.',
        teamMembers: [
          { name: 'Nguyễn Minh Anh', role: 'Nhà sáng lập & Giám đốc điều hành', emoji: '👩‍💼', desc: 'Chuyên gia tâm lý học lâm sàng với 8 năm kinh nghiệm.' },
          { name: 'Trần Bảo Long', role: 'Giám đốc Y tế', emoji: '👨‍⚕️', desc: 'Bác sĩ chuyên khoa sản phụ khoa, 10 năm kinh nghiệm.' },
          { name: 'Lê Thị Hương', role: 'Trưởng phòng Nội dung', emoji: '👩‍🏫', desc: 'Giáo viên và nhà văn, chuyên viết nội dung giáo dục.' }
        ],
        stats: [
          { num: '10,000+', label: 'Người dùng tin tưởng' },
          { num: '150+', label: 'Bài viết chuyên sâu' },
          { num: '24/7', label: 'AI hỗ trợ liên tục' },
          { num: '100%', label: 'Miễn phí & Ẩn danh' }
        ]
      });
    }
    const obj = doc.toObject();
    if (obj._id) { obj.id = obj._id.toString(); delete obj._id; }
    delete obj.__v;
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
