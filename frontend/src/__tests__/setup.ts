// @TASK P0-T0.2 - Frontend 초기화: Vitest Setup

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class ResizeObserverMock {
  observe(_: Element) {}
  unobserve(_: Element) {}
  disconnect() {}
}

class StorageMock implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
}

const storageIsValid =
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined' &&
  typeof window.localStorage.setItem === 'function';

if (!storageIsValid) {
  const storageMock = new StorageMock();

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      configurable: true,
      value: storageMock,
    });
  }

  Object.defineProperty(globalThis, 'localStorage', {
    writable: true,
    configurable: true,
    value: storageMock,
  });
}

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup();
});
