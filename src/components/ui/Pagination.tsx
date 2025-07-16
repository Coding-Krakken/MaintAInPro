import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      showFirstLast = true,
      showPrevNext = true,
      maxVisiblePages = 5,
      className,
      ...props
    },
    ref
  ) => {
    const getVisiblePages = () => {
      const pages: number[] = [];
      const halfVisible = Math.floor(maxVisiblePages / 2);

      let start = Math.max(1, currentPage - halfVisible);
      let end = Math.min(totalPages, currentPage + halfVisible);

      // Adjust if we have less than maxVisiblePages
      if (end - start + 1 < maxVisiblePages) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisiblePages - 1);
        } else {
          start = Math.max(1, end - maxVisiblePages + 1);
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    };

    const visiblePages = getVisiblePages();
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center space-x-2', className)}
        {...props}
      >
        {/* First Page */}
        {showFirstLast && !isFirstPage && (
          <button
            onClick={() => onPageChange(1)}
            className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            First
          </button>
        )}

        {/* Previous Page */}
        {showPrevNext && !isFirstPage && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Previous
          </button>
        )}

        {/* Ellipsis - Start */}
        {visiblePages.length > 0 && (visiblePages[0] ?? 0) > 1 && (
          <span className='px-3 py-2 text-sm font-medium text-gray-500'>
            ...
          </span>
        )}

        {/* Page Numbers */}
        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              currentPage === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            {page}
          </button>
        ))}

        {/* Ellipsis - End */}
        {visiblePages.length > 0 &&
          (visiblePages[visiblePages.length - 1] ?? 0) < totalPages && (
            <span className='px-3 py-2 text-sm font-medium text-gray-500'>
              ...
            </span>
          )}

        {/* Next Page */}
        {showPrevNext && !isLastPage && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Next
          </button>
        )}

        {/* Last Page */}
        {showFirstLast && !isLastPage && (
          <button
            onClick={() => onPageChange(totalPages)}
            className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Last
          </button>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export { Pagination };
