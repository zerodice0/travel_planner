export type ActivityType =
  | 'place_added'
  | 'place_updated'
  | 'place_visited'
  | 'place_added_to_list'
  | 'list_created'
  | 'list_updated';

export interface ActivityPlaceDto {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export interface ActivityListDto {
  id: string;
  name: string;
  iconType: string;
  iconValue: string;
}

export interface ActivityMetadataDto {
  visited?: boolean;
  previousListId?: string;
}

export interface ActivityDto {
  id: string;
  type: ActivityType;
  timestamp: Date;
  place?: ActivityPlaceDto;
  list?: ActivityListDto;
  metadata?: ActivityMetadataDto;
}

export interface ActivitiesResponseDto {
  activities: ActivityDto[];
}
