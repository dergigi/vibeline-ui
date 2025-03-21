'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';

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

  // Filter memos based on search term
  const filteredMemos = useMemo(() => {
    if (!searchTerm) return memos;
    
    const term = searchTerm.toLowerCase();
    
    if (term.startsWith('#')) {
      // Handle hashtag search - extract hashtags without the # symbol
      const searchTag = term.slice(1);
      return memos.filter(memo => {
        const hashtags = memo.transcript
          ? memo.transcript.toLowerCase().match(/#\w+/g)?.map(tag => tag.slice(1)) || []
          : [];
        return hashtags.includes(searchTag);
      });
    }

    // Regular search
    return memos.filter(memo => {
      const transcript = memo.transcript?.toLowerCase() || '';
      const summary = memo.summary?.toLowerCase() || '';
      return transcript.includes(term) || summary.includes(term);
    });
  }, [searchTerm, memos]);

  const value = {
    searchTerm,
    setSearchTerm,
    filteredMemos,
    setMemos
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 