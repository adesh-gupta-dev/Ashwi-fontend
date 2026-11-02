import React from 'react';
import { FaSearch } from 'react-icons/fa';

const FilterBar = ({ search, onSearchChange, children, placeholder = 'Search...' }) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative min-w-[250px]">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:outline-[var(--accent)] dark:text-white transition-all shadow-sm"
        />
      </div>
      {children}
    </div>
  );
};

export default FilterBar;
