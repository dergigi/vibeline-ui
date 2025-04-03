import { VoiceMemo } from '@/types/VoiceMemo';
import { formatTimeAgo } from '@/utils/date';

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

export default function Dashboard({ memos }: DashboardProps) {
  const getRecentTodos = (memos: VoiceMemo[], completed: boolean): TodoItem[] => {
    const allTodos: TodoItem[] = [];
    
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
      
      todos.forEach(todo => {
        allTodos.push({
          text: todo,
          date,
          memoId: memo.filename
        });
      });
    });
    
    return allTodos.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, completed ? 5 : 10);
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

  const recentOpenTodos = getRecentTodos(memos, false);
  const recentCompletedTodos = getRecentTodos(memos, true);
  const stats = getStatistics(memos);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {/* Recent Open TODOs Widget */}
      <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Recently Completed TODOs
        </h3>
        {recentCompletedTodos.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-750 rounded p-4">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {recentCompletedTodos.map(todo => todo.text).join('\n')}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last completed {formatTimeAgo(recentCompletedTodos[0].date)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No completed TODOs found</p>
        )}

        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6">
          Open TODOs
        </h3>
        {recentOpenTodos.length > 0 ? (
          <div className="bg-gray-50 dark:bg-gray-750 rounded p-4">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {recentOpenTodos.map(todo => todo.text).join('\n')}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Last updated {formatTimeAgo(recentOpenTodos[0].date)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No open TODOs found</p>
        )}
      </div>

      {/* Stats Widget */}
      <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Statistics
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Voice Memos</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.memos.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.memos.thisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.memos.thisMonth}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">TODOs</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.todos.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.todos.thisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.todos.thisMonth}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Blog Drafts</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.drafts.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.drafts.thisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.drafts.thisMonth}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">App Ideas</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.prompts.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.prompts.thisWeek}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">{stats.prompts.thisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 