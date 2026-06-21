import React from 'react';
import { renderFacilitySvg } from './Health';

export default function Support({
  supportCentersData,
  supportRegionFilter,
  setSupportRegionFilter,
  expandedCenter,
  setExpandedCenter
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [cols, setCols] = React.useState(3);
  const gridRef = React.useRef(null);

  const filteredCenters = (supportCentersData || []).filter(
    item => supportRegionFilter === 'Tất cả' || item.region === supportRegionFilter
  );
  const selectedItem = filteredCenters.find(c => c.name === expandedCenter);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [supportRegionFilter]);

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
  }, [filteredCenters]);

  const ITEMS_PER_PAGE = 9;
  const totalItems = filteredCenters.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const displayedCenters = filteredCenters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Find selected item index inside displayedCenters
  const selectedIndex = displayedCenters.findIndex(item => item.name === expandedCenter);
  // Find which index in the grid we should render the detail panel AFTER
  const insertAfterIndex = selectedIndex !== -1 
    ? Math.min((Math.floor(selectedIndex / cols) + 1) * cols - 1, displayedCenters.length - 1)
    : -1;

  const renderDetailPanel = () => {
    if (!selectedItem) return null;
    return (
      <div className="facility-detail-panel" key="detail-panel">
        <div className="facility-detail-panel-header">
          <h3>Chi tiết trung tâm: {selectedItem.name}</h3>
          <button className="detail-close-btn" onClick={() => setExpandedCenter(null)}>×</button>
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
              <strong style={{ minWidth: '110px', flexShrink: 0 }}>Hotline:</strong>
              <span>{selectedItem.hotline}</span>
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
            <h2>Trung tâm bảo trợ trẻ em</h2>
            <p>Danh sách trung tâm hỗ trợ và số hotline tham khảo.</p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="filter-chips">
          {['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'].map((r) => (
            <button
              key={r}
              className={`filter-chip ${supportRegionFilter === r ? 'active' : ''}`}
              onClick={() => {
                setSupportRegionFilter(r);
                setExpandedCenter(null);
              }}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>

        <div className="facilities-grid" ref={gridRef}>
          {displayedCenters.flatMap((item, idx) => {
            const isSelected = expandedCenter === item.name;
            const cardElement = (
              <div
                key={`card-${idx}`}
                className={`facility-item clickable ${isSelected ? 'selected' : ''}`}
                onClick={() => setExpandedCenter(isSelected ? null : item.name)}
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
                  setExpandedCenter(null);
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
