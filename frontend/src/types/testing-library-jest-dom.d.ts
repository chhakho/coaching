/// <reference types="jest" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare global {
  namespace jest {
    interface Matchers<R = void, T = {}> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  }
}

declare module '@jest/expect' {
  interface Matchers<R = void, T = {}> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

export {}
