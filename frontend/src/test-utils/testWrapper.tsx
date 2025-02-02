"use client";

import { AuthProvider } from '../lib/auth';
import { ReactNode } from 'react';

export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
