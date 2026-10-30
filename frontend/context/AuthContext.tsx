'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, API_URL } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  preferred_name?: string;
  preferred_language: string;
  role: 'user' | 'admin' | 'staff';
  text_size_preference: 'small' | 'medium' | 'large' | 'xlarge';
  reduced_motion: boolean;
  preferred_communication: 'written' | 'spoken' | 'any';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAccessibilitySettings: (settings: { textSize?: Profile['text_size_preference']; reducedMotion?: boolean }) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateAccessibilitySettings: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        // Fallback default
        setProfile({
          id: userId,
          full_name: 'AHEAD User',
          preferred_language: 'en',
          role: 'user',
          text_size_preference: 'medium',
          reduced_motion: false,
          preferred_communication: 'any'
        });
      }
    } catch {
      setProfile({
        id: userId,
        full_name: 'AHEAD User',
        preferred_language: 'en',
        role: 'user',
        text_size_preference: 'medium',
        reduced_motion: false,
        preferred_communication: 'any'
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.access_token);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.access_token);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id, session.access_token);
    }
  };

  const updateAccessibilitySettings = ({ textSize, reducedMotion }: { textSize?: Profile['text_size_preference']; reducedMotion?: boolean }) => {
    if (profile) {
      setProfile({
        ...profile,
        ...(textSize ? { text_size_preference: textSize } : {}),
        ...(reducedMotion !== undefined ? { reduced_motion: reducedMotion } : {}),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, updateAccessibilitySettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
