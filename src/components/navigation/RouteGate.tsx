import React from 'react';
import { Redirect } from 'expo-router';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { useAuth } from '@/providers/AuthProvider';

type RouteGateProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectIfAuthed?: boolean;
};

export function RouteGate({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectIfAuthed = false,
}: RouteGateProps) {
  const { user, isHydrated } = useAuth();

  if (!isHydrated) {
    return <FullScreenLoader />;
  }

  if (redirectIfAuthed && user) {
    return <Redirect href="/(user)/chat" />;
  }

  if (requireAuth && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Redirect href="/(user)/chat" />;
  }

  return <>{children}</>;
}

