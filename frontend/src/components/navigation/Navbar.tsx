"use client";

import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to log out');
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Coaching
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Coaching
            </Link>
          </div>

          <div className="flex items-center space-x-4" data-testid="nav-links">
            {error && (
              <p className="text-sm text-red-500" role="alert">{error}</p>
            )}
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Teams
                </Link>
                <Link 
                  href="/profile" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Profile
                </Link>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link href="/register">
                  <Button>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
