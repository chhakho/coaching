import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Navbar from './Navbar';
import { TestWrapper } from '../../test-utils/testWrapper';
import { User } from '@/types/api';

const mockLogout = jest.fn();
const mockRouter = { push: jest.fn() };

interface AuthState {
  user: User | null;
  loading: boolean;
  logout: typeof mockLogout;
}

// Mock auth hook with default values
const mockUseAuth = jest.fn<AuthState, []>(() => ({
  user: null,
  loading: false,
  logout: mockLogout
}));

jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

describe('Navbar', () => {
  beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
    mockUseAuth.mockImplementation(() => ({
      user: null,
      loading: false,
      logout: mockLogout
    }));
  });

  describe('Unauthenticated State', () => {
    it('renders sign in and sign up links when user is not authenticated', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Coaching' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
      mockUseAuth.mockImplementation(() => ({
        user: { id: '1', username: 'testuser', email: 'test@example.com', name: 'Test User' },
        loading: false,
        logout: mockLogout
      }));
    });

    it('renders user menu and logout button when authenticated', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );
      
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Teams' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    });

    it('calls logout function and redirects when signing out', async () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );
      
      const logoutButton = screen.getByText('Sign Out');
      await act(async () => {
        fireEvent.click(logoutButton);
      });
      
      expect(mockLogout).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('handles errors during logout gracefully', async () => {
      const error = new Error('Logout failed');
      mockLogout.mockRejectedValueOnce(error);

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );
      
      const logoutButton = screen.getByText('Sign Out');
      await act(async () => {
        fireEvent.click(logoutButton);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
      mockUseAuth.mockImplementation(() => ({
        user: null,
        loading: true,
        logout: mockLogout
      }));
    });

    it('shows loading state while authenticating', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // In loading state, only the brand should be visible
      expect(screen.getByRole('link', { name: 'Coaching' })).toBeInTheDocument();
      expect(screen.queryByTestId('nav-links')).not.toBeInTheDocument();
    });
  });
});
