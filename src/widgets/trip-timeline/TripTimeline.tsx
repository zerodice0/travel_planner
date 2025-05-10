import { Visit } from '@/entities/visit/types';

interface TripTimelineProps {
  visits: Visit[];
}

export function TripTimeline({ visits }: TripTimelineProps) {
  // 방문 날짜별로 그룹화
  const groupedVisits = visits.reduce((groups, visit) => {
    const date = new Date(visit.visit_time).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(visit);
    return groups;
  }, {} as Record<string, Visit[]>);
  
  // 날짜 정렬
  const sortedDates = Object.keys(groupedVisits).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  if (visits.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        <p>아직 방문 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="text-sm font-medium bg-gray-100 p-2 rounded-md">{date}</h3>
          
          <div className="mt-2 space-y-4">
            {groupedVisits[date].map((visit, index) => {
              const placeName = visit.places_of_interest?.name || visit.custom_place_name || '무명 장소';
              const time = new Date(visit.visit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={visit.id} className="relative pl-6">
                  {/* 타임라인 점 */}
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                  
                  {/* 연결선 (마지막 항목이 아닌 경우에만) */}
                  {index < groupedVisits[date].length - 1 && (
                    <div className="absolute left-1.5 top-4 w-px h-full bg-gray-300"></div>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{placeName}</h4>
                      <span className="text-xs text-gray-500">{time}</span>
                    </div>
                    
                    {visit.notes && (
                      <p className="mt-1 text-sm text-gray-700">{visit.notes}</p>
                    )}
                    
                    {visit.rating && (
                      <div className="mt-1 flex">
                        {Array.from({ length: visit.rating }).map((_, i) => (
                          <span key={i} className="text-yellow-400 text-xs">★</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}