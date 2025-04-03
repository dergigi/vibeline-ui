'use client';

import { useEffect } from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { VoiceMemoCard } from '@/components/VoiceMemoCard';
import { useSearch } from '@/contexts/SearchContext';

interface MemoListProps {
  initialMemos: VoiceMemo[];
}

export function MemoList({ initialMemos }: MemoListProps) {
  const { setMemos, filteredMemos } = useSearch();

  useEffect(() => {
    setMemos(initialMemos);
  }, [initialMemos, setMemos]);
  
  return (
    <div className="grid gap-6 md:grid-cols-1">
      {filteredMemos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No voice memos found</p>
        </div>
      ) : (
        filteredMemos.map((memo) => (
          <VoiceMemoCard key={memo.filename} memo={memo} />
        ))
      )}
    </div>
  );
} 