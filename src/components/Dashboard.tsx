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

const getMemoDate = (memo: VoiceMemo): Date => {
  return memo.createdAt;
};

const getMemoTime = (memo: VoiceMemo): string => {
  const memoDate = typeof memo.createdAt === 'string' ? new Date(memo.createdAt) : memo.createdAt;
  return memoDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const groupMemosByTime = (memos: VoiceMemo[]): GroupedMemos => {
  // Get date boundaries in YYYYMMDD format (like TODOs plugin)
  const now = new Date();
  const today = now.toISOString().split('T')[0].replace(/-/g, '');
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
  
  const eightDaysAgo = new Date(now);
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
  const eightDaysAgoStr = eightDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
  
  const grouped: GroupedMemos = {
    today: [],
    yesterday: [],
    twoDaysAgo: [],
    restOfWeek: [],
    restOfMonth: []
  };
  
  memos.forEach(memo => {
    // Handle both string and Date types for createdAt
    const memoDate = typeof memo.createdAt === 'string' ? new Date(memo.createdAt) : memo.createdAt;
    const memoDateStr = memoDate.toISOString().split('T')[0].replace(/-/g, '');
    
    if (memoDateStr === today) {
      grouped.today.push(memo);
    } else if (memoDateStr === yesterdayStr) {
      grouped.yesterday.push(memo);
    } else if (memoDateStr === twoDaysAgoStr) {
      grouped.twoDaysAgo.push(memo);
    } else if (memoDateStr < yesterdayStr && memoDateStr >= threeDaysAgoStr) {
      grouped.restOfWeek.push(memo);
    } else if (memoDateStr < threeDaysAgoStr && memoDateStr >= eightDaysAgoStr) {
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
        <div>Today: {groupedMemos.today.length} | Yesterday: {groupedMemos.yesterday.length} | 2 Days Ago: {groupedMemos.twoDaysAgo.length} | Rest of Week: {groupedMemos.restOfWeek.length} | Rest of Month: {groupedMemos.restOfMonth.length}</div>
        {memos.length > 0 && (
          <div>Sample memo date: {getMemoDate(memos[0]).toLocaleDateString()}</div>
        )}
        <div>Current date: {new Date().toLocaleDateString()}</div>
        <div>Today (YYYYMMDD): {new Date().toISOString().split('T')[0].replace(/-/g, '')}</div>
        <div>Yesterday (YYYYMMDD): {new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0].replace(/-/g, '')}</div>
        {memos.length > 0 && (
          <div>First memo date (YYYYMMDD): {(typeof memos[0].createdAt === 'string' ? new Date(memos[0].createdAt) : memos[0].createdAt).toISOString().split('T')[0].replace(/-/g, '')}</div>
        )}
      </div>
      
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