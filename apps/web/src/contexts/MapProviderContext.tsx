import { createContext, useContext, useState, ReactNode } from 'react';
import type { MapProvider } from '#types/map';

interface MapProviderContextType {
  mapProvider: MapProvider;
  searchProvider: MapProvider;
  setMapProvider: (provider: MapProvider) => void;
  setSearchProvider: (provider: MapProvider) => void;
}

const MapProviderContext = createContext<MapProviderContextType | null>(null);

export function MapProviderProvider({ children }: { children: ReactNode }) {
  const [mapProvider, setMapProviderState] = useState<MapProvider>(() => {
    const stored = localStorage.getItem('mapProvider');
    return (stored === 'kakao' || stored === 'google') ? stored : 'kakao';
  });

  const [searchProvider, setSearchProviderState] = useState<MapProvider>(() => {
    const stored = localStorage.getItem('searchProvider');
    return (stored === 'kakao' || stored === 'google') ? stored : 'kakao';
  });

  const setMapProvider = (provider: MapProvider) => {
    setMapProviderState(provider);
    localStorage.setItem('mapProvider', provider);
  };

  const setSearchProvider = (provider: MapProvider) => {
    setSearchProviderState(provider);
    localStorage.setItem('searchProvider', provider);
  };

  return (
    <MapProviderContext.Provider
      value={{
        mapProvider,
        searchProvider,
        setMapProvider,
        setSearchProvider,
      }}
    >
      {children}
    </MapProviderContext.Provider>
  );
}

export function useMapProvider() {
  const context = useContext(MapProviderContext);
  if (!context) {
    throw new Error('useMapProvider must be used within MapProviderProvider');
  }
  return context;
}
