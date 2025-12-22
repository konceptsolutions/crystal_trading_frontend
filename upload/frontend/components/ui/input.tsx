import * as React from 'react';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  fullWidth?: boolean;
  responsive?: boolean;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    type,
    size = 'default',
    variant = 'default',
    fullWidth = false,
    responsive = false,
    error = false,
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    // Filter out attributes injected by browser extensions that cause React warnings
    const {
      fdprocessedid,
      'data-lastpass-icon-root': dataLastpassIconRoot,
      'data-1p-ignore': data1pIgnore,
      'data-lpignore': dataLpignore,
      ...validProps
    } = props as any;

    const baseStyles = 'flex rounded-lg border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50';
    
    const variants = {
      default: `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      filled: `border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:border-primary-500 focus-visible:ring-primary-500 focus-visible:bg-white ${error ? 'bg-red-50 border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      outline: `border-2 border-primary-200 bg-transparent text-gray-900 hover:border-primary-300 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
    };
    
    const sizes = {
      sm: responsive ? 'h-8 sm:h-9 text-xs sm:text-sm' : 'h-8 text-xs',
      default: responsive ? 'h-9 sm:h-10 text-sm sm:text-base' : 'h-10 text-sm',
      lg: responsive ? 'h-10 sm:h-11 text-sm sm:text-base' : 'h-11 text-base',
    };
    
    const padding = {
      sm: leftIcon ? 'pl-8 pr-3' : rightIcon ? 'pl-3 pr-8' : 'px-3',
      default: leftIcon ? 'pl-10 pr-4' : rightIcon ? 'pl-4 pr-10' : 'px-4',
      lg: leftIcon ? 'pl-12 pr-5' : rightIcon ? 'pl-5 pr-12' : 'px-5',
    };
    
    const iconSizes = {
      sm: 'w-4 h-4',
      default: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    
    const iconPositions = {
      sm: leftIcon ? 'left-2.5' : 'right-2.5',
      default: leftIcon ? 'left-3' : 'right-3',
      lg: leftIcon ? 'left-4' : 'right-4',
    };
    
    const widthClass = fullWidth ? 'w-full' : responsive ? 'w-full sm:max-w-sm md:max-w-md' : 'w-full max-w-sm';

    return (
      <div className={`relative ${widthClass}`}>
        {leftIcon && (
          <div className={`absolute inset-y-0 left-0 flex items-center ${iconPositions[size]} pointer-events-none`}>
            <div className={`${iconSizes[size]} text-gray-400`}>
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          type={type}
          className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${padding[size]} ${widthClass} ${className}`}
          ref={ref}
          suppressHydrationWarning
          {...validProps}
        />
        
        {rightIcon && (
          <div className={`absolute inset-y-0 right-0 flex items-center ${iconPositions[size]} pointer-events-none`}>
            <div className={`${iconSizes[size]} text-gray-400`}>
              {rightIcon}
            </div>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

