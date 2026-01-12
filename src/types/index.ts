export interface Card {
  id: string;
  boardId: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
  color?: string;
  order?: number;
  type: 'Thing' | 'Word';
  templateKey?: string; // If set, this card references a template and cannot be edited
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  isPublic?: boolean;
  creatorName?: string;
  creatorImageUrl?: string;
}

export interface ApiResponse {
  message: string;
  data?: any;
  error?: string;
}
