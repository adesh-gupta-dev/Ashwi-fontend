import React from 'react';
import { Stack } from 'expo-router';
import { RouteGate } from '@/components/navigation/RouteGate';

export default function AdminLayout() {
  return (
    <RouteGate requireAuth requireAdmin>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}

