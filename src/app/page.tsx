import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { SearchProvider } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { MemoList } from '@/components/MemoList';
import { FilterButtons } from '@/components/FilterButtons';
import CollapsibleLinks from '@/components/CollapsibleLinks';
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

          <CollapsibleLinks plugins={plugins} archiveFolders={archiveFolders} />

          <Dashboard memos={memos} />

          <Suspense fallback={<div>Loading...</div>}>
            <MemoList initialMemos={memos} />
          </Suspense>
        </div>
      </main>
    </SearchProvider>
  );
}
