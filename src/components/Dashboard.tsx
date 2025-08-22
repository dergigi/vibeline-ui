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
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  const completed = lines.filter(line => line.startsWith('✓') || /\[(x|X)\]/.test(line)).length;
  return { completed, total: lines.length };
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

// Styling per group (subtle color + age fade)
const groupBg: Record<keyof GroupedMemos, string> = {
  today: 'bg-green-50 dark:bg-green-900/20 opacity-100',
  yesterday: 'bg-blue-50 dark:bg-blue-900/20 opacity-95',
  twoDaysAgo: 'bg-purple-50 dark:bg-purple-900/20 opacity-90',
  restOfWeek: 'bg-indigo-50 dark:bg-indigo-900/20 opacity-80',
  restOfMonth: 'bg-gray-50 dark:bg-gray-800/50 opacity-70',
};

export default function Dashboard({ memos }: DashboardProps) {
  const { filteredMemos } = useSearch();
  const sourceMemos = filteredMemos && filteredMemos.length > 0 ? filteredMemos : memos;
  const groupedMemos = groupMemosByTime(sourceMemos);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
      <div className="space-y-1">
        {([
          ['today', groupedMemos.today],
          ['yesterday', groupedMemos.yesterday],
          ['twoDaysAgo', groupedMemos.twoDaysAgo],
          ['restOfWeek', groupedMemos.restOfWeek],
          ['restOfMonth', groupedMemos.restOfMonth],
        ] as const).flatMap(([group, list]) =>
          list.map((memo) => (
            <div
              key={memo.path}
              className={`flex items-center justify-between text-xs rounded px-2 py-1 ${groupBg[group]}`}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {memo.title || 'Untitled'}
                </span>
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getMemoTime(memo)}
                </span>
                <div className="ml-auto">
                  <TodoProgressBar todos={memo.todos} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}