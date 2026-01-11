export interface Card {
  id: string;
  boardId: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
  color?: string;
}

export interface Board {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ApiResponse {
  message: string;
  data?: any;
  error?: string;
}
