import { memo } from 'react';

function Chip({
  children,
  variant = 'default',
  size = 'md',
  selected = false,
  onClick,
  onRemove,
  icon,
  className = ''
}) {
  const isClickable = !!onClick;
  const sizeClass = size === 'sm' ? 'chip-sm' : size === 'lg' ? 'chip-lg' : '';
  const variantClass = variant !== 'default' ? `chip-${variant}` : '';
  const selectedClass = selected ? 'chip-selected' : '';

  const content = (
    <>
      {icon && <span className="chip-icon" aria-hidden="true">{icon}</span>}
      <span className="chip-label">{children}</span>
      {onRemove && (
        <button
          className="chip-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        className={`chip ${variantClass} ${sizeClass} ${selectedClass} ${className}`}
        onClick={onClick}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`chip ${variantClass} ${sizeClass} ${selectedClass} ${className}`}>
      {content}
    </span>
  );
}

export default memo(Chip);
