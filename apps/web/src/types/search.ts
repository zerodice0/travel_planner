import type { Place } from '#types/place';
import type { List } from './list';

export interface SearchResults {
  places: Place[];
  lists: List[];
  total: {
    places: number;
    lists: number;
  };
}

export interface SearchFilters {
  type: 'all' | 'place' | 'list';
  category?: string;
  visited?: boolean;
}

export interface SearchHistory {
  keyword: string;
  searchedAt: string;
}
