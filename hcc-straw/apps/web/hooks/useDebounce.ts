"use client";

import { useEffect, useState, useCallback } from 'react';

interface UseDebounceReturn<T> {
  value: T;
  debounce: (callback: () => void, delay?: number) => void;
}

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounce callback hook
export function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
): T {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timer) {
        clearTimeout(timer);
      }
      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);
      setTimer(newTimer);
    }) as T,
    [callback, delay]
  );

  return debouncedCallback;
}
