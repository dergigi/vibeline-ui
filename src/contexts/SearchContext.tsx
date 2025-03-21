import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import FlexSearch from 'flexsearch';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredMemos: VoiceMemo[];
  setMemos: (memos: VoiceMemo[]) => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  
  // Initialize FlexSearch index
  const index = useMemo(() => {
    const idx = new FlexSearch.Document({
      document: {
        id: 'id',
        index: ['transcript', 'summary'],
        store: true
      }
    });
    return idx;
  }, []);

  // Update index when memos change
  const updateMemos = useCallback((newMemos: VoiceMemo[]) => {
    index.remove();
    newMemos.forEach(memo => {
      index.add({
        id: memo.id,
        transcript: memo.transcript,
        summary: memo.summary
      });
    });
    setMemos(newMemos);
  }, [index]);

  // Filter memos based on search term
  const filteredMemos = useMemo(() => {
    if (!searchTerm) return memos;
    
    if (searchTerm.startsWith('#')) {
      // Handle hashtag search
      const tag = searchTerm.slice(1).toLowerCase();
      return memos.filter(memo => {
        const hashtags = memo.transcript
          ? memo.transcript.toLowerCase().match(/#\w+/g) || []
          : [];
        return hashtags.includes(`#${tag}`);
      });
    }

    // Regular search
    const results = index.search(searchTerm);
    const matchedIds = new Set(results.map(r => r.id));
    return memos.filter(memo => matchedIds.has(memo.id));
  }, [searchTerm, memos, index]);

  const value = {
    searchTerm,
    setSearchTerm,
    filteredMemos,
    setMemos: updateMemos
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 