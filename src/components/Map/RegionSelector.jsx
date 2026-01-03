import { REGIONS, REGION_ORDER } from '../../utils/constants';

export default function RegionSelector({ currentRegion, onRegionChange }) {
  return (
    <div className="region-selector">
      {REGION_ORDER.map((regionId) => {
        const region = REGIONS[regionId];
        const isActive = currentRegion === regionId;

        return (
          <button
            key={regionId}
            onClick={() => onRegionChange(regionId)}
            className={`region-btn ${isActive ? 'region-btn--active' : ''}`}
            title={region.description}
          >
            {region.name}
          </button>
        );
      })}
    </div>
  );
}
