import { useState, useRef, useEffect, useCallback } from 'react';

const SNAP_POINTS = {
  CLOSED: 0,
  PEEK: 120,
  HALF: 50, // percentage
  FULL: 90  // percentage
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
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const currentHeight = useRef(SNAP_POINTS.PEEK);

  // Calculate height based on snap point
  const getHeight = useCallback(() => {
    if (typeof snapPoint === 'number' && snapPoint < 100) {
      return `${snapPoint}px`;
    }
    return `${snapPoint}vh`;
  }, [snapPoint]);

  // Handle drag start
  const handleDragStart = useCallback((clientY) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    currentHeight.current = sheetRef.current?.offsetHeight || SNAP_POINTS.PEEK;
  }, []);

  // Handle drag move
  const handleDragMove = useCallback((clientY) => {
    if (!isDragging) return;
    const delta = dragStartY.current - clientY;
    setDragOffset(delta);
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const windowHeight = window.innerHeight;
    const newHeight = currentHeight.current + dragOffset;
    const heightPercent = (newHeight / windowHeight) * 100;

    // Snap to nearest point
    if (heightPercent < 10) {
      onClose?.();
      setSnapPoint(SNAP_POINTS.PEEK);
    } else if (heightPercent < 35) {
      setSnapPoint(SNAP_POINTS.PEEK);
    } else if (heightPercent < 70) {
      setSnapPoint(SNAP_POINTS.HALF);
    } else {
      setSnapPoint(SNAP_POINTS.FULL);
    }

    setDragOffset(0);
  }, [isDragging, dragOffset, onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers for desktop testing
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

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setSnapPoint(SNAP_POINTS.PEEK);
      setDragOffset(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dynamicHeight = isDragging
    ? `${currentHeight.current + dragOffset}px`
    : getHeight();

  return (
    <>
      {/* Backdrop */}
      {snapPoint !== SNAP_POINTS.PEEK && (
        <div
          className="fixed inset-0 bg-black/30 z-[1100] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[1101] bg-white rounded-t-2xl shadow-2xl transition-[height] ${
          isDragging ? 'transition-none' : 'duration-300 ease-out'
        }`}
        style={{ height: dynamicHeight, maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <h2 id="bottom-sheet-title" className="font-bold text-lg">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Peek content (always visible) */}
        {peekContent && snapPoint === SNAP_POINTS.PEEK && (
          <div className="px-4 py-3">
            {peekContent}
          </div>
        )}

        {/* Full content */}
        {snapPoint !== SNAP_POINTS.PEEK && (
          <div className="flex-1 overflow-y-auto px-4 py-3 pb-safe">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
