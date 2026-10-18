"use client";

import { useBrowserStorage } from './useBrowserStorage';

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useBrowserStorage('sessionStorage', key, initialValue);
}
