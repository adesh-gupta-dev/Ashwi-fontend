import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppButton } from '@/components/ui/AppButton';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { MarketingHeader } from '@/components/navigation/MarketingHeader';
import { useTheme } from '@/providers/ThemeProvider';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export function HomeScreen() {
  const router = useRouter(); const { colors } = useTheme(); const { isWide, isCompact } = useResponsiveLayout();
  return <Screen padded={false}><MarketingHeader />
    <View className="w-full max-w-[1280px] self-center px-5 pb-12 pt-12 sm:px-8 lg:pt-20">
      <View className={isWide ? 'flex-row items-center gap-14 pb-20' : 'gap-10 pb-12'}>
        <View className="min-w-0 gap-6" style={isWide ? {flex:1} : undefined}>
          <View className="self-start rounded-full border border-line px-3 py-2"><Text className="font-geist text-[10px] uppercase tracking-widest text-brand">Your intelligence, orchestrated</Text></View>
          <View><Text className={`font-geist font-semibold tracking-[-2px] text-ink ${isCompact ? 'text-[42px] leading-[48px]' : 'text-[56px] leading-[64px]'}`}>One workspace.</Text><Text className={`font-geist font-semibold tracking-[-2px] text-brand ${isCompact ? 'text-[42px] leading-[48px]' : 'text-[56px] leading-[64px]'}`}>Infinite intelligence.</Text></View>
          <Text className="max-w-[440px] font-body text-base leading-7 text-muted">Ashwi is an AI workspace for professionals. Use profession-aware AI assistants, explore ideas, and keep every conversation in one focused space.</Text>
          <View className="flex-row flex-wrap gap-3"><AppButton label="Create workspace" onPress={() => router.push('/(auth)/signup')} /><AppButton label="Meet Ashwi" variant="secondary" onPress={() => router.push('/(marketing)/about')} /></View>
          <View className="flex-row flex-wrap gap-4"><Text className="font-geist text-xs text-muted">✓ Specialized expertise</Text><Text className="font-geist text-xs text-muted">✓ Conversation history</Text></View>
        </View>
        <View className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel" style={isWide ? {flex:1} : undefined}>
          <View className="flex-row items-center justify-between border-b border-line px-5 py-4"><View className="flex-row items-center gap-2"><Feather name="cpu" color={colors.primary} size={17} /><Text className="font-geist text-sm font-semibold text-ink">Ashwi workspace</Text></View><Text className="font-geist text-[10px] text-muted">A glimpse inside</Text></View>
          <View className="flex-row gap-2 border-b border-line p-4"><View className="rounded border border-brand/30 bg-brand/10 px-3 py-2"><Text className="font-geist text-[10px] text-brand">Software Engineer</Text></View><View className="rounded border border-line px-3 py-2"><Text className="font-geist text-[10px] text-muted">Strategist</Text></View></View>
          <View className="gap-5 p-5"><View className="ml-6 rounded-lg border border-line bg-elevated p-4"><Text className="font-body text-sm leading-6 text-ink">How should I structure my next React Native app?</Text></View><View className="flex-row items-start gap-3"><View className="h-7 w-7 items-center justify-center rounded-full bg-brand"><Feather name="cpu" color="white" size={14} /></View><View className="min-w-0 flex-1"><Text className="font-body text-sm leading-6 text-ink">Start with a clear foundation. Keep your screens, shared components, and data services organized by purpose.</Text><View className="mt-4 gap-2 rounded-md border border-line bg-canvas p-4"><Text className="font-geist text-xs text-brand">app/ → navigation</Text><Text className="font-geist text-xs text-muted">components/ → shared UI</Text><Text className="font-geist text-xs text-muted">services/ → your data</Text></View></View></View></View>
          <View className="m-4 flex-row items-center justify-between gap-3 rounded-lg border border-line p-3"><Text className="min-w-0 flex-1 font-geist text-xs text-muted">Your next idea starts here...</Text><Pressable accessibilityRole="button" accessibilityLabel="Open workspace" onPress={() => router.push('/(user)/chat')} className="rounded bg-brand p-2"><Feather name="arrow-right" color="white" size={16} /></Pressable></View>
        </View>
      </View>
      <View className="border-t border-line pt-10"><Text className="mb-3 font-geist text-xs uppercase tracking-widest text-brand">Built around your work</Text><Text className="mb-7 font-geist text-3xl font-semibold tracking-tight text-ink">Less switching. More thinking.</Text>
        <View className={isWide ? 'flex-row gap-5' : 'gap-4'}>{[
          {icon:'briefcase' as const,title:'The right expertise',description:'Choose a profession to bring focus and context to every question.'},
          {icon:'clock' as const,title:'Every idea, within reach',description:'Return to previous conversations and keep your work moving.'},
          {icon:'shield' as const,title:'A workspace you control',description:'Manage your account and review access with clear admin tools.'},
        ].map(item => <View key={item.title} className="min-w-0 gap-4 rounded-2xl border border-line bg-panel p-6" style={isWide ? {flex:1} : undefined}><Feather name={item.icon} color={colors.primary} size={24} /><Text className="font-geist text-lg font-semibold text-ink">{item.title}</Text><Text className="font-body text-sm leading-6 text-muted">{item.description}</Text></View>)}</View>
      </View>
      <View className="mt-10 gap-6 overflow-hidden rounded-2xl border border-brand/40 bg-brand/5 p-7 sm:p-8"><AmbientBackground /><View><Text className="font-geist text-2xl font-semibold tracking-tight text-ink">Make room for your next great idea.</Text><Text className="mt-3 font-body text-sm leading-6 text-muted">Your workspace is just a conversation away.</Text></View><View className="self-start"><AppButton label="Get started" onPress={() => router.push('/(auth)/signup')} /></View></View>
    </View>
    <View className="flex-row flex-wrap justify-between gap-3 border-t border-line bg-panel px-6 py-6"><Text className="font-geist text-sm font-semibold text-brand">Ashwi</Text><Text className="font-geist text-xs text-muted">Built by Adesh Gupta and Saloni Singh · BCA graduates</Text></View>
  </Screen>;
}
