import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { useSearch } from '@/contexts/SearchContext';

export const SearchBar: React.FC = () => {
  const { searchTerm, setSearchTerm } = useSearch();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search memos..."
        className="block w-full rounded-md border-0 bg-gray-100 dark:bg-gray-800 py-1.5 pl-10 pr-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
      />
    </div>
  );
}; 