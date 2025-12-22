import * as React from 'react';
import { createPortal } from 'react-dom';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open: controlledOpen, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open && mounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, mounted]);

  if (!open || !mounted || typeof window === 'undefined') return null;

  const dialogContent = (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed' }}>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          onClick={() => handleOpenChange(false)}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999
          }}
        />
        <div className="relative z-[10000] w-full max-w-md sm:w-auto sm:h-auto flex items-center justify-center" style={{ zIndex: 10000 }}>
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );

  return createPortal(dialogContent, document.body);
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  return (
    <div
      ref={ref}
      className={`w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto relative z-[10000] grid gap-4 border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl rounded-lg transition-all duration-300 ${className}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        zIndex: 10000
      }}
      {...props}
    >
      {children}
      <button
        className="absolute right-3 sm:right-4 top-3 sm:top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-2xl sm:text-xl w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center"
        onClick={() => context.onOpenChange(false)}
      >
        ×
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
});
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-500 ${className}`}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

const DialogFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

