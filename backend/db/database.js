const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bloomagain';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully.');
    // Run one-time migration from ArticleProduct to Product
    try {
      const ArticleProduct = mongoose.model('ArticleProduct');
      const Product = mongoose.model('Product');
      const artProds = await ArticleProduct.find();
      if (artProds.length > 0) {
        console.log(`🌸 Found ${artProds.length} ArticleProducts. Migrating to Product collection...`);
        for (const ap of artProds) {
          const p = await Product.findOne({ name: ap.name });
          if (p) {
            if (!p.suggested_categories.includes(ap.article_cat)) {
              p.suggested_categories.push(ap.article_cat);
              await p.save();
            }
          } else {
            await Product.create({
              category: 'Sản phẩm giáo dục',
              name: ap.name,
              price: ap.price,
              description: 'Sản phẩm gợi ý cho kiến thức',
              link: ap.link || '#',
              suggested_categories: [ap.article_cat]
            });
          }
        }
        await ArticleProduct.deleteMany({});
        console.log('✅ ArticleProducts successfully migrated to Product collection.');
      }
    } catch (err) {
      console.error('❌ Error during ArticleProduct migration:', err);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ─── Schemas ──────────────────────────────────────────────────────────────────

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const articleSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const articleProductSchema = new mongoose.Schema({
  article_cat: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  link: { type: String, default: '#' }
});

const articleNoteSchema = new mongoose.Schema({
  article_cat: { type: String, required: true, unique: true },
  note: { type: String, required: true }
});

const productSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, default: '#' },
  suggested_categories: { type: [String], default: [] }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  note: { type: String },
  region: { type: String, required: true },
  working_hours: { type: String, required: true },
  gmaps: { type: String },
  svg_type: { type: String, default: 'clinic' },
  rating: { type: Number, default: 5 }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const supportCenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  hotline: { type: String, required: true },
  region: { type: String, required: true },
  working_hours: { type: String, required: true },
  gmaps: { type: String },
  svg_type: { type: String, default: 'shelter' },
  rating: { type: Number, default: 5 },
  note: { type: String, default: '' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const suggestionSchema = new mongoose.Schema({
  gender: { type: String, required: true },
  age: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: '💡' },
  category: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const visitorStatSchema = new mongoose.Schema({
  gender: { type: String, required: true },
  age: { type: String, required: true }
}, { 
  timestamps: { createdAt: 'created_at' } 
});

// Compile models
const AdminUser = mongoose.model('AdminUser', adminUserSchema);
const Article = mongoose.model('Article', articleSchema);
const ArticleProduct = mongoose.model('ArticleProduct', articleProductSchema);
const ArticleNote = mongoose.model('ArticleNote', articleNoteSchema);
const Product = mongoose.model('Product', productSchema);
const Facility = mongoose.model('Facility', facilitySchema);
const SupportCenter = mongoose.model('SupportCenter', supportCenterSchema);
const Suggestion = mongoose.model('Suggestion', suggestionSchema);
const VisitorStat = mongoose.model('VisitorStat', visitorStatSchema);

module.exports = {
  mongoose,
  AdminUser,
  Article,
  ArticleProduct,
  ArticleNote,
  Product,
  Facility,
  SupportCenter,
  Suggestion,
  VisitorStat
};
