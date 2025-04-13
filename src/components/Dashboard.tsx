'use client';

import { VoiceMemo } from '@/types/VoiceMemo';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  memos: VoiceMemo[];
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

interface StatsCardProps {
  title: string;
  stats: Statistics;
  color: string;
}

const countTodos = (todos: string): number => {
  return todos.trim().split('\n').filter(line => line.trim().length > 0).length;
};

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
  const getStatistics = (memos: VoiceMemo[]): { 
    memos: Statistics
  } => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      memos: { total: 0, thisWeek: 0, thisMonth: 0 }
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
      
      if (memo.todos?.trim()) {
        activity.todos += countTodos(memo.todos);
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

  const stats = getStatistics(memos);
  const dailyActivity = getDailyActivity(memos);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Stats Widget */}
      <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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
        </div>
      </div>
    </div>
  );
}