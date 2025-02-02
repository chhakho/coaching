"use client";

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
          Welcome to Coaching Platform
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Join our platform to start your coaching journey
        </p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            size="lg"
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push('/register')}
            size="lg"
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}
