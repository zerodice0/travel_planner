// ⚠️ DEPRECATED: This file is no longer used.
// DashboardPage has been replaced by HomePage (/).
// The /dashboard route now redirects to / (see App.tsx).
//
// This file can be safely deleted along with:
// - #components/dashboard/ListCard.tsx
// - #components/dashboard/ActivityCard.tsx
// - #components/dashboard/PlaceListItem.tsx
// - #components/dashboard/SearchBar.tsx
//
// Note: StatsCard is still used by StatsPage (/settings/stats)

import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  return <Navigate to="/" replace />;
}
