export type ActivityType =
  | 'place_added'
  | 'place_updated'
  | 'place_visited'
  | 'place_added_to_list'
  | 'list_created'
  | 'list_updated';

export interface ActivityPlace {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export interface ActivityList {
  id: string;
  name: string;
  iconType: string;
  iconValue: string;
}

export interface ActivityMetadata {
  visited?: boolean;
  previousListId?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  place?: ActivityPlace;
  list?: ActivityList;
  metadata?: ActivityMetadata;
}

export interface ActivitiesResponse {
  activities: Activity[];
}
