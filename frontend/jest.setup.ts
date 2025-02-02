import '@testing-library/jest-dom';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/'
};

// Add type declarations for global mockRouter
declare global {
  var mockRouter: typeof mockRouter;
}

// Export mockRouter for test access
global.mockRouter = mockRouter;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter() {
    return mockRouter;
  },
  usePathname() {
    return '/';
  }
}));
