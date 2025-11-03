import { useEffect, useRef, useState, ReactNode } from 'react';
import { ChevronUp } from 'lucide-react';

export type BottomSheetState = 'collapsed' | 'half' | 'full';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  state: BottomSheetState;
  onStateChange: (state: BottomSheetState) => void;
  collapsedHeight?: number;
  halfHeight?: number;
}

export function BottomSheet({
  isOpen,
  children,
  title,
  state,
  onStateChange,
  collapsedHeight = 80,
  halfHeight = 300,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const getHeight = () => {
    if (state === 'collapsed') return collapsedHeight;
    if (state === 'half') return halfHeight;
    return window.innerHeight - 60; // full - leave 60px for status bar
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    if (touch) {
      setStartY(touch.clientY);
      setCurrentY(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (touch) {
      setCurrentY(touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 50;

    if (Math.abs(deltaY) < threshold) {
      return; // Not enough movement
    }

    if (deltaY > 0) {
      // Dragging down
      if (state === 'full') {
        onStateChange('half');
      } else if (state === 'half') {
        onStateChange('collapsed');
      }
    } else {
      // Dragging up
      if (state === 'collapsed') {
        onStateChange('half');
      } else if (state === 'half') {
        onStateChange('full');
      }
    }
  };

  const handleHeaderClick = () => {
    if (state === 'collapsed') {
      onStateChange('half');
    } else if (state === 'half') {
      onStateChange('full');
    } else {
      onStateChange('collapsed');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      onStateChange('collapsed');
    }
  }, [isOpen, onStateChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - only visible when not collapsed */}
      {state !== 'collapsed' && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => onStateChange('collapsed')}
        />
      )}

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl z-50 md:hidden transition-all duration-300 ease-out"
        style={{
          height: `${getHeight()}px`,
          transform: isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)',
        }}
      >
        {/* Drag Handle Area */}
        <div
          className="px-4 py-3 cursor-pointer active:cursor-grabbing border-b border-border"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleHeaderClick}
        >
          {/* Drag Indicator */}
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />

          {/* Header Content */}
          <div className="flex items-center justify-between">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <ChevronUp
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                state === 'full' ? 'rotate-180' : state === 'half' ? 'rotate-0' : 'rotate-180'
              }`}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto h-[calc(100%-60px)] overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
