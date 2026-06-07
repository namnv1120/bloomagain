/**
 * Seed script: Import staticData vào MongoDB
 * Chạy một lần: node db/seed.js
 */
const bcrypt = require('bcryptjs');
const {
  mongoose,
  AdminUser,
  Article,
  ArticleProduct,
  ArticleNote,
  Product,
  Facility,
  SupportCenter,
  Suggestion
} = require('./database');

// ─── Static Data (copy từ frontend) ──────────────────────────────────────────
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
    { name: 'Phòng khám Sức khỏe Tuổi Trẻ An Tâm', address: '128 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', phone: '028 39 88 1122', note: 'Thân thiện với teen', region: 'TP. Hồ Chí Minh', workingHours: '08:00 - 18:00 (Thứ 2 - Thứ Bảy)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Phòng+khám+Sức+khỏe+Tuổi+Trẻ+An+Tâm', svgType: 'clinic' },
    { name: 'Trung tâm Y khoa Blossom Care', address: '56 Lý Thường Kiệt, Cầu Giấy, Hà Nội', phone: '024 66 29 7788', note: 'Thân thiện với teen', region: 'Hà Nội', workingHours: '08:00 - 20:00 (Tất cả các ngày)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Trung+tâm+Y+khoa+Blossom+Care', svgType: 'hospital' },
    { name: 'Phòng khám Dịch vụ An Toàn Xanh', address: '19 Pasteur, Hải Châu, Đà Nẵng', phone: '0236 37 22 911', note: 'Thân thiện với teen', region: 'Đà Nẵng', workingHours: '07:30 - 17:00 (Thứ 2 - Thứ Sáu)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Phòng+khám+Dịch+vụ+An+Toàn+Xanh', svgType: 'medical' }
  ],
  supportCenters: [
    { name: 'Trung tâm Bảo trợ Hoa Nắng', address: '77 Trần Hưng Đạo, Quận 1, TP.HCM', hotline: '1800 1111', region: 'TP. Hồ Chí Minh', workingHours: 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Trung+tâm+Bảo+trợ+Hoa+Nắng', svgType: 'shelter' },
    { name: 'Nhà hỗ trợ Trẻ Em Bình Yên', address: '12 Hoàng Diệu, Ba Đình, Hà Nội', hotline: '1800 2222', region: 'Hà Nội', workingHours: 'Hỗ trợ 24/7 (Đường dây nóng miễn phí)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Nhà+hỗ+trợ+Trẻ+Em+Bình+Yên', svgType: 'peace' },
    { name: 'Mái ấm Tuổi Mới', address: '45 Lê Duẩn, Thanh Khê, Đà Nẵng', hotline: '1800 3333', region: 'Đà Nẵng', workingHours: '08:00 - 21:00 (Hàng ngày)', gmaps: 'https://www.google.com/maps/dir/?api=1&destination=Mái+ấm+Tuổi+Mới', svgType: 'shelter_alt' }
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

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedAll() {
  console.log('🌱 Bắt đầu seed database MongoDB...');

  try {
    // Admin user
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hash = bcrypt.hashSync('admin123', 10);
      await AdminUser.create({ username: 'admin', password: hash });
      console.log('✅ Tạo admin user: admin / admin123');
    } else {
      console.log('ℹ️  Admin user đã tồn tại, bỏ qua.');
    }

    // Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      for (const [cat, prods] of Object.entries(staticData.productCategories)) {
        for (const p of prods) {
          await Product.create({ category: cat, name: p.name, price: p.price, description: p.desc, link: p.link || '#', suggested_categories: [] });
        }
      }
      console.log('✅ Seed products xong');
    } else {
      console.log('ℹ️  Products đã có dữ liệu, bỏ qua.');
    }

    // Articles (knowledge)
    const articleCount = await Article.countDocuments();
    if (articleCount === 0) {
      for (const [cat, data] of Object.entries(staticData.knowledge)) {
        for (const art of data.articles) {
          await Article.create({ category: cat, title: art.title, description: art.desc });
        }
        for (const prod of data.products) {
          const existingProd = await Product.findOne({ name: prod.name });
          if (existingProd) {
            if (!existingProd.suggested_categories.includes(cat)) {
              existingProd.suggested_categories.push(cat);
              await existingProd.save();
            }
          } else {
            await Product.create({
              category: 'Sản phẩm giáo dục',
              name: prod.name,
              price: prod.price,
              description: 'Sản phẩm gợi ý cho kiến thức',
              link: prod.link || '#',
              suggested_categories: [cat]
            });
          }
        }
        await ArticleNote.create({ article_cat: cat, note: data.note });
      }
      console.log('✅ Seed articles/knowledge xong');
    } else {
      console.log('ℹ️  Articles đã có dữ liệu, bỏ qua.');
    }

    // Health Facilities
    const facilityCount = await Facility.countDocuments();
    if (facilityCount === 0) {
      for (const f of staticData.healthFacilities) {
        await Facility.create({
          name: f.name,
          address: f.address,
          phone: f.phone,
          note: f.note || '',
          region: f.region,
          working_hours: f.workingHours,
          gmaps: f.gmaps || '',
          svg_type: f.svgType || 'clinic'
        });
      }
      console.log('✅ Seed facilities xong');
    } else {
      console.log('ℹ️  Facilities đã có dữ liệu, bỏ qua.');
    }

    // Support Centers
    const centerCount = await SupportCenter.countDocuments();
    if (centerCount === 0) {
      for (const c of staticData.supportCenters) {
        await SupportCenter.create({
          name: c.name,
          address: c.address,
          hotline: c.hotline,
          region: c.region,
          working_hours: c.workingHours,
          gmaps: c.gmaps || '',
          svg_type: c.svgType || 'shelter'
        });
      }
      console.log('✅ Seed support centers xong');
    } else {
      console.log('ℹ️  Support centers đã có dữ liệu, bỏ qua.');
    }

    // Suggestions
    const suggestionCount = await Suggestion.countDocuments();
    if (suggestionCount === 0) {
      for (const [gender, ageGroups] of Object.entries(staticData.suggestions)) {
        for (const [age, items] of Object.entries(ageGroups)) {
          for (const item of items) {
            await Suggestion.create({
              gender,
              age,
              label: item.label,
              icon: item.icon || '💡',
              category: item.category
            });
          }
        }
      }
      console.log('✅ Seed suggestions xong');
    } else {
      console.log('ℹ️  Suggestions đã có dữ liệu, bỏ qua.');
    }

    console.log('\n🎉 Seed hoàn tất! Database sẵn sàng.');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedAll();
