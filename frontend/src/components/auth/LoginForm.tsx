"use client";

import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useState } from 'react';
import axios from 'axios';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data.email, data.password);
    } catch (err: unknown) {
      let errorMessage = 'Invalid email or password';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || errorMessage;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please sign in to your account
        </p>
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-4"
        role="form"
      >
        <Input
          label="Email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
          error={errors.password?.message}
        />

        {error && (
          <p role="alert" className="text-sm text-red-500">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a
          href="/register"
          className="font-medium text-slate-900 hover:underline"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}