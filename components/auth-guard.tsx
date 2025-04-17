'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        // Check if user is an admin
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !adminUser) {
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }

        // Update last login time
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', session.user.id);

        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AuthGuard:useEffect:AuthCheck] Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
