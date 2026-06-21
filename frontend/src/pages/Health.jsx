import React from 'react';

export const renderFacilitySvg = (type) => {
  const commonProps = { width: "100%", height: "130", viewBox: "0 0 240 130", style: { borderRadius: '12px', display: 'block' } };
  if (type === 'clinic' || type === 'hospital' || type === 'medical') {
    return (
      <svg {...commonProps}>
        <defs>
          <linearGradient id="medGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d7f1ea" />
            <stop offset="100%" stopColor="#bfead8" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#medGrad)" />
        <circle cx="120" cy="65" r="40" fill="rgba(255, 255, 255, 0.4)" />
        <rect x="105" y="45" width="30" height="40" rx="3" fill="#34a853" opacity="0.15" />
        <path d="M120 50v30M105 65h30" stroke="#34a853" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <defs>
        <linearGradient id="sheGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe1eb" />
          <stop offset="100%" stopColor="#ffb3c6" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sheGrad)" />
      <circle cx="120" cy="65" r="40" fill="rgba(255, 255, 255, 0.4)" />
      <path d="M120 80s-20-13-20-25a10 10 0 0120-5 10 10 0 0120 5c0 12-20 25-20 25z" fill="#e91e63" />
    </svg>
  );
};

export default function Health({
  healthFacilitiesData,
  healthRegionFilter,
  setHealthRegionFilter,
  expandedFacility,
  setExpandedFacility
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [cols, setCols] = React.useState(3);
  const gridRef = React.useRef(null);

  const filteredFacilities = (healthFacilitiesData || []).filter(
    item => healthRegionFilter === 'Tất cả' || item.region === healthRegionFilter
  );
  const selectedItem = filteredFacilities.find(f => f.name === expandedFacility);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [healthRegionFilter]);

  // Update dynamic columns count based on computed CSS Grid layout
  React.useEffect(() => {
    const updateCols = () => {
      if (gridRef.current) {
        const gridComputedStyle = window.getComputedStyle(gridRef.current);
        const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
        const columnCount = gridTemplateColumns.trim().split(/\s+/).length;
        setCols(columnCount || 1);
      }
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    const timer = setTimeout(updateCols, 100);
    return () => {
      window.removeEventListener('resize', updateCols);
      clearTimeout(timer);
    };
  }, [filteredFacilities]);

  const ITEMS_PER_PAGE = 9;
  const totalItems = filteredFacilities.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const displayedFacilities = filteredFacilities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Find selected item index inside displayedFacilities
  const selectedIndex = displayedFacilities.findIndex(item => item.name === expandedFacility);
  // Find which index in the grid we should render the detail panel AFTER
  const insertAfterIndex = selectedIndex !== -1 
    ? Math.min((Math.floor(selectedIndex / cols) + 1) * cols - 1, displayedFacilities.length - 1)
    : -1;

  const renderDetailPanel = () => {
    if (!selectedItem) return null;
    return (
      <div className="facility-detail-panel" key="detail-panel">
        <div className="facility-detail-panel-header">
          <h3>Chi tiết cơ sở: {selectedItem.name}</h3>
          <button className="detail-close-btn" onClick={() => setExpandedFacility(null)}>×</button>
        </div>
        <div className="facility-details-grid">
          <div className="facility-image">
            {selectedItem.imageUrl ? (
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.name} 
                style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '12px', display: 'block' }} 
              />
            ) : (
              renderFacilitySvg(selectedItem.svgType)
            )}
          </div>
          <div className="facility-info-text">
            <p style={{ display: 'flex', margin: '0 0 8px 0', lineHeight: '1.5' }}>
              <strong style={{ minWidth: '110px', flexShrink: 0 }}>Đánh giá:</strong>
              <span style={{ color: '#f1c40f', fontWeight: 700 }}>
                {selectedItem.rating || 5}/5 sao
              </span>
            </p>
            <p style={{ display: 'flex', margin: '8px 0', lineHeight: '1.5' }}>
              <strong style={{ minWidth: '110px', flexShrink: 0 }}>Giờ làm việc:</strong>
              <span>{selectedItem.workingHours}</span>
            </p>
            <p style={{ display: 'flex', margin: '8px 0', lineHeight: '1.5' }}>
              <strong style={{ minWidth: '110px', flexShrink: 0 }}>Điện thoại:</strong>
              <span>{selectedItem.phone}</span>
            </p>
            <p style={{ display: 'flex', margin: '8px 0', lineHeight: '1.5' }}>
              <strong style={{ minWidth: '110px', flexShrink: 0 }}>Địa chỉ:</strong>
              <a
                href={selectedItem.gmaps}
                target="_blank"
                rel="noopener noreferrer"
                className="gmaps-link"
              >
                {selectedItem.address} ↗
              </a>
            </p>
            {selectedItem.website && (
              <p style={{ display: 'flex', margin: '8px 0', lineHeight: '1.5' }}>
                <strong style={{ minWidth: '110px', flexShrink: 0 }}>Website:</strong>
                <a
                  href={selectedItem.website.startsWith('http') ? selectedItem.website : `https://${selectedItem.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gmaps-link"
                  style={{ color: '#b55139', fontWeight: 600 }}
                >
                  {selectedItem.website} ↗
                </a>
              </p>
            )}
            {selectedItem.note && (
              <p style={{ display: 'flex', margin: '12px 0 0 0', paddingTop: '12px', borderTop: '1px dashed #eee', lineHeight: '1.5' }}>
                <strong style={{ minWidth: '110px', flexShrink: 0 }}>Mô tả:</strong>
                <span>{selectedItem.note}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page active">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Cơ sở y tế thân thiện với teen</h2>
            <p>Danh sách minh họa để người dùng tìm nơi hỗ trợ an toàn.</p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="filter-chips">
          {['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((r) => (
            <button
              key={r}
              className={`filter-chip ${healthRegionFilter === r ? 'active' : ''}`}
              onClick={() => {
                setHealthRegionFilter(r);
                setExpandedFacility(null);
              }}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>

        <div className="facilities-grid" ref={gridRef}>
          {displayedFacilities.flatMap((item, idx) => {
            const isSelected = expandedFacility === item.name;
            const cardElement = (
              <div
                key={`card-${idx}`}
                className={`facility-item clickable ${isSelected ? 'selected' : ''}`}
                onClick={() => setExpandedFacility(isSelected ? null : item.name)}
              >
                <div className="facility-item-header">
                  <div className="facility-title-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '10px' }}>
                    <strong style={{ fontSize: '1rem', lineHeight: '1.4' }}>{item.name}</strong>
                    <span style={{ color: '#f1c40f', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                      ⭐ {item.rating || 5}/5
                    </span>
                  </div>
                </div>
              </div>
            );

            if (idx === insertAfterIndex) {
              return [cardElement, renderDetailPanel()];
            }
            return [cardElement];
          })}
        </div>

        {totalPages > 1 && (
          <div className="filter-chips" style={{ justifyContent: 'center', marginTop: '32px' }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`filter-chip ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage(i + 1);
                  setExpandedFacility(null);
                }}
                type="button"
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
