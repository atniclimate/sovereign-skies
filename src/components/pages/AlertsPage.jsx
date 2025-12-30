import { memo, useState, useMemo } from 'react';
import { ModulePanel, AlertCard, FilterRow, SearchInput, DataProvenance } from '../ui';

// Data sources for alerts
const ALERT_SOURCES = [
  'NWS (weather.gov)',
  'Environment Canada'
];

const SEVERITY_FILTERS = [
  { id: 'EMERGENCY', label: 'Emergency', variant: 'danger' },
  { id: 'WARNING', label: 'Warning', variant: 'danger' },
  { id: 'WATCH', label: 'Watch', variant: 'warning' },
  { id: 'ADVISORY', label: 'Advisory', variant: 'info' },
  { id: 'STATEMENT', label: 'Statement', variant: 'default' }
];

const REGION_FILTERS = [
  { id: 'WA', label: 'Washington' },
  { id: 'OR', label: 'Oregon' },
  { id: 'ID', label: 'Idaho' },
  { id: 'BC', label: 'British Columbia' }
];

function AlertsPage({
  alerts = [],
  loading = false,
  lastUpdated = null,
  onRefresh,
  onAlertClick
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilters, setSeverityFilters] = useState([]);
  const [regionFilters, setRegionFilters] = useState([]);

  // Apply filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          alert.event?.toLowerCase().includes(query) ||
          alert.headline?.toLowerCase().includes(query) ||
          alert.areaDesc?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Severity filter
      if (severityFilters.length > 0) {
        if (!severityFilters.includes(alert.severity)) return false;
      }

      // Region filter
      if (regionFilters.length > 0) {
        const area = alert.areaDesc?.toUpperCase() || '';
        const isBC = alert.isCanadian || area.includes('BC') || area.includes('BRITISH');
        const isWA = area.includes('WA') || area.includes('WASHINGTON');
        const isOR = area.includes('OR') || area.includes('OREGON');
        const isID = area.includes('ID') || area.includes('IDAHO');

        const matchesRegion =
          (regionFilters.includes('BC') && isBC) ||
          (regionFilters.includes('WA') && isWA) ||
          (regionFilters.includes('OR') && isOR) ||
          (regionFilters.includes('ID') && isID);

        if (!matchesRegion) return false;
      }

      return true;
    });
  }, [alerts, searchQuery, severityFilters, regionFilters]);

  // Count by severity for filter badges
  const severityFiltersWithCount = useMemo(() => {
    return SEVERITY_FILTERS.map(f => ({
      ...f,
      count: alerts.filter(a => a.severity === f.id).length
    })).filter(f => f.count > 0);
  }, [alerts]);

  const hasActiveFilters = searchQuery || severityFilters.length > 0 || regionFilters.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilters([]);
    setRegionFilters([]);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="alert-card animate-pulse">
            <div className="h-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="alerts-page">
      {/* Search */}
      <div className="p-4 pb-0">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search alerts..."
        />
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3">
        {severityFiltersWithCount.length > 0 && (
          <FilterRow
            filters={severityFiltersWithCount}
            activeFilters={severityFilters}
            onFilterChange={setSeverityFilters}
          />
        )}
        <FilterRow
          filters={REGION_FILTERS}
          activeFilters={regionFilters}
          onFilterChange={setRegionFilters}
        />
      </div>

      {/* Data Provenance */}
      <div className="px-4 pb-3">
        <DataProvenance
          lastUpdated={lastUpdated}
          sources={ALERT_SOURCES}
          isLoading={loading}
          onRefresh={onRefresh}
        />
      </div>

      {/* Results header */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <p className="text-label text-muted">
          {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
          {hasActiveFilters && ' (filtered)'}
        </p>
        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="divide-y divide-white/10">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={onAlertClick}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <p className="text-headline mb-1">
              {hasActiveFilters ? 'No matching alerts' : 'No active alerts'}
            </p>
            <p className="text-body-sm text-muted">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'The Pacific Northwest region is all clear'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AlertsPage);
