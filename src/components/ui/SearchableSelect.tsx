import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  error?: string | undefined;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  renderOption?: (option: Option) => React.ReactNode;
  renderValue?: (option: Option) => React.ReactNode;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  onClear,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  loading = false,
  error,
  disabled = false,
  clearable = false,
  className = '',
  onSearchChange,
  searchValue,
  renderOption,
  renderValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const searchValue_ =
    searchValue !== undefined ? searchValue : internalSearchValue;
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue_.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (newValue: string) => {
    setInternalSearchValue(newValue);
    setHighlightedIndex(-1);
    if (onSearchChange) {
      onSearchChange(newValue);
    }
  };

  // Handle option selection
  const handleSelect = (option: Option) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setInternalSearchValue('');
    setHighlightedIndex(-1);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setInternalSearchValue('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const selectedOption = filteredOptions[highlightedIndex];
          if (selectedOption) {
            handleSelect(selectedOption);
          }
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      optionsRef.current &&
      filteredOptions.length > 0
    ) {
      const optionElement = optionsRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, filteredOptions.length]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input container */}
      <div
        role='combobox'
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-controls='options-list'
        tabIndex={disabled ? -1 : 0}
        className={`
          relative flex items-center min-h-[2.5rem] px-3 py-2
          border rounded-md cursor-pointer transition-colors
          ${
            disabled
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : isOpen
                ? 'border-blue-500 ring-1 ring-blue-500'
                : error
                  ? 'border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                  : 'border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
          }
        `}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Display value or search input */}
        {isOpen ? (
          <input
            ref={inputRef}
            type='text'
            value={searchValue_}
            onChange={e => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className='flex-1 outline-none bg-transparent'
            disabled={disabled}
          />
        ) : (
          <div className='flex-1 truncate'>
            {selectedOption ? (
              renderValue ? (
                renderValue(selectedOption)
              ) : (
                selectedOption.label
              )
            ) : (
              <span className='text-gray-500'>{placeholder}</span>
            )}
          </div>
        )}

        {/* Clear button */}
        {clearable && selectedOption && !disabled && (
          <button
            type='button'
            onClick={handleClear}
            className='p-1 hover:bg-gray-200 rounded transition-colors'
          >
            <XMarkIcon className='h-4 w-4 text-gray-400' />
          </button>
        )}

        {/* Dropdown arrow */}
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Options dropdown */}
      {isOpen && (
        <div
          id='options-list'
          role='listbox'
          className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto'
        >
          <div ref={optionsRef}>
            {loading ? (
              <div className='px-3 py-2 text-gray-500'>Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className='px-3 py-2 text-gray-500'>
                {searchValue_ ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role='option'
                  aria-selected={selectedOption?.value === option.value}
                  tabIndex={option.disabled ? -1 : 0}
                  onClick={() => handleSelect(option)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option);
                    }
                  }}
                  className={`
                    px-3 py-2 cursor-pointer flex items-center justify-between
                    ${
                      option.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : index === highlightedIndex
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className='flex-1 truncate'>
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                  {selectedOption?.value === option.value && (
                    <CheckIcon className='h-4 w-4 text-blue-600' />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  );
};
