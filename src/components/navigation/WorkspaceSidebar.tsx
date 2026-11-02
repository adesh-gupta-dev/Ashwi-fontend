import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

type Props = { admin?: boolean; onSettings?: () => void; onNewChat?: () => void; onNavigate?: () => void };
type NavItem = { label: string; route: string; path: string; icon: React.ComponentProps<typeof Feather>['name'] };

export function WorkspaceSidebar({ admin = false, onSettings, onNewChat, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const { colors, scheme, toggleScheme } = useTheme();
  const router = useRouter();
  const path = usePathname();
  const items: NavItem[] = [
    ...(user?.role === 'admin' ? [{ label: 'Dashboard', route: '/admin', path: '/admin', icon: 'grid' as const }] : []),
    { label: 'AI Workspace', route: '/(user)/chat', path: '/chat', icon: 'message-square' },
    ...(admin ? [
      { label: 'Users', route: '/admin/users', path: '/admin/users', icon: 'users' as const },
      { label: 'Chat Logs', route: '/admin/chats', path: '/admin/chats', icon: 'clock' as const },
      { label: 'System Logs', route: '/admin/logs', path: '/admin/logs', icon: 'activity' as const },
    ] : [{ label: 'History', route: '/(user)/chat/history', path: '/chat/history', icon: 'clock' as const }]),
  ];
  function go(route: string) { router.push(route); onNavigate?.(); }
  return <View className="h-full w-64 overflow-hidden rounded-r-2xl border-r border-line bg-panel">
    <AmbientBackground subtle />
    <View className="min-h-24 flex-row items-center gap-3 border-b border-line px-6 py-6"><Image source={require('../../../assets/ashwi-logo.png')} style={{width:36,height:36}} resizeMode="contain" /><View><Text className="font-geist text-2xl font-bold tracking-tight text-ink">Ashwi</Text><Text className="mt-1 font-geist text-[10px] tracking-widest text-muted">AI WORKSPACE</Text></View></View>
    <ScrollView className="flex-1" contentContainerClassName="gap-1 px-2 py-4">
      {items.map(item => <Pressable key={item.route} onPress={() => go(item.route)} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected: path === item.path }} className={`min-h-12 flex-row items-center gap-4 rounded-md px-4 ${path === item.path ? 'bg-brand/10' : ''}`}>
        <Feather name={item.icon} size={18} color={path === item.path ? colors.primary : colors.onSurfaceVariant} /><Text className={`font-geist text-[13px] ${path === item.path ? 'font-semibold text-brand' : 'text-muted'}`}>{item.label}</Text>
      </Pressable>)}
      {onNewChat && <Pressable onPress={() => { onNewChat(); onNavigate?.(); }} className="min-h-12 flex-row items-center gap-4 px-4"><Feather name="plus" color={colors.onSurfaceVariant} size={18} /><Text className="font-geist text-[13px] text-muted">New conversation</Text></Pressable>}
      {onSettings && <Pressable onPress={() => { onSettings(); onNavigate?.(); }} className="min-h-12 flex-row items-center gap-4 px-4"><Feather name="settings" color={colors.onSurfaceVariant} size={18} /><Text className="font-geist text-[13px] text-muted">Settings</Text></Pressable>}
      <Pressable onPress={() => go('/(marketing)/about')} className="min-h-12 flex-row items-center gap-4 px-4"><Feather name="info" color={colors.onSurfaceVariant} size={18} /><Text className="font-geist text-[13px] text-muted">About Ashwi</Text></Pressable>
    </ScrollView>
    <View className="gap-5 border-t border-line px-6 py-5"><View className="flex-row items-center gap-3"><View className="h-8 w-8 items-center justify-center rounded-full bg-[#ff2600]"><Text className="font-geist text-xs font-semibold text-white">{(user?.name || user?.email || 'A').slice(0,2).toUpperCase()}</Text></View><View className="min-w-0 flex-1"><Text numberOfLines={1} className="font-geist text-xs font-semibold text-ink">{user?.name || user?.email}</Text><Text className="mt-1 font-geist text-[11px] text-muted">{user?.role === 'admin' ? 'Administrator' : 'Your workspace'}</Text></View></View>
      <View className="flex-row justify-between"><Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={toggleScheme} className="min-h-10 flex-row items-center gap-2"><Feather name={scheme === 'dark' ? 'sun' : 'moon'} color={colors.onSurfaceVariant} size={15} /><Text className="font-geist text-xs text-muted">Theme</Text></Pressable><Pressable onPress={() => { logout(); router.replace('/(auth)/login'); }} className="min-h-10 flex-row items-center gap-2"><Feather name="log-out" color={colors.onSurfaceVariant} size={15} /><Text className="font-geist text-xs text-muted">Sign out</Text></Pressable></View>
    </View>
  </View>;
}
