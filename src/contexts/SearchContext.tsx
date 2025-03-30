'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredMemos: VoiceMemo[];
  setMemos: (memos: VoiceMemo[]) => void;
  activeFilters: Set<string>;
  toggleFilter: (filter: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

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
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  // Filter memos based on search term and active filters
  const filteredMemos = useMemo(() => {
    let filtered = memos;
    
    // Apply text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      if (term.startsWith('#')) {
        // Handle hashtag search - extract hashtags without the # symbol
        const searchTag = term.slice(1);
        filtered = filtered.filter(memo => {
          const hashtags = memo.transcript
            ? memo.transcript.toLowerCase().match(/#\w+/g)?.map(tag => tag.slice(1)) || []
            : [];
          return hashtags.includes(searchTag);
        });
      } else {
        // Regular search
        filtered = filtered.filter(memo => {
          const transcript = memo.transcript?.toLowerCase() || '';
          const summary = memo.summary?.toLowerCase() || '';
          return transcript.includes(term) || summary.includes(term);
        });
      }
    }

    // Apply filters
    if (activeFilters.size > 0) {
      filtered = filtered.filter(memo => {
        const hasTodos = memo.summary?.split('\n').some(line => line.trim().startsWith('- [ ]')) ?? false;
        const hasImplementationPlan = memo.summary?.toLowerCase().includes('implementation plan') ?? false;
        const hasBlogDraft = (memo.summary?.includes('#') || memo.summary?.includes('===')) ?? false;

        if (activeFilters.has('todos') && !hasTodos) return false;
        if (activeFilters.has('prompts') && !hasImplementationPlan) return false;
        if (activeFilters.has('drafts') && !hasBlogDraft) return false;
        return true;
      });
    }

    return filtered;
  }, [searchTerm, memos, activeFilters]);

  const value = {
    searchTerm,
    setSearchTerm,
    filteredMemos,
    setMemos,
    activeFilters,
    toggleFilter
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 