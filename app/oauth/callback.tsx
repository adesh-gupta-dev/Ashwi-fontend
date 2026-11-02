import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { finishOAuth } from '@/services/oauth';
import { useAuth } from '@/providers/AuthProvider';
import { AppButton } from '@/components/ui/AppButton';

export default function OAuthCallback() {
  const params=useLocalSearchParams<{ticket?:string;error?:string}>();
  const {login,isHydrated}=useAuth(); const router=useRouter(); const started=useRef(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if (!isHydrated || started.current) return;
    started.current=true;
    const ticket=typeof params.ticket==='string'?params.ticket:undefined;
    const providerError=typeof params.error==='string'?params.error:undefined;
    if(Platform.OS==='web') window.history.replaceState({},'', '/oauth/callback');
    void finishOAuth(ticket,providerError).then(result=>{
      if(!result.ok) setError(result.error);
      else { login(result.data.user,result.data.token); router.replace('/(user)/chat'); }
    });
  },[isHydrated,params.ticket,params.error,login,router]);
  return <View className="flex-1 items-center justify-center gap-6 bg-canvas px-6">
    <Text className="font-geist text-3xl font-bold text-ink">Ashwi</Text>
    {error?<><Text accessibilityLiveRegion="polite" className="max-w-lg text-center font-body text-base leading-7 text-ink">{error}</Text><AppButton label="Back to sign in" onPress={()=>router.replace('/(auth)/login')}/></>:<><ActivityIndicator color="#ff2b20"/><Text className="font-body text-sm text-muted">Completing your sign-in...</Text></>}
  </View>;
}
