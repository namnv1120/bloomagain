import React from 'react';

export default function About() {
  return (
    <div className="page active">
      <div className="about-hero">
        <div className="about-hero-text">
          <div className="eyebrow"><img src="/logo.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', verticalAlign: 'middle', marginRight: '4px' }} /> Câu chuyện của chúng tôi</div>
          <h1 className="about-title">Về Bloom Again</h1>
          <p className="about-subtitle">Chúng tôi tin rằng mọi bạn trẻ đều xứng đáng được tiếp cận kiến thức đúng đắn về giới tính và sức khỏe tâm lý, trong một không gian an toàn, thân thiện và không phán xét.</p>
        </div>
        <div className="about-badge-wrap">
          <div className="about-badge"><img src="/logo.png" alt="Bloom Again" style={{ width: '160px', height: '160px', objectFit: 'contain' }} /></div>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-card">
          <h3>Sứ mệnh</h3>
          <p>Cung cấp nền tảng giáo dục giới tính toàn diện, giúp thanh thiếu niên Việt Nam hiểu rõ cơ thể, cảm xúc và quyền của bản thân một cách khoa học và gần gũi.</p>
        </div>
        <div className="about-card">
          <h3>Tầm nhìn</h3>
          <p>Xây dựng thế hệ trẻ Việt tự tin, hiểu biết và có trách nhiệm với bản thân cũng như người xung quanh trong các mối quan hệ và sức khỏe cá nhân.</p>
        </div>
        <div className="about-card">
          <h3>Giá trị cốt lõi</h3>
          <p>An toàn, bảo mật, không phán xét. Mọi thông tin đều được kiểm duyệt bởi chuyên gia y tế và tâm lý học có chứng chỉ.</p>
        </div>
      </div>

      <section className="section about-team-section">
        <div className="section-head">
          <div>
            <h2>Đội ngũ sáng lập</h2>
            <p>Những người đã xây dựng Bloom Again với tâm huyết vì thế hệ trẻ.</p>
          </div>
        </div>
        <div className="team-grid">
          {[
            { name: 'Nguyễn Minh Anh', role: 'Nhà sáng lập & Giám đốc điều hành', emoji: '👩‍💼', desc: 'Chuyên gia tâm lý học lâm sàng với 8 năm kinh nghiệm tư vấn cho thanh thiếu niên.' },
            { name: 'Trần Bảo Long', role: 'Giám đốc Y tế', emoji: '👨‍⚕️', desc: 'Bác sĩ chuyên khoa sản phụ khoa, 10 năm kinh nghiệm giáo dục sức khỏe sinh sản.' },
            { name: 'Lê Thị Hương', role: 'Trưởng phòng Nội dung', emoji: '👩‍🏫', desc: 'Giáo viên và nhà văn, chuyên viết nội dung giáo dục phù hợp với lứa tuổi teen.' },
          ].map((member, idx) => (
            <div key={idx} className="team-card">
              <div className="team-avatar">{member.emoji}</div>
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
          {[
            { num: '10,000+', label: 'Người dùng tin tưởng' },
            { num: '150+', label: 'Bài viết chuyên sâu' },
            { num: '24/7', label: 'AI hỗ trợ liên tục' },
            { num: '100%', label: 'Miễn phí & Ẩn danh' },
          ].map((stat, idx) => (
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
