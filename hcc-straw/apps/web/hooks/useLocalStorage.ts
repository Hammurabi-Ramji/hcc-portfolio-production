"use client";

import { useBrowserStorage, type StorageOptions } from './useBrowserStorage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useBrowserStorage('localStorage', key, initialValue, options);
}
