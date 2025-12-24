import { REGIONS, REGION_ORDER } from '../../utils/constants';

export default function RegionSelector({ currentRegion, onRegionChange }) {
  return (
    <div className="module-panel">
      <div className="module-panel-header">
        <span className="text-label-sm text-muted">Region</span>
      </div>
      <div className="module-panel-content chip-group">
        {REGION_ORDER.map((regionId) => {
          const region = REGIONS[regionId];
          const isActive = currentRegion === regionId;

          return (
            <button
              key={regionId}
              onClick={() => onRegionChange(regionId)}
              className={`chip ${isActive ? 'chip-selected' : ''}`}
              title={region.description}
            >
              {region.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
