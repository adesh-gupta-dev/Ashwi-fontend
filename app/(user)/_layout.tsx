import React from 'react';
import { Stack } from 'expo-router';
import { RouteGate } from '@/components/navigation/RouteGate';

export default function UserLayout() {
  return (
    <RouteGate requireAuth>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}

