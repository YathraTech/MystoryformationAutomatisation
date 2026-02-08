'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
  isLoaded: boolean;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [isLoaded, setIsLoaded] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const currentValueRef = useRef<T>(initialValue);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as T;
        currentValueRef.current = parsed;
        setStoredValue(parsed);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  // Write to localStorage without triggering React state updates
  // This prevents render loops when used with form auto-save
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(currentValueRef.current) : value;
        currentValueRef.current = valueToStore;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      currentValueRef.current = initialValue;
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isLoaded,
  };
}
