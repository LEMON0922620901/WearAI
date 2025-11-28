export enum Step {
  SelectPerson = 1,
  SelectClothing = 2,
  Result = 3
}

export interface ImageAsset {
  id: string;
  url: string;
  label: string;
  isUserUploaded?: boolean;
}

export interface HistoryItem {
  id: string;
  personUrl: string;
  clothingUrl: string;
  resultUrl: string;
  critique?: string;
  timestamp: number;
}

export interface GenerationConfig {
  prompt?: string;
}