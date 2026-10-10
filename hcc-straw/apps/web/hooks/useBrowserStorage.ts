"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type StorageName = 'localStorage' | 'sessionStorage';
export interface StorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

// The first render is identical on server and client; browser data loads after mount.
export function useBrowserStorage<T>(
  storageName: StorageName,
  key: string,
  initialValue: T,
  options: StorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const configRef = useRef({ initialValue, ...options });
  configRef.current = { initialValue, ...options };
  const [stored, setStored] = useState({ key, value: initialValue });
  const currentRef = useRef(stored);

  const readValue = useCallback((): T => {
    try {
      if (typeof window !== 'undefined') {
        const item = window[storageName].getItem(key);
        if (item !== null) return (configRef.current.deserializer ?? JSON.parse)(item) as T;
      }
    } catch (error) {
      console.warn(`Unable to read ${storageName} key "${key}"`, error);
    }
    return configRef.current.initialValue;
  }, [key, storageName]);

  useEffect(() => {
    const next = { key, value: readValue() };
    currentRef.current = next;
    setStored(next);
  }, [key, readValue]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    const previous = currentRef.current.key === key ? currentRef.current.value : readValue();
    const valueToStore = typeof value === 'function' ? (value as (prev: T) => T)(previous) : value;
    const next = { key, value: valueToStore };
    // Update immediately so multiple functional writes in a batch see one another.
    currentRef.current = next;
    setStored(next);
    try {
      if (typeof window !== 'undefined') {
        window[storageName].setItem(key, (configRef.current.serializer ?? JSON.stringify)(valueToStore));
      }
    } catch (error) {
      console.warn(`Unable to write ${storageName} key "${key}"`, error);
    }
  }, [key, readValue, storageName]);

  const removeValue = useCallback(() => {
    const next = { key, value: configRef.current.initialValue };
    currentRef.current = next;
    setStored(next);
    try {
      if (typeof window !== 'undefined') window[storageName].removeItem(key);
    } catch (error) {
      console.warn(`Unable to remove ${storageName} key "${key}"`, error);
    }
  }, [key, storageName]);

  return [stored.key === key ? stored.value : initialValue, setValue, removeValue];
}
