export interface Card {
  id: string;
  boardId: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
  color?: string;
  order?: number;
  category?: string; // Optional free-text category for filtering cards (e.g., "Food", "Actions", "Feelings")
  templateKey?: string; // If set, this card references a template and cannot be edited
  sourceBoardId?: string; // If set, this card was inherited from a public board template and cannot be edited
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
  ownerEmail?: string;
  emailNotificationsEnabled?: boolean;
  likeCount?: number;
  commentCount?: number;
  cardCount?: number;
  isLikedByUser?: boolean;
}

export interface BoardLike {
  id: string;
  userId: string;
  boardId: string;
  createdAt: string;
}

export interface BoardComment {
  id: string;
  userId: string;
  boardId: string;
  content: string;
  commenterName: string;
  commenterImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface ApiResponse {
  message: string;
  data?: unknown;
  error?: string;
}
