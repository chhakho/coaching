import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import { authApi, userApi } from './api';

// Access mockRouter from jest.setup.js
declare global {
  var mockRouter: {
    push: jest.Mock;
    replace: jest.Mock;
    refresh: jest.Mock;
    back: jest.Mock;
    forward: jest.Mock;
    prefetch: jest.Mock;
    pathname: string;
  };
}

// Mock API calls
jest.mock('./api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  },
  userApi: {
    getCurrentUser: jest.fn()
  }
}));

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</span>
      <button onClick={async () => {
        try {
          await auth.login('test@example.com', 'password');
        } catch (e) {
          throw e;
        }
      }}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });
  });

  describe('Initial Load', () => {
    it('checks auth status on mount', async () => {
      const mockUser = { id: '1', email: 'test@example.com', username: 'test', name: 'Test User' };
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(userApi.getCurrentUser).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    it('handles failed auth check', async () => {
      (userApi.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('Login', () => {
    const mockLoginResponse = {
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com', username: 'test', name: 'Test User' }
    };

    it('updates auth state after successful login', async () => {
      (authApi.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      (userApi.getCurrentUser as jest.Mock)
        .mockResolvedValueOnce(null) // Initial load
        .mockResolvedValueOnce(mockLoginResponse.user); // After login

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        });
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockLoginResponse.user));
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles login failure', async () => {
      const error = new Error('Authentication failed: Invalid email or password');
      (authApi.login as jest.Mock).mockRejectedValueOnce(error);
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(null); // Initial load
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let authContextValue: any;
      const TestContextCapture = () => {
        authContextValue = useAuth();
        return <TestComponent />;
      };

      render(
        <AuthProvider>
          <TestContextCapture />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      let thrownError;
      try {
        await authContextValue.login('test@example.com', 'password');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toEqual(error);
      expect(consoleSpy).toHaveBeenCalledWith('[AuthContext] Login error:', error);
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      consoleSpy.mockRestore();
    });

    it('redirects to dashboard after successful login', async () => {
      (authApi.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockLoginResponse.user);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Setup initial authenticated state
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        username: 'test',
        name: 'Test User'
      });
    });

    it('clears auth state after successful logout', async () => {
      (authApi.logout as jest.Mock).mockResolvedValueOnce({});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth state
      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(authApi.logout).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout failure gracefully', async () => {
      const error = new Error('Logout failed');
      (authApi.logout as jest.Mock).mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth state
      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', error);
      });

      consoleSpy.mockRestore();
    });

    it('redirects to login page after logout', async () => {
      (authApi.logout as jest.Mock).mockResolvedValueOnce({});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth state
      await waitFor(() => {
        expect(screen.getByTestId('user')).not.toHaveTextContent('null');
      });

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Protected Routes', () => {
    it('redirects to login when accessing protected route without auth', async () => {
      (userApi.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Not authenticated'));
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });

    it('allows access to protected route when authenticated', async () => {
      const mockUser = { id: '1', email: 'test@example.com', username: 'test', name: 'Test User' };
      (userApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });
  });
});
