'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { VoiceMemo } from '@/types/VoiceMemo';
import { VoiceMemoCard } from '@/components/VoiceMemoCard';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { SearchBar } from '@/components/SearchBar';
import { FilterButtons } from '@/components/FilterButtons';
import { ArrowLeftIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

interface ApiVoiceMemo extends Omit<VoiceMemo, 'createdAt'> {
  createdAt: string;
}

function formatMonthName(folderName: string): string {
  const [year, month] = folderName.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const ITEMS_PER_PAGE = 10;

function ArchiveMemoList({ month }: { month: string }) {
  const { setMemos, filteredMemos } = useSearch();
  const [displayedMemos, setDisplayedMemos] = useState<VoiceMemo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemos() {
      try {
        const response = await fetch(`/api/archive/${month}`);
        if (response.ok) {
          const data: ApiVoiceMemo[] = await response.json();
          const memos = data.map((memo) => ({
            ...memo,
            createdAt: new Date(memo.createdAt)
          }));
          setMemos(memos);
        }
      } catch (error) {
        console.error('Error fetching archive memos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMemos();
  }, [month, setMemos]);

  useEffect(() => {
    setDisplayedMemos(filteredMemos.slice(0, ITEMS_PER_PAGE));
  }, [filteredMemos]);

  const handleLoadMore = () => {
    const currentLength = displayedMemos.length;
    const nextMemos = filteredMemos.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    setDisplayedMemos([...displayedMemos, ...nextMemos]);
  };

  const hasMore = displayedMemos.length < filteredMemos.length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1">
        {displayedMemos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No voice memos found</p>
          </div>
        ) : (
          displayedMemos.map((memo) => (
            <VoiceMemoCard key={memo.filename} memo={memo} />
          ))
        )}
      </div>
      
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArchiveMonthPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = use(params);

  return (
    <SearchProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/archive"
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <ArchiveBoxIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {formatMonthName(month)}
            </h1>
          </div>

          <div className="flex items-center justify-end gap-4 mb-8">
            <FilterButtons />
            <div className="w-64">
              <SearchBar />
            </div>
          </div>

          <ArchiveMemoList month={month} />
        </div>
      </main>
    </SearchProvider>
  );
}

