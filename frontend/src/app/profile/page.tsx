"use client";

import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import { userApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  username: string;
  email: string;
  name: string;
}

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError('');
      if (user?.id) {
        await userApi.updateUser(user.id, data);
        await checkAuth(); // Refresh user state
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || !window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await userApi.deleteUser(user.id);
      router.push('/login');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
                className="!bg-red-50 !text-red-600 hover:!bg-red-100"
              >
                Delete Account
              </Button>

              <Button
                type="submit"
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
