import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

const DEFAULT_DATA = {
  eyebrow: 'Câu chuyện của chúng tôi',
  heroTitle: 'Về Bloom Again',
  heroSubtitle: 'Chúng tôi tin rằng mọi bạn trẻ đều xứng đáng được tiếp cận kiến thức đúng đắn về giới tính và sức khỏe tâm lý, trong một không gian an toàn, thân thiện và không phán xét.',
  missionTitle: 'Sứ mệnh',
  missionText: 'Cung cấp nền tảng giáo dục giới tính toàn diện, giúp thanh thiếu niên Việt Nam hiểu rõ cơ thể, cảm xúc và quyền của bản thân một cách khoa học và gần gũi.',
  visionTitle: 'Tầm nhìn',
  visionText: 'Xây dựng thế hệ trẻ Việt tự tin, hiểu biết và có trách nhiệm với bản thân cũng như người xung quanh trong các mối quan hệ và sức khỏe cá nhân.',
  valuesTitle: 'Giá trị cốt lõi',
  valuesText: 'An toàn, bảo mật, không phán xét. Mọi thông tin đều được kiểm duyệt bởi chuyên gia y tế và tâm lý học có chứng chỉ.',
  teamSectionTitle: 'Đội ngũ sáng lập',
  teamSectionSubtitle: 'Những người đã xây dựng Bloom Again với tâm huyết vì thế hệ trẻ.',
  teamMembers: [
    { name: 'Nguyễn Minh Anh', role: 'Nhà sáng lập & Giám đốc điều hành', imageUrl: '', emoji: '👩‍💼', desc: 'Chuyên gia tâm lý học lâm sàng với 8 năm kinh nghiệm tư vấn cho thanh thiếu niên.' },
    { name: 'Trần Bảo Long', role: 'Giám đốc Y tế', imageUrl: '', emoji: '👨‍⚕️', desc: 'Bác sĩ chuyên khoa sản phụ khoa, 10 năm kinh nghiệm giáo dục sức khỏe sinh sản.' },
    { name: 'Lê Thị Hương', role: 'Trưởng phòng Nội dung', imageUrl: '', emoji: '👩‍🏫', desc: 'Giáo viên và nhà văn, chuyên viết nội dung giáo dục phù hợp với lứa tuổi teen.' },
  ],
  stats: [
    { num: '10,000+', label: 'Người dùng tin tưởng' },
    { num: '150+', label: 'Bài viết chuyên sâu' },
    { num: '24/7', label: 'AI hỗ trợ liên tục' },
    { num: '100%', label: 'Miễn phí & Ẩn danh' },
  ],
};

export default function About() {
  const [pageData, setPageData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetch(`${API_BASE}/api/about-page`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          // Merge với default để đảm bảo luôn có dữ liệu fallback
          setPageData(prev => ({
            ...prev,
            ...d,
            teamMembers: d.teamMembers && d.teamMembers.length > 0 ? d.teamMembers : prev.teamMembers,
            stats: d.stats && d.stats.length > 0 ? d.stats : prev.stats,
          }));
        }
      })
      .catch(() => { /* Giữ nguyên dữ liệu mặc định nếu lỗi */ });
  }, []);

  return (
    <div className="page active">
      <div className="about-hero">
        <div className="about-hero-text">
          <div className="eyebrow">
            <img src="/logo-nen.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle', marginRight: '6px' }} />
            {pageData.eyebrow}
          </div>
          <h1 className="about-title">{pageData.heroTitle}</h1>
          <p className="about-subtitle">{pageData.heroSubtitle}</p>
        </div>
        <div className="about-badge-wrap">
          <div className="about-badge"><img src="/logo.png" alt="Bloom Again" style={{ width: '240px', height: '240px', objectFit: 'contain' }} /></div>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <h3>{pageData.missionTitle}</h3>
          <p>{pageData.missionText}</p>
        </div>
        <div className="about-card">
          <h3>{pageData.visionTitle}</h3>
          <p>{pageData.visionText}</p>
        </div>
        <div className="about-card">
          <h3>{pageData.valuesTitle}</h3>
          <p>{pageData.valuesText}</p>
        </div>
      </div>

      <section className="section about-team-section">
        <div className="section-head">
          <div>
            <h2>{pageData.teamSectionTitle}</h2>
            <p>{pageData.teamSectionSubtitle}</p>
          </div>
        </div>
        <div className="team-grid">
          {pageData.teamMembers.map((member, idx) => (
            <div key={idx} className="team-card">
              <div className="team-avatar" style={{ borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {member.imageUrl ? (
                  <img src={member.imageUrl.startsWith('http') ? member.imageUrl : API_BASE + member.imageUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  member.emoji || '👤'
                )}
              </div>
              <div className="team-info">
                <strong>{member.name}</strong>
                <span className="team-role">{member.role}</span>
                <p>{member.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section about-stats-section">
        <div className="stats-grid">
          {pageData.stats.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <span className="stat-num">{stat.num}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
