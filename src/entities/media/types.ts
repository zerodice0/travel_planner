// src/entities/media/types.ts
export interface Media {
  id: string;
  visit_id: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  caption: string | null;
  created_at: string;
}

export type CreateMediaData = Omit<Media, 'id' | 'created_at'>;