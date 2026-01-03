import { useState, useRef, useEffect, useCallback } from 'react';

const SNAP_POINTS = {
  CLOSED: 0,
  PEEK: 140,
  HALF: 50,
  FULL: 85
};

export default function BottomSheet({
  children,
  isOpen,
  onClose,
  title = 'Details',
  peekContent
}) {
  const [snapPoint, setSnapPoint] = useState(SNAP_POINTS.PEEK);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(SNAP_POINTS.PEEK);
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);

  const getHeight = useCallback(() => {
    if (typeof snapPoint === 'number' && snapPoint < 100) {
      return `${snapPoint}px`;
    }
    return `${snapPoint}vh`;
  }, [snapPoint]);

  const handleDragStart = useCallback((clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    setDragStartHeight(sheetRef.current?.offsetHeight || SNAP_POINTS.PEEK);
  }, []);

  const handleDragMove = useCallback((clientY) => {
    if (!isDragging) return;
    const delta = dragStartY.current - clientY;
    setDragOffset(delta);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const windowHeight = window.innerHeight;
    const newHeight = dragStartHeight + dragOffset;
    const heightPercent = (newHeight / windowHeight) * 100;

    if (heightPercent < 8) {
      onClose?.();
      setSnapPoint(SNAP_POINTS.PEEK);
    } else if (heightPercent < 30) {
      setSnapPoint(SNAP_POINTS.PEEK);
    } else if (heightPercent < 65) {
      setSnapPoint(SNAP_POINTS.HALF);
    } else {
      setSnapPoint(SNAP_POINTS.FULL);
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, dragStartHeight, onClose]);

  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseDown = useCallback((e) => {
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (!isOpen) {
      // Defer state reset to avoid synchronous setState in effect
      const id = setTimeout(() => {
        setSnapPoint(SNAP_POINTS.PEEK);
        setDragOffset(0);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dynamicHeight = isDragging
    ? `${dragStartHeight + dragOffset}px`
    : getHeight();

  const isExpanded = snapPoint !== SNAP_POINTS.PEEK;

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="bottom-sheet-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isDragging ? 'bottom-sheet-dragging' : ''}`}
        style={{ height: dynamicHeight }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Drag handle */}
        <div
          className="bottom-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="bottom-sheet-handle-bar" />
        </div>

        {/* Header */}
        <div className="bottom-sheet-header">
          <h2 id="bottom-sheet-title" className="text-headline font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="bottom-sheet-close"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Peek content */}
        {peekContent && snapPoint === SNAP_POINTS.PEEK && (
          <div className="bottom-sheet-peek">
            {peekContent}
          </div>
        )}

        {/* Full content */}
        {isExpanded && (
          <div className="bottom-sheet-content">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
