import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/providers/ThemeProvider';

export default function EmailVerificationResult() {
  const { status } = useLocalSearchParams<{status?:string}>();
  const { colors } = useTheme(); const router=useRouter();
  const verified=status==='success';
  return <Screen><View className="flex-1 items-center justify-center py-16">
    <View className="w-full max-w-lg items-center gap-5 rounded-2xl border border-line bg-panel p-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10"><Feather name={verified?'check':'x'} color={colors.primary} size={30}/></View>
      <Text className="text-center font-geist text-3xl font-bold text-ink">{verified?'Email verified.':'Link expired or invalid.'}</Text>
      <Text accessibilityLiveRegion="polite" className="text-center font-body text-base leading-7 text-muted">{verified?'Your Ashwi account is verified and ready. Sign in to continue.':'This verification link is invalid or has already been used. Sign in if you have already verified your account, or ask Ashwi to send a new link.'}</Text>
      <View className="mt-2 w-full items-center gap-3"><AppButton label={verified?'Sign in':'Go to sign in'} onPress={()=>router.replace('/(auth)/login')}/>{!verified&&<AppButton label="Back to home" variant="secondary" onPress={()=>router.replace('/')}/>}</View>
    </View>
  </View></Screen>;
}
