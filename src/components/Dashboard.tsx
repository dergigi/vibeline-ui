'use client';

import { VoiceMemo } from '@/types/VoiceMemo';
import { useSearch } from '@/contexts/SearchContext';

interface DashboardProps {
  memos: VoiceMemo[];
}

interface GroupedMemos {
  today: VoiceMemo[];
  yesterday: VoiceMemo[];
  twoDaysAgo: VoiceMemo[];
  restOfWeek: VoiceMemo[];
  restOfMonth: VoiceMemo[];
}

const parseTodos = (todos: string): { completed: number; total: number } => {
  if (!todos?.trim()) return { completed: 0, total: 0 };
  const lines = todos
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  // Consider only actual checklist items or checkmark-style lines
  const isChecklist = (line: string) => /^\s*-\s*\[( |x|X)\]/.test(line);
  const isCheckmark = (line: string) => /^\s*✓\s+/.test(line);
  const relevant = lines.filter(line => isChecklist(line) || isCheckmark(line));
  const completed = relevant.filter(line => /^\s*-\s*\[(x|X)\]/.test(line) || isCheckmark(line)).length;
  const total = relevant.length;
  return { completed, total };
};

// Helpers kept tiny and reusable (use LOCAL time to avoid UTC off-by-one)
const toYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};
const asDate = (value: string | Date): Date => (typeof value === 'string' ? new Date(value) : value);
const getMemoYmd = (memo: VoiceMemo): string => toYmd(asDate(memo.createdAt));
const getMemoTime = (memo: VoiceMemo): string =>
  asDate(memo.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

const TodoProgressBar = ({ todos }: { todos?: string }) => {
  if (!todos) return null;
  const { completed, total } = parseTodos(todos);
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-[2px] border ${
            i < completed ? 'bg-green-500 border-green-500' : 'border-orange-500'
          }`}
        />
      ))}
    </div>
  );
};

const groupMemosByTime = (memos: VoiceMemo[]): GroupedMemos => {
  // Boundaries, same style as TODOs plugin
  const now = new Date();
  const today = toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const yesterday = toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const twoDaysAgo = toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2));
  const threeDaysAgo = toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3));
  const eightDaysAgo = toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8));

  const grouped: GroupedMemos = {
    today: [],
    yesterday: [],
    twoDaysAgo: [],
    restOfWeek: [],
    restOfMonth: []
  };
  
  // Deduplicate by file path to avoid duplicate keys/entries
  const uniqueMemosByPath = new Map<string, VoiceMemo>();
  memos.forEach(m => {
    if (!uniqueMemosByPath.has(m.path)) uniqueMemosByPath.set(m.path, m);
  });
  const uniqueMemos = Array.from(uniqueMemosByPath.values());

  uniqueMemos.forEach(memo => {
    const memoDateStr = getMemoYmd(memo);
    if (memoDateStr === today) {
      grouped.today.push(memo);
    } else if (memoDateStr === yesterday) {
      grouped.yesterday.push(memo);
    } else if (memoDateStr === twoDaysAgo) {
      grouped.twoDaysAgo.push(memo);
    } else if (memoDateStr < yesterday && memoDateStr >= threeDaysAgo) {
      grouped.restOfWeek.push(memo);
    } else if (memoDateStr < threeDaysAgo && memoDateStr >= eightDaysAgo) {
      grouped.restOfMonth.push(memo);
    }
  });

  // Sort groups to match main page (newest first by filename)
  const compareMemos = (a: VoiceMemo, b: VoiceMemo) => b.filename.localeCompare(a.filename);
  grouped.today.sort(compareMemos);
  grouped.yesterday.sort(compareMemos);
  grouped.twoDaysAgo.sort(compareMemos);
  grouped.restOfWeek.sort(compareMemos);
  grouped.restOfMonth.sort(compareMemos);
  
  return grouped;
};

// Styling per group (reverse fade: newest no bg → older darker)
const groupBg: Record<keyof GroupedMemos, string> = {
  // No background for newest
  today: 'bg-transparent',
  // Subtle cool tint progressing to darker neutrals for age
  yesterday: 'bg-blue-50 dark:bg-white/5',
  twoDaysAgo: 'bg-slate-100 dark:bg-white/10',
  restOfWeek: 'bg-slate-200 dark:bg-white/20',
  restOfMonth: 'bg-slate-300 dark:bg-white/30',
};

const groupIndicator: Record<keyof GroupedMemos, { letter: string; label: string }> = {
  today: { letter: 'T', label: 'Today' },
  yesterday: { letter: 'Y', label: 'Yesterday' },
  twoDaysAgo: { letter: 'A', label: 'Antepenultimate (2 days ago)' },
  restOfWeek: { letter: 'W', label: 'Rest of week (3-7 days ago)' },
  restOfMonth: { letter: 'M', label: 'Rest of month (8-31 days ago)' },
};

export default function Dashboard({ memos }: DashboardProps) {
  const { filteredMemos } = useSearch();
  const sourceMemos = filteredMemos && filteredMemos.length > 0 ? filteredMemos : memos;
  const groupedMemos = groupMemosByTime(sourceMemos);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
      <div className="space-y-1">
        {(([ 
          ['today', groupedMemos.today],
          ['yesterday', groupedMemos.yesterday],
          ['twoDaysAgo', groupedMemos.twoDaysAgo],
          ['restOfWeek', groupedMemos.restOfWeek],
          ['restOfMonth', groupedMemos.restOfMonth],
        ] as const) as ReadonlyArray<[keyof GroupedMemos, VoiceMemo[]]>).flatMap(([group, list]) =>
          list.map((memo) => (
            <div
              key={memo.path}
              className={`flex items-center justify-between text-xs rounded px-2 py-1 ${groupBg[group]}`}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span
                  className="text-[10px] w-3 inline-flex items-center justify-center text-gray-400 dark:text-gray-500"
                  title={groupIndicator[group].label}
                  aria-label={groupIndicator[group].label}
                >
                  {groupIndicator[group].letter}
                </span>
                <button
                  onClick={() => {
                    const el = document.getElementById(`memo-${memo.filename}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="font-medium text-gray-900 dark:text-gray-100 truncate text-left hover:underline"
                  title="Scroll to memo"
                >
                  {memo.title || 'Untitled'}
                </button>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getMemoTime(memo)}
                </span>
                <a
                  href={`/memos/${memo.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                  title="Open memo in new tab"
                >
                  <TodoProgressBar todos={memo.todos} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}