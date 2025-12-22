'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input } from './input';
import { Label } from './label';

interface AutocompleteInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddNew?: (value: string) => Promise<void>;
  options: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function AutocompleteInput({
  id,
  label,
  value,
  onChange,
  onAddNew,
  options,
  placeholder,
  className = '',
  required = false,
  disabled = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [isAdding, setIsAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: Log when options change
  useEffect(() => {
    if (id === 'masterPartNo') {
      console.log(`[${id}] Options:`, options.length, 'items', options.slice(0, 5));
      console.log(`[${id}] Filtered options:`, filteredOptions.length, 'items');
    }
  }, [options, filteredOptions, id]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize and update filteredOptions when options or inputValue change
  useEffect(() => {
    // Always update filteredOptions when options change
    if (inputValue.trim() === '') {
      // Show all options when input is empty
      setFilteredOptions(options);
    } else {
      // Filter options based on input
      const filtered = options.filter((opt) =>
        opt.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = async (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() && onAddNew) {
        // Save/add new value on Enter
        setIsAdding(true);
        onAddNew(inputValue.trim())
          .then(() => {
            setInputValue(inputValue.trim());
            onChange(inputValue.trim());
          })
          .catch((error) => {
            console.error('Failed to add new value:', error);
          })
          .finally(() => {
            setIsAdding(false);
          });
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      // Could implement keyboard navigation here if needed
    }
  };

  const handleFocus = () => {
    // Open dropdown - options will update when they load
    setIsOpen(true);
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Prevent default to avoid losing focus
    e.stopPropagation();
    // Open dropdown - options will update when they load
    setIsOpen(true);
  };

  return (
    <div className={`space-y-2 relative ${className}`} ref={wrapperRef}>
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700 block h-5 flex items-center">
        {label} {required && <span className="text-red-500 font-bold ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onClick={handleClick}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isAdding}
          className="border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 h-11"
        />
        {isAdding && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {isOpen && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectOption(option)}
                  className="px-4 py-2 cursor-pointer hover:bg-primary-50 text-gray-900"
                >
                  {option}
                </div>
              ))
            ) : options.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                Loading options...
              </div>
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No matches found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
