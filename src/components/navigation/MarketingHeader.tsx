import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function MarketingHeader() {
  const router = useRouter(); const { colors, scheme, toggleScheme } = useTheme(); const { isCompact } = useResponsiveLayout();
  const path = usePathname();
  return <View className="flex-row items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-8">
    <Pressable accessibilityRole="link" accessibilityLabel="Ashwi home" onPress={() => router.push('/')} className="flex-row items-center gap-2"><Image source={require('../../../assets/ashwi-logo.png')} style={{width:isCompact?26:36,height:isCompact?26:36}} resizeMode="contain" /><Text className="font-geist text-xl font-bold tracking-tight text-ink">Ashwi</Text></Pressable>
    <View className="flex-row items-center gap-3 sm:gap-5">
      {!isCompact && <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={{borderBottomWidth:path==='/'?2:0,borderColor:colors.primary,paddingVertical:10}}><Text className="font-geist text-xs text-ink">Home</Text></Pressable>}
      <Pressable accessibilityRole="link" onPress={() => router.push('/(marketing)/about')} style={{borderBottomWidth:path==='/about'?2:0,borderColor:colors.primary,paddingVertical:10}}><Text className="font-geist text-xs text-muted">About</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={toggleScheme}><Feather name={scheme === 'dark' ? 'sun' : 'moon'} color={colors.onSurfaceVariant} size={16} /></Pressable>
      <Pressable onPress={() => router.push('/(auth)/login')}><Text className="font-geist text-xs text-ink">Sign in</Text></Pressable>
      {!isCompact && <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/signup')} className="flex-row items-center gap-2 rounded-lg bg-brand px-3 py-3"><Text className="font-geist text-[11px] font-semibold text-white">Get started</Text><Feather name="arrow-right" color="white" size={14} /></Pressable>}
    </View>
  </View>;
}
