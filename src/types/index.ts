export interface Card {
  id: string;
  label: string;
  imageUrl: string;
  audioUrl: string;
  color?: string; // Hex code or tailwind class for personalization
}

export interface ApiResponse {
  message: string;
  data?: any;
  error?: string;
}
