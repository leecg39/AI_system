// @TASK P0-T0.2 - Frontend 초기화: Vitest Setup

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup();
});
