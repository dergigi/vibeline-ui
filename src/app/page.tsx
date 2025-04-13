import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { SearchProvider } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { MemoList } from '@/components/MemoList';
import { FilterButtons } from '@/components/FilterButtons';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getData() {
  const port = process.env.PORT || '555';
  const response = await fetch(new URL('/api/memos', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : `http://localhost:${port}`), { cache: 'no-store' });
  return response.json();
}

async function getPlugins() {
  const port = process.env.PORT || '555';
  const response = await fetch(
    new URL('/api/plugins', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : `http://localhost:${port}`),
    { cache: 'no-store' }
  );
  return response.json();
}

export default async function Home() {
  const [memos, plugins] = await Promise.all([getData(), getPlugins()]);

  return (
    <SearchProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vibeline</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Call 555-vibe to vibe it into existence 🤙
              </p>
            </div>
            <div className="flex items-center gap-4">
              <FilterButtons />
              <div className="w-64">
                <SearchBar />
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {plugins.map((plugin: { id: string; name: string; path: string }) => (
              <Link
                key={plugin.id}
                href={plugin.path}
                className="px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                /{plugin.id}
              </Link>
            ))}
          </div>

          <Dashboard memos={memos} />

          <Suspense fallback={<div>Loading...</div>}>
            <MemoList initialMemos={memos} />
          </Suspense>
        </div>
      </main>
    </SearchProvider>
  );
}
