import React from 'react';
import '../global.css';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, View } from 'react-native';
import { consoleTerminal } from '@/utils/consoleTerminal';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { bootstrapNotifications } from '@/services/notifications';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import Head from 'expo-router/head';
import { CursorGlow } from '@/components/ui/CursorGlow';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist: require('../assets/Geist.ttf'),
    Inter: require('../assets/Inter.ttf'),
  });
  useEffect(() => {
    void bootstrapNotifications();
  }, []);

  useEffect(() => { if (fontError) consoleTerminal('fonts.load', fontError); }, [fontError]);
  // Expo's static renderer considers bundled fonts ready immediately, while the
  // browser loads them asynchronously. Keep the web tree identical during
  // hydration; native screens can still wait for fonts before rendering.
  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: '#111111', justifyContent: 'center' }}><ActivityIndicator color="#ff2600" /></View>;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary><SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <Head.Provider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
            </Head.Provider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider></AppErrorBoundary>
      <CursorGlow />
    </GestureHandlerRootView>
  );
}
