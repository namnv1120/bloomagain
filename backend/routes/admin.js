const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const {
  AdminUser,
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
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary if env variables exist
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Select storage dynamically based on environment configuration
const storage = process.env.CLOUDINARY_CLOUD_NAME
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'bloomagain_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      }
    })
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ được phép tải tệp tin hình ảnh!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
  const { category, title, description, imageUrl, link, content, isLatest } = req.body;
  if (!category || !title || !description) return res.status(400).json({ error: 'Thiếu thông tin' });
  try {
    if (isLatest) {
      const count = await Article.countDocuments({ isLatest: true });
      if (count >= 3) {
        // Auto-rotate: find and unmark the oldest featured article
        const oldestFeatured = await Article.findOne({ isLatest: true }).sort({ updated_at: 1 });
        if (oldestFeatured) {
          oldestFeatured.isLatest = false;
          await oldestFeatured.save();
        }
      }
    }
    const result = await Article.create({
      category,
      title,
      description,
      imageUrl: imageUrl || '',
      link: link || '',
      content: content || '',
      isLatest: !!isLatest
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/articles/:id', async (req, res) => {
  const { category, title, description, imageUrl, link, content, isLatest } = req.body;
  try {
    if (isLatest) {
      const count = await Article.countDocuments({ isLatest: true, _id: { $ne: req.params.id } });
      if (count >= 3) {
        // Auto-rotate: find and unmark the oldest featured article (excluding the current one)
        const oldestFeatured = await Article.findOne({ isLatest: true, _id: { $ne: req.params.id } }).sort({ updated_at: 1 });
        if (oldestFeatured) {
          oldestFeatured.isLatest = false;
          await oldestFeatured.save();
        }
      }
    }
    await Article.findByIdAndUpdate(req.params.id, {
      category,
      title,
      description,
      imageUrl: imageUrl || '',
      link: link || '',
      content: content || '',
      isLatest: !!isLatest
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const cats = await ArticleCategory.find().sort({ name: 1 });
    res.json(cats.map(c => c.name));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Thiếu tên danh mục' });
  try {
    const trimmed = name.trim();
    const exists = await ArticleCategory.findOne({ name: trimmed });
    if (exists) return res.status(400).json({ error: 'Danh mục đã tồn tại' });
    const newCat = await ArticleCategory.create({ name: trimmed });
    res.json(cleanDoc(newCat));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Upload ──────────────────────────────────────────────────────────────────
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Kích thước ảnh quá lớn! Tối đa là 10MB.' });
      }
      return res.status(400).json({ error: `Lỗi tải ảnh lên: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file để tải lên' });
    }
    // Use Cloudinary URL if available, otherwise construct local web URL
    const fileUrl = process.env.CLOUDINARY_CLOUD_NAME
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
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
  const { name, address, phone, note, region, working_hours, gmaps, svg_type, rating, imageUrl, website } = req.body;
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
      rating: rating || 5,
      imageUrl: imageUrl || '',
      website: website || ''
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/facilities/:id', async (req, res) => {
  const { name, address, phone, note, region, working_hours, gmaps, svg_type, rating, imageUrl, website } = req.body;
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
      rating: rating || 5,
      imageUrl: imageUrl || '',
      website: website || ''
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
  const { name, address, hotline, region, working_hours, gmaps, svg_type, rating, note, imageUrl, website } = req.body;
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
      note: note || '',
      imageUrl: imageUrl || '',
      website: website || ''
    });
    res.json(cleanDoc(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/support-centers/:id', async (req, res) => {
  const { name, address, hotline, region, working_hours, gmaps, svg_type, rating, note, imageUrl, website } = req.body;
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
      note: note || '',
      imageUrl: imageUrl || '',
      website: website || ''
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

// ═══════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/about-page — return the single about doc (or defaults)
router.get('/about-page', async (req, res) => {
  try {
    let doc = await AboutPage.findOne();
    if (!doc) {
      // First-time: seed default data
      doc = await AboutPage.create({
        teamMembers: [
          { name: 'Nguyễn Minh Anh', role: 'Nhà sáng lập & Giám đốc điều hành', emoji: '👩‍💼', desc: 'Chuyên gia tâm lý học lâm sàng với 8 năm kinh nghiệm tư vấn cho thanh thiếu niên.' },
          { name: 'Trần Bảo Long', role: 'Giám đốc Y tế', emoji: '👨‍⚕️', desc: 'Bác sĩ chuyên khoa sản phụ khoa, 10 năm kinh nghiệm giáo dục sức khỏe sinh sản.' },
          { name: 'Lê Thị Hương', role: 'Trưởng phòng Nội dung', emoji: '👩‍🏫', desc: 'Giáo viên và nhà văn, chuyên viết nội dung giáo dục phù hợp với lứa tuổi teen.' }
        ],
        stats: [
          { num: '10,000+', label: 'Người dùng tin tưởng' },
          { num: '150+', label: 'Bài viết chuyên sâu' },
          { num: '24/7', label: 'AI hỗ trợ liên tục' },
          { num: '100%', label: 'Miễn phí & Ẩn danh' }
        ]
      });
    }
    res.json(cleanDoc(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/about-page — upsert the single about doc
router.put('/about-page', async (req, res) => {
  try {
    const data = req.body;
    let doc = await AboutPage.findOne();
    if (doc) {
      await AboutPage.findByIdAndUpdate(doc._id, data);
    } else {
      await AboutPage.create(data);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
