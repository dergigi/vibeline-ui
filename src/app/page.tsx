'use client';

import { getVoiceMemos } from '@/lib/voiceMemos';
import { VoiceMemoCard } from '@/components/VoiceMemoCard';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { Suspense, useEffect } from 'react';

export const dynamic = 'force-dynamic';

const MemoList = () => {
  const { setMemos, filteredMemos } = useSearch();

  useEffect(() => {
    const loadMemos = async () => {
      const memos = await getVoiceMemos();
      setMemos(memos);
    };
    loadMemos();
  }, [setMemos]);
  
  return (
    <div className="grid gap-6 md:grid-cols-1">
      {filteredMemos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No voice memos found</p>
        </div>
      ) : (
        filteredMemos.map((memo) => (
          <VoiceMemoCard key={memo.id} memo={memo} />
        ))
      )}
    </div>
  );
};

export default function Home() {
  return (
    <SearchProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ggpt-ass-t</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gigi&apos;s personal transcription assistant thingy
              </p>
            </div>
            <div className="w-64">
              <SearchBar />
            </div>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <MemoList />
          </Suspense>
        </div>
      </main>
    </SearchProvider>
  );
} 