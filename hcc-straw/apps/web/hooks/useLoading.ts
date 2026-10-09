"use client";

import { useEffect, useState } from 'react';

export function useLoading(initialState: boolean = false) {
  const [loading, setLoading] = useState(initialState);

  return {
    loading,
    setLoading,
    startLoading: () => setLoading(true),
    stopLoading: () => setLoading(false),
    toggleLoading: () => setLoading((prev) => !prev),
  };
}

// Hook for managing loading states with async operations
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = false
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async (): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    error,
    loading,
    execute,
  };
}
