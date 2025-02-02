"use client";

import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useState } from 'react';
import axios from 'axios';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  name: string;
}

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerUser(data);
    } catch (err: unknown) {
      let errorMessage = 'Registration failed. Please try again.';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || errorMessage;
      }
      console.error('Registration error:', err);
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Get started with your coaching journey
        </p>
      </div>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-4"
        role="form"
      >
        <Input
          label="Name"
          {...register('name', {
            required: 'Name is required',
          })}
          error={errors.name?.message}
        />

        <Input
          label="Username"
          {...register('username', {
            required: 'Username is required',
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: 'Username can only contain letters, numbers, underscores, and dashes',
            },
          })}
          error={errors.username?.message}
        />

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
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="/login"
          className="font-medium text-slate-900 hover:underline"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
