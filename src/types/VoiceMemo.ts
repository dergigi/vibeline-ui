export interface BlossomData {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
}

export interface VoiceMemo {
  id: string;
  filename: string;
  path: string;
  transcript?: string;
  isCleanedTranscript?: boolean;
  summary?: string;
  todos?: string;
  prompts?: string;
  drafts?: string;
  title?: string;
  audioUrl: string;
  createdAt: Date;
  blossom?: BlossomData;
  yolopost?: {
    id: string;
  };
  durationSec?: number;
}
