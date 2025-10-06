import { useState, useEffect } from 'react';
import { dashboardApi, listsApi, placesApi } from '#lib/api';
import type { DashboardStats } from '#types/dashboard';
import type { List } from '#types/list';
import type { Place } from '#types/place';

interface DashboardData {
  stats: DashboardStats | null;
  lists: List[];
  recentPlaces: Place[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [statsData, listsData, placesData] = await Promise.all([
        dashboardApi.getStats(),
        listsApi.getAll({ limit: 4, sort: 'updatedAt' }),
        placesApi.getAll({ limit: 5, sort: 'createdAt' }),
      ]);

      setStats(statsData);
      setLists(listsData.lists);
      setRecentPlaces(placesData.places);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
      console.error('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refetch = async () => {
    await fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    lists,
    recentPlaces,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
