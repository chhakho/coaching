import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from './RegisterForm';
import { TestWrapper } from '../../test-utils/testWrapper';
import { useAuth } from '@/lib/auth';

// Mock auth hook
const mockRegister = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    register: mockRegister
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders all registration fields and create account button', () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.submit(screen.getByRole('form'));
      
      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(await screen.findByText('Username is required')).toBeInTheDocument();
      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: 'invalid-email' }
      });
      fireEvent.submit(screen.getByRole('form'));
      
      expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    });

    it('shows error for invalid username format', async () => {
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: 'user@name!' }
      });
      fireEvent.submit(screen.getByRole('form'));
      
      expect(await screen.findByText('Username can only contain letters, numbers, underscores, and dashes')).toBeInTheDocument();
    });

    it('shows error for short password', async () => {
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: '12345' }
      });
      fireEvent.submit(screen.getByRole('form'));
      
      expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    it('calls register function with correct data', async () => {
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Name'), {
        target: { value: validFormData.name }
      });
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: validFormData.username }
      });
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: validFormData.email }
      });
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: validFormData.password }
      });
      
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(validFormData);
      });
    });

    it('displays error message on registration failure', async () => {
      const error = new Error('Registration failed');
      mockRegister.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'error');
      
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Name'), {
        target: { value: validFormData.name }
      });
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: validFormData.username }
      });
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: validFormData.email }
      });
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: validFormData.password }
      });
      
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Registration error:', error);
        expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('displays server error message when available', async () => {
      const errorMessage = 'Username already taken';
      mockRegister.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: errorMessage } }
      });
      
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Name'), {
        target: { value: validFormData.name }
      });
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: validFormData.username }
      });
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: validFormData.email }
      });
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: validFormData.password }
      });
      
      fireEvent.submit(screen.getByRole('form'));
      
      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });

    it('clears error message on new submission attempt', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Registration failed'));
      
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      // First submission - trigger error
      fireEvent.input(screen.getByLabelText('Name'), {
        target: { value: validFormData.name }
      });
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: validFormData.username }
      });
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: validFormData.email }
      });
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: validFormData.password }
      });
      fireEvent.submit(screen.getByRole('form'));
      
      const errorElement = await screen.findByText('Registration failed. Please try again.');
      expect(errorElement).toBeInTheDocument();
      
      // Second submission attempt
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: 'new@example.com' }
      });
      fireEvent.submit(screen.getByRole('form'));
      
      await waitFor(() => {
        expect(errorElement).not.toBeInTheDocument();
      });
    });

    it('disables submit button while submitting', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<TestWrapper><RegisterForm /></TestWrapper>);
      
      fireEvent.input(screen.getByLabelText('Name'), {
        target: { value: validFormData.name }
      });
      fireEvent.input(screen.getByLabelText('Username'), {
        target: { value: validFormData.username }
      });
      fireEvent.input(screen.getByLabelText('Email'), {
        target: { value: validFormData.email }
      });
      fireEvent.input(screen.getByLabelText('Password'), {
        target: { value: validFormData.password }
      });
      
      const submitButton = screen.getByRole('button', { name: 'Create account' });
      fireEvent.submit(screen.getByRole('form'));
      
      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Additional Security Features', () => {
    it.todo('validates password strength requirements');
    it.todo('implements username availability check');
    it.todo('prevents registration with common passwords');
    it.todo('implements email verification workflow');
    it.todo('sanitizes user inputs');
  });

  describe('Accessibility', () => {
    it.todo('maintains focus management after form submission');
    it.todo('announces form errors to screen readers');
    it.todo('supports keyboard navigation between fields');
    it.todo('provides clear error messages for assistive technologies');
  });

  describe('Edge Cases', () => {
    it.todo('handles connection timeout gracefully');
    it.todo('handles duplicate email/username errors');
    it.todo('validates maximum field lengths');
    it.todo('prevents XSS in error messages');
    it.todo('handles special characters in name fields');
  });

  describe('Browser Integration', () => {
    it.todo('supports password manager integration');
    it.todo('handles browser autofill events');
    it.todo('preserves form state during page refresh');
    it.todo('supports password visibility toggle');
  });
});
