import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { SearchProvider } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { MemoList } from '@/components/MemoList';
import { FilterButtons } from '@/components/FilterButtons';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Voice Memos',
  description: 'Call 555-vibe to vibe it into existence 🤙',
};

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

async function getArchiveFolders() {
  const port = process.env.PORT || '555';
  const response = await fetch(
    new URL('/api/archive', typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : `http://localhost:${port}`),
    { cache: 'no-store' }
  );
  return response.json();
}

function formatMonthName(folderName: string): string {
  const [year, month] = folderName.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default async function Home() {
  const [memos, plugins, archiveFolders] = await Promise.all([getData(), getPlugins(), getArchiveFolders()]);

  return (
    <SearchProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Call 555-vibe to vibe it into existence 🤙
            </p>
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

          {archiveFolders.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {archiveFolders.map((folder: { name: string; memoCount: number }) => (
                <Link
                  key={folder.name}
                  href={`/archive/${folder.name}`}
                  className="px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  {formatMonthName(folder.name)}
                </Link>
              ))}
            </div>
          )}

          <Dashboard memos={memos} />

          <Suspense fallback={<div>Loading...</div>}>
            <MemoList initialMemos={memos} />
          </Suspense>
        </div>
      </main>
    </SearchProvider>
  );
}
