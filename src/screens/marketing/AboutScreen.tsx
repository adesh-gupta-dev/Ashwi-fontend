import React from 'react';
import { MarketingHeader } from '@/components/navigation/MarketingHeader';
import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AppButton } from '@/components/ui/AppButton';

export function AboutScreen() {
 const router = useRouter(); const { colors } = useTheme(); const { isWide, isCompact } = useResponsiveLayout();
 return <Screen padded={false}>
  <MarketingHeader />
  <View className="w-full max-w-[1280px] self-center px-4 pb-10 sm:px-6">
   <View className="items-center pb-12 pt-14 lg:pb-24 lg:pt-20">
    <View className="mb-5 rounded-full border border-brand/30 bg-brand/10 px-4 py-2"><Text className="font-geist text-[10px] font-semibold uppercase tracking-widest text-brand">Meet Ashwi</Text></View>
    <Text className={`max-w-[960px] text-center font-geist font-bold tracking-[-1.5px] text-ink ${isCompact ? 'text-[36px] leading-[42px]' : 'text-[58px] leading-[64px]'}`}>AI that works <Text className="text-brand">with you.</Text></Text>
    <Text className="mt-6 max-w-[760px] text-center font-body text-[16px] leading-7 text-muted">Ashwi brings AI tools and profession-aware assistants together in one workspace, so you can move from a question to a useful next step without losing the thread.</Text>
    <View className="mt-9 flex-row flex-wrap justify-center gap-3"><AppButton label="Explore Platform" onPress={() => router.push('/(user)/chat')} /><AppButton label="Create workspace" variant="secondary" onPress={() => router.push('/(auth)/signup')} /></View>
   </View>
   <View className="mb-4 mt-1 gap-3"><Text className="font-geist text-xs font-semibold uppercase tracking-widest text-brand">How Ashwi works</Text><Text className="font-geist text-3xl font-semibold tracking-tight text-ink">One question. A clear path forward.</Text><Text className="max-w-[720px] font-body text-sm leading-6 text-muted">From your first prompt to the next time you return, Ashwi keeps the tools and context for your work together.</Text></View>
   <View className={isWide ? 'flex-row flex-wrap gap-4' : 'gap-3'}>
    {[
      {number:'01',icon:'users' as const,title:'Pick a point of view',body:'Choose a profession such as engineer, doctor, teacher or assistant. That role gives the conversation relevant instructions and focus.'},
      {number:'02',icon:'message-square' as const,title:'Ask in your own words',body:'Write a question in the chat. Ashwi sends it securely to the backend together with the selected profession and conversation context.'},
      {number:'03',icon:'zap' as const,title:'Get an AI response',body:'The backend prepares a role-aware prompt and sends it to Google Gemini. The response comes back to your workspace for the next turn.'},
      {number:'04',icon:'clock' as const,title:'Pick up where you left off',body:'Conversations are saved with your account so you can revisit earlier sessions and continue your work.'},
    ].map(step=><View key={step.number} className="min-w-0 gap-3 rounded-2xl border border-line bg-panel p-5 lg:p-6" style={isWide?{flexBasis:'48%',flexGrow:1}:undefined}><View className="flex-row items-center justify-between"><Feather name={step.icon} color={colors.primary} size={21}/><Text className="font-geist text-xs font-semibold tracking-widest text-brand">{step.number}</Text></View><Text className="font-geist text-lg font-semibold text-ink">{step.title}</Text><Text className="font-body text-sm leading-6 text-muted">{step.body}</Text></View>)}
   </View>
   <View className="mb-4 mt-14 gap-3"><Text className="font-geist text-xs font-semibold uppercase tracking-widest text-brand">The technology behind it</Text><Text className="font-geist text-3xl font-semibold tracking-tight text-ink">One app across your devices.</Text><Text className="max-w-[720px] font-body text-sm leading-6 text-muted">A shared React Native app talks to an API that manages accounts, conversations and AI requests.</Text></View>
   <View className={isWide?'flex-row gap-4':'gap-3'}>
    {[
      {icon:'smartphone' as const,title:'App & interface',stack:'React Native · Expo · TypeScript · Expo Router',body:'One responsive codebase serves the web, Android and iOS. NativeWind and Tailwind CSS style shared screens.'},
      {icon:'server' as const,title:'Backend & data',stack:'Node.js · Express · PostgreSQL',body:'The backend handles API requests, authentication and permissions, and stores user profiles and chat history.'},
      {icon:'cpu' as const,title:'AI & expertise',stack:'Google Gemini · @google/genai',body:'Gemini generates answers from the conversation and profession-specific instructions selected for that chat.'},
      {icon:'shield' as const,title:'Accounts & access',stack:'JWT · bcrypt · Google OAuth',body:'Ashwi supports password-based accounts and Google sign-in. Account roles and verification status are managed by Ashwi.'},
    ].map(item=><View key={item.title} className="min-w-0 flex-1 gap-3 rounded-2xl border border-line bg-panel p-5 lg:p-6"><Feather name={item.icon} color={colors.primary} size={22}/><Text className="font-geist text-lg font-semibold text-ink">{item.title}</Text><Text className="font-geist text-xs leading-5 text-brand">{item.stack}</Text><Text className="font-body text-sm leading-6 text-muted">{item.body}</Text></View>)}
   </View>
   <View className="mt-14 gap-6 rounded-2xl border border-brand/30 bg-brand/5 p-6 lg:p-9">
    <View className="flex-row items-center gap-3"><View className="h-10 w-10 items-center justify-center rounded-full bg-brand/15"><Feather name="message-circle" color={colors.primary} size={20}/></View><View><Text className="font-geist text-xs font-semibold uppercase tracking-widest text-brand">A message from the developers</Text><Text className="mt-1 font-geist text-xl font-semibold text-ink">Adesh Gupta & Saloni Singh</Text></View></View>
    <Text className="font-body text-base leading-7 text-ink">“We built Ashwi to make AI feel more useful in everyday work: choose the kind of expertise you need, ask naturally, and keep your conversations in one place. As graduates in the Bachelor of Computer Applications program, this project is also our way of turning what we have learned into something people can use. Thanks for giving Ashwi a try.”</Text>
    <Text className="font-geist text-xs text-muted">BCA graduates · Creators of Ashwi AI</Text>
   </View>
   <View className={isWide ? 'mt-6 flex-row gap-6' : 'mt-6 gap-4'}>
    <View className="min-w-0 rounded-2xl border border-line bg-panel p-6 lg:p-8" style={isWide ? { flex: 2 } : undefined}>
     <Feather name="users" color={colors.primary} size={28} /><Text className="mb-3 mt-6 font-geist text-2xl font-semibold text-ink">Persona Management</Text><Text className="font-body text-sm leading-6 text-muted">Choose specialized AI expertise for your profession. Keep your conversations in one unified workspace and return to them whenever you need.</Text>
     <View className="mt-6 gap-4 rounded-lg border border-line bg-canvas p-4"><Text className="font-geist text-xs text-muted">SPECIALIZED EXPERTISE</Text>{['Software Engineer','Data Analyst','Business Strategist'].map(label => <View key={label} className="flex-row items-center justify-between"><Text className="font-geist text-sm text-ink">{label}</Text><View className="h-2 w-2 rounded-full bg-brand" /></View>)}</View>
    </View>
    <View className="min-w-0 gap-5 rounded-2xl border border-line bg-panel p-6 lg:p-8" style={isWide ? { flex: 1 } : undefined}>
     <Feather name="shield" color={colors.primary} size={28} /><Text className="font-geist text-2xl font-semibold text-ink">Admin Controls</Text><Text className="font-body text-sm leading-6 text-muted">Manage accounts, review activity, and monitor conversations from a clear, centralized dashboard.</Text><View className="mt-auto pt-4"><AppButton label="View dashboard" variant="secondary" onPress={() => router.push('/admin')} /></View>
    </View>
   </View>
   <View className="mt-6 flex-row items-start gap-5 rounded-2xl border border-line bg-panel p-6 lg:p-8"><Feather name="lock" color={colors.primary} size={28} /><View className="min-w-0 flex-1"><Text className="mb-3 font-geist text-2xl font-semibold text-ink">Enterprise Security</Text><Text className="font-body text-sm leading-6 text-muted">Verification-aware account access, role-based administration, and a workspace that keeps your conversations organized.</Text></View></View>
   <View className="mt-6 gap-5 rounded-2xl border border-line bg-panel p-6 lg:p-8">
    <View><Text className="font-geist text-xs uppercase tracking-widest text-brand">The people behind Ashwi</Text><Text className="mt-2 font-geist text-2xl font-semibold text-ink">Built together.</Text><Text className="mt-2 font-body text-sm leading-6 text-muted">Ashwi AI was built by Adesh Gupta and Saloni Singh, both BCA graduates.</Text></View>
    <View className={isWide?'flex-row gap-4':'gap-3'}>{['Adesh Gupta','Saloni Singh'].map(name=><View key={name} className="min-w-0 flex-1 flex-row items-center gap-3 rounded-xl border border-line bg-canvas p-4"><View className="h-10 w-10 items-center justify-center rounded-full bg-brand/15"><Feather name="user" color={colors.primary} size={18}/></View><View className="min-w-0"><Text className="font-geist text-sm font-semibold text-ink">{name}</Text><Text className="mt-1 font-body text-xs text-muted">BCA graduate</Text></View></View>)}</View>
   </View>
  </View>
  <View className="flex-row flex-wrap justify-between gap-3 border-t border-line bg-panel px-6 py-6"><Text className="font-geist text-sm font-semibold text-brand">Ashwi</Text><Text className="font-geist text-xs text-muted">Built by Adesh Gupta and Saloni Singh · BCA graduates</Text></View>
 </Screen>;
}
