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
}
