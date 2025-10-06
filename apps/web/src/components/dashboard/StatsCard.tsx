import { MapPin, CheckCircle2, BarChart3, FolderOpen } from 'lucide-react';
import type { DashboardStats } from '#types/dashboard';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  stats: DashboardStats;
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

function StatItem({ label, value, icon: Icon }: StatItemProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-lg border border-border">
      <Icon className="w-6 h-6 mb-2 text-primary-600" />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatItem label="장소" value={stats.totalPlaces} icon={MapPin} />
      <StatItem label="방문" value={stats.visitedPlaces} icon={CheckCircle2} />
      <StatItem label="방문률" value={`${stats.visitedPercentage}%`} icon={BarChart3} />
      <StatItem label="목록" value={stats.totalLists} icon={FolderOpen} />
    </div>
  );
}
