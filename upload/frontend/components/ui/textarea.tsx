import * as React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  fullWidth?: boolean;
  responsive?: boolean;
  error?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className = '', 
    size = 'default',
    variant = 'default',
    fullWidth = false,
    responsive = false,
    error = false,
    resize = 'vertical',
    ...props 
  }, ref) => {
    
    const baseStyles = 'flex rounded-lg border transition-all duration-200 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50';
    
    const variants = {
      default: `border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      filled: `border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:border-primary-500 focus-visible:ring-primary-500 focus-visible:bg-white ${error ? 'bg-red-50 border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
      outline: `border-2 border-primary-200 bg-transparent text-gray-900 hover:border-primary-300 focus-visible:border-primary-500 focus-visible:ring-primary-500 ${error ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' : ''}`,
    };
    
    const sizes = {
      sm: responsive ? 'min-h-[60px] sm:min-h-[70px] px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm' : 'min-h-[60px] px-2 py-1.5 text-xs',
      default: responsive ? 'min-h-[80px] sm:min-h-[90px] px-3 sm:px-4 py-2 text-sm sm:text-base' : 'min-h-[80px] px-3 py-2 text-sm',
      lg: responsive ? 'min-h-[100px] sm:min-h-[120px] px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base' : 'min-h-[120px] px-4 py-2.5 text-base',
    };
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    const widthClass = fullWidth ? 'w-full' : responsive ? 'w-full sm:max-w-md md:max-w-lg' : 'w-full max-w-md';
    
    return (
      <textarea
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${resizeClasses[resize]} ${widthClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

