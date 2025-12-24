import { memo, useState } from 'react';
import { ModulePanel } from '../ui';

// Placeholder news data - in production this would come from an API
const STATIC_NEWS = [
  {
    id: '1',
    title: 'NWS Upgrades Pacific Storm Watch',
    summary: 'The National Weather Service has upgraded the storm watch for coastal regions of Washington and Oregon.',
    source: 'NWS Seattle',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'weather',
    urgent: true
  },
  {
    id: '2',
    title: 'River Levels Rising in Skagit Valley',
    summary: 'Recent rainfall has caused river levels to rise. Emergency managers are monitoring conditions.',
    source: 'Skagit County EM',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: 'flood',
    urgent: false
  },
  {
    id: '3',
    title: 'Tribal Emergency Preparedness Workshop',
    summary: 'Upcoming virtual workshop on emergency preparedness for tribal communities.',
    source: 'FEMA Region 10',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'community',
    urgent: false
  }
];

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORY_ICONS = {
  weather: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  flood: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M2 17h20M2 7h20" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

function NewsCard({ item, onClick }) {
  return (
    <button
      className="news-card"
      onClick={() => onClick?.(item)}
    >
      <div className="news-card-icon" aria-hidden="true">
        {CATEGORY_ICONS[item.category] || CATEGORY_ICONS.weather}
      </div>
      <div className="news-card-content">
        <div className="news-card-header">
          {item.urgent && (
            <span className="severity-badge severity-warning text-xs">Urgent</span>
          )}
          <span className="news-card-time">{formatTimestamp(item.timestamp)}</span>
        </div>
        <h3 className="news-card-title">{item.title}</h3>
        <p className="news-card-summary">{item.summary}</p>
        <p className="news-card-source">{item.source}</p>
      </div>
      <div className="news-card-chevron" aria-hidden="true">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

function NewsPage({ onNewsClick }) {
  const [news] = useState(STATIC_NEWS);

  // In production, this would fetch from an API with useEffect

  const urgentNews = news.filter(n => n.urgent);
  const regularNews = news.filter(n => !n.urgent);

  return (
    <div className="news-page">
      {urgentNews.length > 0 && (
        <ModulePanel
          title="Breaking"
          severity="warning"
          className="mb-4"
          noPadding
        >
          <div className="divide-y divide-white/10">
            {urgentNews.map(item => (
              <NewsCard key={item.id} item={item} onClick={onNewsClick} />
            ))}
          </div>
        </ModulePanel>
      )}

      <ModulePanel title="Latest Updates" noPadding>
        {regularNews.length > 0 ? (
          <div className="divide-y divide-white/10">
            {regularNews.map(item => (
              <NewsCard key={item.id} item={item} onClick={onNewsClick} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted">No news updates at this time</p>
          </div>
        )}
      </ModulePanel>

      <div className="p-4 text-center">
        <p className="text-label-sm text-muted">
          News updates are provided for informational purposes.
          <br />
          Always follow official emergency guidance.
        </p>
      </div>
    </div>
  );
}

export default memo(NewsPage);
