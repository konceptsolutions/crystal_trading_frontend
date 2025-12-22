'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousPathname = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only trigger transition if pathname actually changed (not on initial mount)
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Start fade out with current content
      setIsTransitioning(true);
      
      // After fade out completes (200ms), update content and fade in
      timeoutRef.current = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 200); // Match fade out duration
    } else {
      // Initial mount - no transition, just show content
      setDisplayChildren(children);
      previousPathname.current = pathname;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, children]);

  return (
    <div
      className={`page-transition-wrapper ${
        isTransitioning ? 'page-transition-out' : 'page-transition-in'
      }`}
    >
      {displayChildren}
    </div>
  );
}

