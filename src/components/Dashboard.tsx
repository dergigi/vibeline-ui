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

export default function Dashboard({ memos }: DashboardProps) {
  const getRecentOpenTodos = (memos: VoiceMemo[]): TodoItem[] => {
    const allTodos: TodoItem[] = [];
    
    memos.forEach(memo => {
      if (!memo.todos) return;
      
      const todos = memo.todos.split('\n').filter(line => line.trim().length > 0);
      const date = new Date(memo.filename.slice(0, 4) + '-' + 
                          memo.filename.slice(4, 6) + '-' + 
                          memo.filename.slice(6, 8) + ' ' + 
                          memo.filename.slice(9, 11) + ':' + 
                          memo.filename.slice(11, 13) + ':' + 
                          memo.filename.slice(13, 15));
      
      todos.forEach(todo => {
        if (!todo.toLowerCase().includes('done') && !todo.toLowerCase().includes('✓')) {
          allTodos.push({
            text: todo,
            date,
            memoId: memo.filename
          });
        }
      });
    });
    
    return allTodos.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  const recentOpenTodos = getRecentOpenTodos(memos);
  const totalMemos = memos.length;
  const memosWithTodos = memos.filter(memo => memo.todos?.trim().length > 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {/* Recent Open TODOs Widget */}
      <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Recent Open TODOs
        </h3>
        <div className="space-y-2">
          {recentOpenTodos.map((todo, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded bg-gray-50 dark:bg-gray-750">
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">{todo.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(todo.date)}
                </p>
              </div>
            </div>
          ))}
          {recentOpenTodos.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No open TODOs found</p>
          )}
        </div>
      </div>

      {/* Stats Widget */}
      <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Statistics
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Voice Memos</p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{totalMemos}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Memos with TODOs</p>
            <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{memosWithTodos}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 