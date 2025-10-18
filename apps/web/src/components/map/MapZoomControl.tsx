import { ZoomIn, ZoomOut } from 'lucide-react';

interface MapZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  currentZoom?: number | null;
  maxZoom?: number;
  minZoom?: number;
}

export function MapZoomControl({
  onZoomIn,
  onZoomOut,
  currentZoom,
  maxZoom = 22,
  minZoom = 0,
}: MapZoomControlProps) {
  const isMaxZoom = currentZoom !== null && currentZoom !== undefined && currentZoom >= maxZoom;
  const isMinZoom = currentZoom !== null && currentZoom !== undefined && currentZoom <= minZoom;

  return (
    <div className="flex flex-col gap-1 bg-card rounded-lg shadow-lg border border-border overflow-hidden">
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={isMaxZoom}
        className="p-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label="확대"
        title="확대"
      >
        <ZoomIn className="w-5 h-5 text-foreground" />
      </button>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={isMinZoom}
        className="p-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label="축소"
        title="축소"
      >
        <ZoomOut className="w-5 h-5 text-foreground" />
      </button>
    </div>
  );
}
