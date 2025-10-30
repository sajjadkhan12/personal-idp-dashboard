import React from 'react';
import { User } from '../types';
import { SearchIcon } from '../constants';

interface HeaderProps {
  user: User;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, searchQuery, setSearchQuery, onSearch }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };
  
  return (
    <header className="h-16 bg-lt-base-200 dark:bg-base-200 border-b border-lt-base-300 dark:border-base-300 flex items-center justify-between px-8 flex-shrink-0">
      <div className="relative">
        <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-lt-content-subtle dark:text-gray-400" />
        <input 
          type="text" 
          placeholder="Search components..." 
          className="bg-lt-base-100 dark:bg-base-100 rounded-md py-2 pl-10 pr-4 w-80 focus:outline-none focus:ring-2 focus:ring-lt-brand-primary dark:focus:ring-brand-primary transition text-lt-content-strong dark:text-content placeholder-lt-content-subtle dark:placeholder-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </header>
  );
};

export default Header;
