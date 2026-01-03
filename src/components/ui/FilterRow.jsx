import { memo } from 'react';
import Chip from './Chip';

function FilterRow({
  filters,
  activeFilters = [],
  onFilterChange,
  multiSelect = true,
  className = ''
}) {
  const handleFilterClick = (filterId) => {
    if (multiSelect) {
      if (activeFilters.includes(filterId)) {
        onFilterChange(activeFilters.filter(f => f !== filterId));
      } else {
        onFilterChange([...activeFilters, filterId]);
      }
    } else {
      onFilterChange(activeFilters.includes(filterId) ? [] : [filterId]);
    }
  };

  return (
    <div className={`filter-row ${className}`} role="group" aria-label="Filters">
      {filters.map((filter) => (
        <Chip
          key={filter.id}
          variant={filter.variant}
          selected={activeFilters.includes(filter.id)}
          onClick={() => handleFilterClick(filter.id)}
          icon={filter.icon}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-1 opacity-70">({filter.count})</span>
          )}
        </Chip>
      ))}
    </div>
  );
}

export default memo(FilterRow);
