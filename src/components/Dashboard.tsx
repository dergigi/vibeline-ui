'use client';

import { VoiceMemo } from '@/types/VoiceMemo';
import { formatTimeAgo } from '@/utils/date';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  memos: VoiceMemo[];
}

interface TodoItem {
  text: string;
  date: Date;
  memoId: string;
}

interface Statistics {
  total: number;
  thisWeek: number;
  thisMonth: number;
}

interface DailyActivity {
  date: string;
  memos: number;
  todos: number;
  drafts: number;
  prompts: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899'];

export default function Dashboard({ memos }: DashboardProps) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isOpenExpanded, setIsOpenExpanded] = useState(false);

  const getRecentTodos = (memos: VoiceMemo[], completed: boolean, expanded: boolean): TodoItem[] => {
    const allTodos: TodoItem[] = [];
    const now = new Date();
    const twentyOneDaysAgo = new Date(now);
    twentyOneDaysAgo.setDate(now.getDate() - 21);
    
    memos.forEach(memo => {
      if (!memo.todos) return;
      
      const todos = memo.todos
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return completed ? trimmed.startsWith('- [x]') : trimmed.startsWith('- [ ]');
        })
        .map(line => line.trim());

      if (todos.length === 0) return;

      const date = new Date(memo.filename.slice(0, 4) + '-' + 
                          memo.filename.slice(4, 6) + '-' + 
                          memo.filename.slice(6, 8) + ' ' + 
                          memo.filename.slice(9, 11) + ':' + 
                          memo.filename.slice(11, 13) + ':' + 
                          memo.filename.slice(13, 15));
      
      // Only include TODOs from the last 21 days
      if (date >= twentyOneDaysAgo) {
        todos.forEach(todo => {
          allTodos.push({
            text: todo,
            date,
            memoId: memo.filename
          });
        });
      }
    });
    
    const sortedTodos = allTodos.sort((a, b) => b.date.getTime() - a.date.getTime());
    return expanded ? sortedTodos : sortedTodos.slice(0, 5);
  };

  const getStatistics = (memos: VoiceMemo[]): { 
    memos: Statistics,
    todos: Statistics,
    drafts: Statistics,
    prompts: Statistics
  } => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      memos: { total: 0, thisWeek: 0, thisMonth: 0 },
      todos: { total: 0, thisWeek: 0, thisMonth: 0 },
      drafts: { total: 0, thisWeek: 0, thisMonth: 0 },
      prompts: { total: 0, thisWeek: 0, thisMonth: 0 }
    };

    memos.forEach(memo => {
      const date = new Date(memo.filename.slice(0, 4) + '-' + 
                          memo.filename.slice(4, 6) + '-' + 
                          memo.filename.slice(6, 8) + ' ' + 
                          memo.filename.slice(9, 11) + ':' + 
                          memo.filename.slice(11, 13) + ':' + 
                          memo.filename.slice(13, 15));

      // Count memos
      stats.memos.total++;
      if (date >= startOfWeek) stats.memos.thisWeek++;
      if (date >= startOfMonth) stats.memos.thisMonth++;

      // Count TODOs
      if (memo.todos?.split('\n').some(line => line.trim().startsWith('- [ ]'))) {
        stats.todos.total++;
        if (date >= startOfWeek) stats.todos.thisWeek++;
        if (date >= startOfMonth) stats.todos.thisMonth++;
      }

      // Count drafts
      if (memo.drafts?.trim()) {
        stats.drafts.total++;
        if (date >= startOfWeek) stats.drafts.thisWeek++;
        if (date >= startOfMonth) stats.drafts.thisMonth++;
      }

      // Count prompts (app ideas)
      if (memo.prompts?.trim()) {
        stats.prompts.total++;
        if (date >= startOfWeek) stats.prompts.thisWeek++;
        if (date >= startOfMonth) stats.prompts.thisMonth++;
      }
    });

    return stats;
  };

  const getDailyActivity = (memos: VoiceMemo[]): DailyActivity[] => {
    const activityMap = new Map<string, DailyActivity>();
    
    memos.forEach(memo => {
      const date = memo.filename.slice(0, 4) + '-' + 
                  memo.filename.slice(4, 6) + '-' + 
                  memo.filename.slice(6, 8);
      
      if (!activityMap.has(date)) {
        activityMap.set(date, {
          date,
          memos: 0,
          todos: 0,
          drafts: 0,
          prompts: 0
        });
      }
      
      const activity = activityMap.get(date)!;
      activity.memos++;
      
      if (memo.todos?.split('\n').some(line => line.trim().startsWith('- [ ]'))) {
        activity.todos++;
      }
      if (memo.drafts?.trim()) {
        activity.drafts++;
      }
      if (memo.prompts?.trim()) {
        activity.prompts++;
      }
    });
    
    return Array.from(activityMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days
  };

  const getContentDistribution = (stats: ReturnType<typeof getStatistics>) => {
    return [
      { name: 'TODOs', value: stats.todos.total },
      { name: 'Drafts', value: stats.drafts.total },
      { name: 'Prompts', value: stats.prompts.total }
    ];
  };

  const recentOpenTodos = getRecentTodos(memos, false, isOpenExpanded);
  const recentCompletedTodos = getRecentTodos(memos, true, isCompletedExpanded);
  const stats = getStatistics(memos);
  const dailyActivity = getDailyActivity(memos);
  const contentDistribution = getContentDistribution(stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* TODOs Widget */}
      <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Recently DONE
          </h3>
          <button 
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isCompletedExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {recentCompletedTodos.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-750 rounded p-4">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {recentCompletedTodos.map(todo => todo.text).join('\n')}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last completed {formatTimeAgo(recentCompletedTodos[0].date)}
              {!isCompletedExpanded && recentCompletedTodos.length === 5 && (
                <span className="ml-2">• Click expand to see more</span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No completed TODOs found</p>
        )}

        <div className="flex items-center justify-between mb-3 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Open TODOs
          </h3>
          <button 
            onClick={() => setIsOpenExpanded(!isOpenExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isOpenExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {recentOpenTodos.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-750 rounded p-4">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {recentOpenTodos.map(todo => todo.text).join('\n')}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated {formatTimeAgo(recentOpenTodos[0].date)}
              {!isOpenExpanded && recentOpenTodos.length === 5 && (
                <span className="ml-2">• Click expand to see more</span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No open TODOs found</p>
        )}
      </div>

      {/* Stats Widget */}
      <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Statistics
        </h3>
        <div className="space-y-4">
          {/* Activity Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Daily Activity</h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={dailyActivity}
                  margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                >
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={10}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={10}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#E5E7EB',
                      fontSize: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="memos" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="todos" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="drafts" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="prompts" stroke="#EC4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Voice Memos</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">This Week</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.memos.thisWeek}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{stats.memos.thisMonth}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{stats.memos.total}</p>
              </div>
            </div>
          </div>

          {/* Content Distribution Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Content Distribution</h4>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {contentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#E5E7EB',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">TODOs</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">This Week</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.todos.thisWeek}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{stats.todos.thisMonth}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{stats.todos.total}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Blog Drafts</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">This Week</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.drafts.thisWeek}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{stats.drafts.thisMonth}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{stats.drafts.total}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">App Ideas</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2">
                <p className="text-xs font-medium text-pink-600 dark:text-pink-400">This Week</p>
                <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">{stats.prompts.thisWeek}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{stats.prompts.thisMonth}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{stats.prompts.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 