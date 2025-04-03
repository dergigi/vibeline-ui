export interface VoiceMemo {
  id: string;
  filename: string;
  path: string;
  transcript: string;
  summary: string;
  todos: string;
  prompts: string;
  drafts: string;
  audioUrl: string;
  createdAt: Date;
} 