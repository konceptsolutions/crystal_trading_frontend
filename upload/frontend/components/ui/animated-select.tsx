'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  label,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const dropdownMaxHeight = 240; // max-h-60 = 240px
          
          // Calculate position
          let top = rect.bottom + 4;
          let left = rect.left;
          let width = rect.width;
          
          // Adjust if dropdown would go off bottom of viewport
          if (top + dropdownMaxHeight > viewportHeight) {
            // Try to show above the button instead
            const spaceAbove = rect.top;
            const spaceBelow = viewportHeight - rect.bottom;
            if (spaceAbove > spaceBelow && spaceAbove > dropdownMaxHeight) {
              top = rect.top - dropdownMaxHeight - 4;
            } else {
              // Adjust to fit in viewport
              top = Math.max(4, viewportHeight - dropdownMaxHeight - 4);
            }
          }
          
          // Adjust if dropdown would go off right edge of viewport
          if (left + width > viewportWidth) {
            left = Math.max(4, viewportWidth - width - 4);
          }
          
          // Adjust if dropdown would go off left edge of viewport
          if (left < 0) {
            left = 4;
            // If button is too narrow, use a minimum width
            if (width < 200) {
              width = 200;
            }
          }
          
          setDropdownPosition({
            top,
            left,
            width,
          });
        }
      };
      
      // Initial position update
      updatePosition();
      
      // Use requestAnimationFrame for smooth updates
      const rafId = requestAnimationFrame(updatePosition);
      
      // Update on scroll/resize - use capture phase to catch all scroll events
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Also listen to scroll events on all parent elements
      let parent: HTMLElement | null = buttonRef.current.parentElement;
      const scrollListeners: Array<{ element: HTMLElement; handler: () => void }> = [];
      
      while (parent && parent !== document.body) {
        const handler = () => updatePosition();
        parent.addEventListener('scroll', handler, true);
        scrollListeners.push({ element: parent, handler });
        parent = parent.parentElement;
      }
      
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        scrollListeners.forEach(({ element, handler }) => {
          element.removeEventListener('scroll', handler, true);
        });
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full h-10 px-3 py-2 text-left text-sm
            bg-white border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-all duration-200 ease-out
            flex items-center justify-between
            hover:border-primary-400 hover:shadow-sm
            ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm' : ''}
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={`${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-primary-500' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu - Rendered via Portal to escape container hierarchy */}
        {isOpen && mounted && buttonRef.current && createPortal(
          <div
            ref={dropdownRef}
            className={`
              fixed z-[99999] bg-white border border-gray-200 rounded-md shadow-xl
              overflow-hidden backdrop-blur-sm
              transition-all duration-200 ease-out
              opacity-100 translate-y-0 scale-100 pointer-events-auto
            `}
            role="listbox"
            style={{
              transformOrigin: 'top center',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              width: `${dropdownPosition.width || buttonRef.current?.offsetWidth || 200}px`,
              left: `${dropdownPosition.left || 0}px`,
              top: `${dropdownPosition.top || 0}px`,
              position: 'fixed',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      w-full px-3 py-2.5 text-left text-sm
                      transition-all duration-150 ease-out
                      relative
                      ${
                        isSelected
                          ? 'bg-primary-500 text-white font-medium shadow-sm'
                          : isHighlighted
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    role="option"
                    aria-selected={isSelected}
                    style={{
                      transform: isHighlighted && !isSelected ? 'translateX(2px)' : 'translateX(0)',
                    }}
                  >
                    <span className="relative z-10">{option.label}</span>
                    {isSelected && (
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

