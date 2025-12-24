import { memo, useMemo } from 'react';
import { ModulePanel, MetricTile, AlertCard } from '../ui';

function Dashboard({
  alerts = [],
  gauges = [],
  tribalData = null,
  loading = false,
  onAlertClick,
  onViewAllAlerts
}) {
  // Compute metrics
  const metrics = useMemo(() => {
    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    const emergencyCount = (alertsByType.EMERGENCY || 0) + (alertsByType.WARNING || 0);
    const watchCount = alertsByType.WATCH || 0;
    const advisoryCount = alertsByType.ADVISORY || 0;

    const floodingGauges = gauges.filter(g =>
      ['major', 'moderate', 'minor'].includes(g.observed?.floodCategory)
    ).length;

    const tribalCount = tribalData?.features?.length || 0;

    return {
      emergencyCount,
      watchCount,
      advisoryCount,
      totalAlerts: alerts.length,
      floodingGauges,
      tribalCount
    };
  }, [alerts, gauges, tribalData]);

  // Get top alerts (emergency/warning first)
  const topAlerts = useMemo(() => {
    return alerts
      .filter(a => ['EMERGENCY', 'WARNING', 'WATCH'].includes(a.severity))
      .slice(0, 3);
  }, [alerts]);

  // Regional summary
  const regionalSummary = useMemo(() => {
    const regions = { WA: 0, OR: 0, ID: 0, BC: 0 };
    alerts.forEach(alert => {
      const area = alert.areaDesc?.toUpperCase() || '';
      if (alert.isCanadian || area.includes('BC') || area.includes('BRITISH')) {
        regions.BC++;
      } else if (area.includes('WA') || area.includes('WASHINGTON')) {
        regions.WA++;
      } else if (area.includes('OR') || area.includes('OREGON')) {
        regions.OR++;
      } else if (area.includes('ID') || area.includes('IDAHO')) {
        regions.ID++;
      }
    });
    return regions;
  }, [alerts]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="module-panel animate-pulse">
          <div className="h-24 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Alert Metrics */}
      <ModulePanel
        title="Active Conditions"
        subtitle="Pacific Northwest Region"
        className="mb-4"
      >
        <div className="metric-grid">
          <MetricTile
            label="Warnings"
            value={metrics.emergencyCount}
            severity={metrics.emergencyCount > 0 ? 'danger' : undefined}
            onClick={metrics.emergencyCount > 0 ? onViewAllAlerts : undefined}
          />
          <MetricTile
            label="Watches"
            value={metrics.watchCount}
            severity={metrics.watchCount > 0 ? 'warning' : undefined}
            onClick={metrics.watchCount > 0 ? onViewAllAlerts : undefined}
          />
          <MetricTile
            label="Advisories"
            value={metrics.advisoryCount}
            severity={metrics.advisoryCount > 0 ? 'info' : undefined}
          />
          <MetricTile
            label="Flood Gauges"
            value={metrics.floodingGauges}
            severity={metrics.floodingGauges > 0 ? 'warning' : 'success'}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" />
              </svg>
            }
          />
        </div>
      </ModulePanel>

      {/* Regional Summary */}
      <ModulePanel title="By Region" className="mb-4">
        <div className="flex gap-3 flex-wrap">
          {Object.entries(regionalSummary).map(([region, count]) => (
            <div
              key={region}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                count > 0 ? 'bg-warning/20 text-warning' : 'bg-white/5 text-muted'
              }`}
            >
              <span className="text-label font-bold">{region}</span>
              <span className="text-headline">{count}</span>
            </div>
          ))}
        </div>
      </ModulePanel>

      {/* Top Alerts */}
      {topAlerts.length > 0 && (
        <ModulePanel
          title="Priority Alerts"
          headerRight={
            <button
              className="btn btn-ghost btn-sm"
              onClick={onViewAllAlerts}
            >
              View All
            </button>
          }
          className="mb-4"
          noPadding
        >
          <div className="divide-y divide-white/10">
            {topAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={onAlertClick}
                compact
              />
            ))}
          </div>
        </ModulePanel>
      )}

      {/* Coverage Info */}
      <ModulePanel title="Coverage" className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-headline">{metrics.tribalCount}</p>
            <p className="text-label-sm text-muted">Tribal Nations Monitored</p>
          </div>
          <div className="text-right">
            <p className="text-body-sm text-muted">WA • OR • ID • BC</p>
            <p className="text-label-sm text-muted">Pacific Northwest Region</p>
          </div>
        </div>
      </ModulePanel>
    </div>
  );
}

export default memo(Dashboard);
