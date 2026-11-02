import React from 'react';
import { Stack } from 'expo-router';
import { RouteGate } from '@/components/navigation/RouteGate';

export default function AuthLayout() {
  return (
    <RouteGate redirectIfAuthed>
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}

