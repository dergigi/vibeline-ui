'use client';

import { VoiceMemo } from '@/types/VoiceMemo';
import { formatTimeAgo } from '@/utils/date';

interface DashboardProps {
  memos: VoiceMemo[];
}

interface GroupedMemos {
  today: VoiceMemo[];
  yesterday: VoiceMemo[];
  thisWeek: VoiceMemo[];
  thisMonth: VoiceMemo[];
}

const countOpenTodos = (todos: string): number => {
  if (!todos?.trim()) return 0;
  return todos.trim().split('\n').filter(line => 
    line.trim().length > 0 && !line.trim().startsWith('✓')
  ).length;
};

const getMemoDate = (memo: VoiceMemo): Date => {
  return new Date(memo.filename.slice(0, 4) + '-' + 
                  memo.filename.slice(4, 6) + '-' + 
                  memo.filename.slice(6, 8) + ' ' + 
                  memo.filename.slice(9, 11) + ':' + 
                  memo.filename.slice(11, 13) + ':' + 
                  memo.filename.slice(13, 15));
};

const getMemoTime = (memo: VoiceMemo): string => {
  const time = memo.filename.slice(9, 11) + ':' + memo.filename.slice(11, 13);
  return time;
};

const groupMemosByTime = (memos: VoiceMemo[]): GroupedMemos => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const grouped: GroupedMemos = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: []
  };
  
  const processedMemos = new Set<string>();
  
  memos.forEach(memo => {
    if (processedMemos.has(memo.id)) return;
    
    const memoDate = getMemoDate(memo);
    const memoDateOnly = new Date(memoDate.getFullYear(), memoDate.getMonth(), memoDate.getDate());
    
    // Add to the most recent time period only
    if (memoDateOnly.getTime() === today.getTime()) {
      grouped.today.push(memo);
      processedMemos.add(memo.id);
    } else if (memoDateOnly.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(memo);
      processedMemos.add(memo.id);
    } else if (memoDate >= startOfWeek) {
      grouped.thisWeek.push(memo);
      processedMemos.add(memo.id);
    } else if (memoDate >= startOfMonth) {
      grouped.thisMonth.push(memo);
      processedMemos.add(memo.id);
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
          <div key={memo.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
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
      
      {/* Debug info - remove this later */}
      <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
        <div>Total memos: {memos.length}</div>
        <div>Today: {groupedMemos.today.length} | Yesterday: {groupedMemos.yesterday.length} | This Week: {groupedMemos.thisWeek.length} | This Month: {groupedMemos.thisMonth.length}</div>
        {memos.length > 0 && (
          <div>Sample memo date: {getMemoDate(memos[0]).toLocaleDateString()}</div>
        )}
      </div>
      
      <div className="space-y-2">
        <MemoGroup title="Today" memos={groupedMemos.today} color="green" />
        <MemoGroup title="Yesterday" memos={groupedMemos.yesterday} color="blue" />
        <MemoGroup title="This Week" memos={groupedMemos.thisWeek} color="purple" />
        <MemoGroup title="This Month" memos={groupedMemos.thisMonth} color="gray" />
      </div>
    </div>
  );
}