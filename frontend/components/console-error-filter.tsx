'use client';

import { useEffect } from 'react';

export default function ConsoleErrorFilter() {
  useEffect(() => {
    // Suppress browser extension errors that don't affect the application
    const originalError = console.error;
    console.error = function (...args: any[]) {
      const message = args.join(' ');
      // Filter out browser extension errors
      if (
        message.includes('runtime.lastError') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Could not establish connection') ||
        message.includes('Extension context invalidated')
      ) {
        return; // Suppress these errors
      }
      originalError.apply(console, args);
    };

    // Also filter runtime.lastError warnings
    const originalWarn = console.warn;
    console.warn = function (...args: any[]) {
      const message = args.join(' ');
      if (
        message.includes('runtime.lastError') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Could not establish connection')
      ) {
        return; // Suppress these warnings
      }
      originalWarn.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

