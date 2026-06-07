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
