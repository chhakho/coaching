import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';
import { TestWrapper } from '../test-utils/testWrapper';

// Mock auth hook
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );
    
    expect(screen.getByText(/Welcome to Coaching Platform/i)).toBeInTheDocument();
  });
});
