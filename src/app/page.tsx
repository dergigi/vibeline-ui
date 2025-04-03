import { Suspense } from 'react';
import Dashboard from '@/components/Dashboard';
import { VoiceMemo } from '@/types/VoiceMemo';
import { SearchProvider } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { MemoList } from '@/components/MemoList';
import { FilterButtons } from '@/components/FilterButtons';

export const dynamic = 'force-dynamic';

async function getData() {
  const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${baseUrl}/api/memos`, { cache: 'no-store' });
  return response.json();
}

export default async function Home() {
  const memos: VoiceMemo[] = await getData();

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

          <Dashboard memos={memos} />

          <Suspense fallback={<div>Loading...</div>}>
            <MemoList initialMemos={memos} />
          </Suspense>
        </div>
      </main>
    </SearchProvider>
  );
} 