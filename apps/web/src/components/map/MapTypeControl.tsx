import { useState, useRef, useEffect } from 'react';
import { Map, Satellite, Layers, Mountain, ChevronDown } from 'lucide-react';

interface MapTypeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const mapTypeOptions: MapTypeOption[] = [
  {
    id: 'roadmap',
    label: '일반',
    icon: <Map className="w-4 h-4" />,
  },
  {
    id: 'satellite',
    label: '위성',
    icon: <Satellite className="w-4 h-4" />,
  },
  {
    id: 'hybrid',
    label: '하이브리드',
    icon: <Layers className="w-4 h-4" />,
  },
  {
    id: 'terrain',
    label: '지형',
    icon: <Mountain className="w-4 h-4" />,
  },
];

interface MapTypeControlProps {
  currentMapType?: string | null;
  onMapTypeChange: (mapTypeId: string) => void;
}

export function MapTypeControl({ currentMapType = 'roadmap', onMapTypeChange }: MapTypeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = mapTypeOptions.find((option) => option.id === currentMapType) || mapTypeOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleOptionClick = (mapTypeId: string) => {
    onMapTypeChange(mapTypeId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg shadow-lg border border-border hover:bg-muted transition-colors"
        aria-label="지도 타입 선택"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentOption?.icon}
        <span className="text-sm font-medium text-foreground hidden sm:inline">
          {currentOption?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-36 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-50">
          {mapTypeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                option.id === currentMapType
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
              role="menuitem"
            >
              {option.icon}
              <span>{option.label}</span>
              {option.id === currentMapType && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
