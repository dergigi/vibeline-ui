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
  text: string;         // The text content of the todo line (after checkbox)
  date: Date;          // Date derived from the memo filename
  memoId: string;      // Base filename of the memo
  markdownPath: string; // Full path to the markdown file
  lineNumber: number;  // Original line number in the markdown file
  isChecked: boolean;  // Current state of the checkbox
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

interface TodoSectionProps {
  title: string;
  todos: TodoItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleTodo: (todo: TodoItem, listType: 'open' | 'completed') => void;
  optimisticTodos: TodoItem[] | null;
}

function TodoSection({ title, todos, isExpanded, onToggleExpand, onToggleTodo, optimisticTodos }: TodoSectionProps) {
  if (todos.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h4>
          <button 
            onClick={onToggleExpand}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No TODOs {title.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h4>
        <button 
          onClick={onToggleExpand}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-2">
        {(optimisticTodos ?? todos).map((todo) => (
          <div key={`${todo.markdownPath}-${todo.lineNumber}`} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={todo.isChecked}
              onChange={() => onToggleTodo(todo, 'open')}
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:ring-offset-0 dark:focus:ring-offset-gray-800 cursor-pointer"
            />
            <label className={`flex-1 text-sm ${todo.isChecked ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} cursor-pointer`} onClick={() => onToggleTodo(todo, 'open')}>
              {todo.text || <span className="italic text-gray-400 dark:text-gray-600">(empty)</span>}
            </label>
          </div>
        ))}
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
          {todos.length > 0 && `Last updated ${formatTimeAgo(todos[0].date)}`}
          {!isExpanded && todos.length >= 5 && (
            <span className="ml-2">• Click expand to see more</span>
          )}
        </p>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  stats: Statistics;
  color: string;
}

function StatsCard({ title, stats, color }: StatsCardProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-lg p-2`}>
          <p className={`text-xs font-medium text-${color}-600 dark:text-${color}-400`}>This Week</p>
          <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300`}>{stats.thisWeek}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{stats.thisMonth}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{stats.total}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ memos }: DashboardProps) {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isTodayExpanded, setIsTodayExpanded] = useState(false);
  const [isYesterdayExpanded, setIsYesterdayExpanded] = useState(false);
  const [isOlderExpanded, setIsOlderExpanded] = useState(false);
  // State for optimistic UI updates
  const [optimisticTodayTodos, setOptimisticTodayTodos] = useState<TodoItem[] | null>(null);
  const [optimisticYesterdayTodos, setOptimisticYesterdayTodos] = useState<TodoItem[] | null>(null);
  const [optimisticOlderTodos, setOptimisticOlderTodos] = useState<TodoItem[] | null>(null);
  const [optimisticCompletedTodos, setOptimisticCompletedTodos] = useState<TodoItem[] | null>(null);
  
  // Date variables for filtering
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(startOfToday);
  endOfYesterday.setMilliseconds(-1);
  
  const getRecentTodos = (memos: VoiceMemo[], completed: boolean, expanded: boolean, dateFilter?: 'today' | 'yesterday' | 'older'): TodoItem[] => {
    const allTodos: TodoItem[] = [];
    
    memos.forEach(memo => {
      if (!memo.todos) return;
      
      // Process todos line by line to preserve original index and extract text
      const todosData: { text: string; lineNumber: number; isChecked: boolean }[] = [];
      memo.todos.split('\n').forEach((line, lineNumber) => {
        const match = line.match(/^(\s*-\s*\[\s*)([ x])(\s*\]\s*)(.*)/);
        if (match) {
          const isChecked = match[2] === 'x';
          if (isChecked === completed) { // Filter based on completed status
            todosData.push({
              text: match[4], // Extract text after checkbox
              lineNumber,
              isChecked: isChecked,
            });
          }
        }
      });

      if (todosData.length === 0) return;

      const date = new Date(memo.filename.slice(0, 4) + '-' + 
                          memo.filename.slice(4, 6) + '-' + 
                          memo.filename.slice(6, 8) + ' ' + 
                          memo.filename.slice(9, 11) + ':' + 
                          memo.filename.slice(11, 13) + ':' + 
                          memo.filename.slice(13, 15));
      
      // Apply date filtering if specified
      if (dateFilter) {
        if (dateFilter === 'today' && date < startOfToday) return;
        if (dateFilter === 'yesterday' && (date < startOfYesterday || date > endOfYesterday)) return;
        if (dateFilter === 'older' && date >= startOfYesterday) return;
      }
      
      todosData.forEach(todoInfo => {
        allTodos.push({
          text: todoInfo.text,
          date,
          memoId: memo.filename,
          markdownPath: memo.path,
          lineNumber: todoInfo.lineNumber,
          isChecked: todoInfo.isChecked,
        });
      });
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

  const recentOpenTodosToday = getRecentTodos(memos, false, isTodayExpanded, 'today');
  const recentOpenTodosYesterday = getRecentTodos(memos, false, isYesterdayExpanded, 'yesterday');
  const recentOpenTodosOlder = getRecentTodos(memos, false, isOlderExpanded, 'older');
  const recentCompletedTodos = getRecentTodos(memos, true, isCompletedExpanded);

  const handleTodoToggle = async (todo: TodoItem, listType: 'open' | 'completed') => {
    try {
      // Optimistically update the UI
      if (listType === 'open') {
        // Determine which section the todo belongs to
        const todoDate = todo.date;
        if (todoDate >= startOfToday) {
          // Remove from today's todos
          setOptimisticTodayTodos(prev => 
            (prev ?? recentOpenTodosToday).filter(t => 
              !(t.markdownPath === todo.markdownPath && t.lineNumber === todo.lineNumber)
            )
          );
        } else if (todoDate >= startOfYesterday && todoDate <= endOfYesterday) {
          // Remove from yesterday's todos
          setOptimisticYesterdayTodos(prev => 
            (prev ?? recentOpenTodosYesterday).filter(t => 
              !(t.markdownPath === todo.markdownPath && t.lineNumber === todo.lineNumber)
            )
          );
        } else {
          // Remove from older todos
          setOptimisticOlderTodos(prev => 
            (prev ?? recentOpenTodosOlder).filter(t => 
              !(t.markdownPath === todo.markdownPath && t.lineNumber === todo.lineNumber)
            )
          );
        }
        
        // Add to completed todos
        const newCompletedTodo = { ...todo, isChecked: true };
        setOptimisticCompletedTodos(prev => 
          [newCompletedTodo, ...(prev ?? recentCompletedTodos)].slice(0, 5)
        );
      } else {
        // Remove from completed todos
        const updatedCompletedTodos = (optimisticCompletedTodos ?? recentCompletedTodos).filter(
          t => !(t.markdownPath === todo.markdownPath && t.lineNumber === todo.lineNumber)
        );
        setOptimisticCompletedTodos(updatedCompletedTodos);
        
        // Add back to appropriate section based on date
        const newOpenTodo = { ...todo, isChecked: false };
        const todoDate = todo.date;
        
        if (todoDate >= startOfToday) {
          setOptimisticTodayTodos(prev => {
            const currentList = prev ?? recentOpenTodosToday;
            return [newOpenTodo, ...currentList].slice(0, 5);
          });
        } else if (todoDate >= startOfYesterday && todoDate <= endOfYesterday) {
          setOptimisticYesterdayTodos(prev => {
            const currentList = prev ?? recentOpenTodosYesterday;
            return [newOpenTodo, ...currentList].slice(0, 5);
          });
        } else {
          setOptimisticOlderTodos(prev => {
            const currentList = prev ?? recentOpenTodosOlder;
            return [newOpenTodo, ...currentList].slice(0, 5);
          });
        }
      }

      // Make the API call
      const response = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdownPath: todo.markdownPath,
          lineNumber: todo.lineNumber,
          isChecked: !todo.isChecked
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle todo');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      // Revert optimistic updates on error
      setOptimisticTodayTodos(null);
      setOptimisticYesterdayTodos(null);
      setOptimisticOlderTodos(null);
      setOptimisticCompletedTodos(null);
    }
  };

  const getContentDistribution = (stats: ReturnType<typeof getStatistics>) => {
    return [
      { name: 'TODOs', value: stats.todos.total },
      { name: 'Drafts', value: stats.drafts.total },
      { name: 'Prompts', value: stats.prompts.total }
    ];
  };

  const stats = getStatistics(memos);
  const dailyActivity = getDailyActivity(memos);
  const contentDistribution = getContentDistribution(stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* TODOs Widget */}
      <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Open TODOs
          </h3>
        </div>

        <TodoSection 
          title="Today"
          todos={recentOpenTodosToday}
          isExpanded={isTodayExpanded}
          onToggleExpand={() => setIsTodayExpanded(!isTodayExpanded)}
          onToggleTodo={handleTodoToggle}
          optimisticTodos={optimisticTodayTodos}
        />

        <TodoSection 
          title="Yesterday"
          todos={recentOpenTodosYesterday}
          isExpanded={isYesterdayExpanded}
          onToggleExpand={() => setIsYesterdayExpanded(!isYesterdayExpanded)}
          onToggleTodo={handleTodoToggle}
          optimisticTodos={optimisticYesterdayTodos}
        />

        <TodoSection 
          title="Older TODOs"
          todos={recentOpenTodosOlder}
          isExpanded={isOlderExpanded}
          onToggleExpand={() => setIsOlderExpanded(!isOlderExpanded)}
          onToggleTodo={handleTodoToggle}
          optimisticTodos={optimisticOlderTodos}
        />

        <div className="flex items-center justify-between mb-3 mt-6">
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 space-y-2">
            {(optimisticCompletedTodos ?? recentCompletedTodos).map((todo) => (
              <div key={`${todo.markdownPath}-${todo.lineNumber}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.isChecked}
                  onChange={() => handleTodoToggle(todo, 'completed')}
                  className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-indigo-500 focus:ring-offset-0 dark:focus:ring-offset-gray-800 cursor-pointer"
                />
                <label className={`flex-1 text-sm ${todo.isChecked ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} cursor-pointer`} onClick={() => handleTodoToggle(todo, 'completed')}>
                  {todo.text || <span className="italic text-gray-400 dark:text-gray-600">(empty)</span>}
                </label>
              </div>
            ))}
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              {(optimisticCompletedTodos ?? recentCompletedTodos).length > 0 && `Last completed ${formatTimeAgo((optimisticCompletedTodos ?? recentCompletedTodos)[0].date)}`}
              {!isCompletedExpanded && (optimisticCompletedTodos ?? recentCompletedTodos).length >= 5 && (
                <span className="ml-2">• Click expand to see more</span>
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No completed TODOs found</p>
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

          <StatsCard title="Voice Memos" stats={stats.memos} color="blue" />
          
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

          <StatsCard title="TODOs" stats={stats.todos} color="emerald" />
          <StatsCard title="Blog Drafts" stats={stats.drafts} color="amber" />
          <StatsCard title="App Ideas" stats={stats.prompts} color="pink" />
        </div>
      </div>
    </div>
  );
}