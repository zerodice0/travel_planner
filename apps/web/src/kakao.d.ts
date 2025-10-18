// Kakao Maps API Type Definitions
// Note: This is a minimal type definition. For full types, consider using a complete typing package.

declare namespace kakao {
  namespace maps {
    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level: number });
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number): void;
      getLevel(): number;
      panBy(dx: number, dy: number): void;
      panTo(latlng: LatLng): void;
    }

    class LatLng {
      constructor(latitude: number, longitude: number);
      getLat(): number;
      getLng(): number;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Marker {
      constructor(options: { position: LatLng; image?: MarkerImage });
      setMap(map: Map | null): void;
      getPosition(): LatLng;
      setVisible(visible: boolean): void;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: { offset: Point });
    }

    class InfoWindow {
      constructor(options: { content: string });
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    namespace event {
      function addListener<T>(
        target: T,
        type: string,
        handler: (event?: unknown) => void
      ): void;
    }

    namespace services {
      enum Status {
        OK = 'OK',
        ZERO_RESULT = 'ZERO_RESULT',
        ERROR = 'ERROR'
      }

      class Places {
        keywordSearch<T = unknown>(
          keyword: string,
          callback: (data: T[], status: Status) => void
        ): void;
      }
    }

    function load(callback: () => void): void;
  }
}

declare interface Window {
  kakao: typeof kakao;
}
