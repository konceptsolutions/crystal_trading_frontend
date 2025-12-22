import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon' | 'xs';
  responsive?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', responsive = false, fullWidth = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:ring-primary-500 shadow-soft hover:shadow-medium active:scale-95 active:bg-primary-700',
      destructive: 'bg-red-600 text-white hover:bg-red-700 hover:text-white focus:ring-red-500 shadow-soft hover:shadow-medium active:scale-95 active:bg-red-800',
      outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 focus:ring-primary-500 active:scale-95 active:bg-primary-100',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:text-gray-900 focus:ring-gray-500 active:scale-95 active:bg-gray-300',
      ghost: 'text-gray-700 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-500 active:scale-95 active:bg-primary-100',
      link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 focus:ring-primary-500 p-0 active:text-primary-800',
      success: 'bg-green-600 text-white hover:bg-green-700 hover:text-white focus:ring-green-500 shadow-soft hover:shadow-medium active:scale-95 active:bg-green-800',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white focus:ring-yellow-500 shadow-soft hover:shadow-medium active:scale-95 active:bg-yellow-700',
    };
    
    const sizes = {
      xs: 'h-7 px-2 py-1 text-xs',
      sm: 'h-8 px-3 py-1.5 text-sm',
      default: responsive ? 'h-9 sm:h-10 px-3 sm:px-4 py-2 text-sm sm:text-base' : 'h-10 px-4 py-2 text-sm',
      lg: responsive ? 'h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-sm sm:text-base' : 'h-11 px-6 py-2.5 text-base',
      xl: responsive ? 'h-11 sm:h-12 px-6 sm:px-8 py-3 text-base sm:text-lg' : 'h-12 px-8 py-3 text-lg',
      icon: responsive ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10',
    };
    
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

