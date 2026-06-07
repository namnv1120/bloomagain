const express = require('express');
const router = express.Router();
const {
  Article,
  ArticleProduct,
  ArticleNote,
  Product,
  Facility,
  SupportCenter,
  Suggestion
} = require('../db/database');

// ─── GET /api/knowledge ── Tất cả categories + articles + products + notes ───
router.get('/knowledge', async (req, res) => {
  try {
    const articles = await Article.find().sort({ category: 1, createdAt: 1 });
    const artProducts = await ArticleProduct.find().sort({ article_cat: 1 });
    const artNotes = await ArticleNote.find();

    // Group by category
    const result = {};
    for (const art of articles) {
      if (!result[art.category]) {
        result[art.category] = { articles: [], products: [], note: '' };
      }
      result[art.category].articles.push({ title: art.title, desc: art.description });
    }
    for (const prod of artProducts) {
      if (result[prod.article_cat]) {
        result[prod.article_cat].products.push({ name: prod.name, price: prod.price, link: prod.link });
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
      svgType: f.svg_type
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
      svgType: c.svg_type
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

module.exports = router;
