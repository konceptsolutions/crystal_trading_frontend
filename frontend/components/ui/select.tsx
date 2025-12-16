import * as React from 'react';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  fullWidth?: boolean;
  responsive?: boolean;
  error?: boolean;
  containerClassName?: string;
  hideArrow?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className = '', 
    children, 
    size = 'default', 
    variant = 'default',
    fullWidth = false,
    responsive = false,
    error = false,
    containerClassName = '',
    hideArrow = false,
    ...props 
  }, ref) => {
    
    const baseStyles = 'relative rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50';
    
    const variants = {
      default: `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      filled: `border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:border-primary-500 focus-visible:ring-primary-500 focus-visible:bg-white ${error ? 'bg-red-50 border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      outline: `border-2 border-primary-200 bg-transparent text-gray-900 hover:border-primary-300 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
    };
    
    const sizes = {
      sm: responsive ? 'h-8 sm:h-9 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm' : 'h-8 px-2 py-1 text-xs',
      default: responsive ? 'h-9 sm:h-10 px-3 sm:px-4 py-2 text-sm sm:text-base' : 'h-10 px-3 py-2 text-sm',
      lg: responsive ? 'h-10 sm:h-11 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base' : 'h-11 px-4 py-2.5 text-base',
    };
    
    const widthClass = fullWidth ? 'w-full' : responsive ? 'w-full sm:max-w-xs md:max-w-sm' : 'w-full max-w-xs';
    
    return (
      <div className={`relative ${widthClass} ${containerClassName}`}>
        <select
          className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} appearance-none ${hideArrow ? 'pr-3' : 'pr-8'} ${className}`}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {!hideArrow && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className={`${responsive ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };

