import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ page, totalPages, onPageChange, isLoading = false }) => {
  return (
    <div className="h-16 border-t border-gray-200 dark:border-white/10 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shrink-0">
      <span className="text-sm text-[var(--text-secondary)]">
        Page {page} of {Math.max(totalPages, 1)}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || isLoading}
          className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <FaChevronLeft className="text-sm text-[var(--text-secondary)]" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
          disabled={page === totalPages || isLoading || totalPages === 0}
          className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <FaChevronRight className="text-sm text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
