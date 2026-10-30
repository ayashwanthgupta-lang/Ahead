'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  const textSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[profile?.text_size_preference || 'medium'];

  const motionClass = profile?.reduced_motion ? 'motion-reduce' : '';

  return (
    <div className={`min-h-screen flex flex-col ${textSizeClass} ${motionClass} antialiased selection:bg-blue-600 selection:text-white`}>
      {children}
    </div>
  );
}

