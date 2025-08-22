'use client';

import { VoiceMemo } from '@/types/VoiceMemo';

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

const countOpenTodos = (todos: string): number => {
  if (!todos?.trim()) return 0;
  return todos.trim().split('\n').filter(line => 
    line.trim().length > 0 && !line.trim().startsWith('✓')
  ).length;
};

// Helpers kept tiny and reusable
const toYmd = (date: Date): string => date.toISOString().split('T')[0].replace(/-/g, '');
const asDate = (value: string | Date): Date => (typeof value === 'string' ? new Date(value) : value);
const getMemoYmd = (memo: VoiceMemo): string => toYmd(asDate(memo.createdAt));
const getMemoTime = (memo: VoiceMemo): string =>
  asDate(memo.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

const groupMemosByTime = (memos: VoiceMemo[]): GroupedMemos => {
  // Boundaries, same style as TODOs plugin
  const now = new Date();
  const today = toYmd(now);
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
  
  return grouped;
};

const MemoGroup = ({ title, memos, color }: { title: string; memos: VoiceMemo[]; color: string }) => {
  if (memos.length === 0) return null;
  
  return (
    <div className="mb-3">
      <h4 className={`text-xs font-semibold text-${color}-600 dark:text-${color}-400 mb-1 uppercase tracking-wide`}>
        {title} ({memos.length})
      </h4>
      <div className="space-y-1">
        {memos.map(memo => (
          <div key={memo.path} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {memo.title || 'Untitled'}
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span>{getMemoTime(memo)}</span>
                {memo.todos && countOpenTodos(memo.todos) > 0 && (
                  <span className="text-orange-600 dark:text-orange-400">
                    {countOpenTodos(memo.todos)} TODO{countOpenTodos(memo.todos) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard({ memos }: DashboardProps) {
  const groupedMemos = groupMemosByTime(memos);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
        Overview
      </h3>
      
      {/* Compact, no debug */}
      
      <div className="space-y-2">
        <MemoGroup title="Today" memos={groupedMemos.today} color="green" />
        <MemoGroup title="Yesterday" memos={groupedMemos.yesterday} color="blue" />
        <MemoGroup title="2 Days Ago" memos={groupedMemos.twoDaysAgo} color="purple" />
        <MemoGroup title="Rest of Week" memos={groupedMemos.restOfWeek} color="indigo" />
        <MemoGroup title="Rest of Month" memos={groupedMemos.restOfMonth} color="gray" />
      </div>
    </div>
  );
}