import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { startOAuth, type OAuthProvider } from '@/services/oauth';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function OAuthButtons({ connect = false, horizontal = false }: {connect?:boolean; horizontal?:boolean}) {
  const { colors } = useTheme(); const { login } = useAuth(); const router = useRouter();
  const [available,setAvailable] = useState<Record<string,boolean>>({});
  const [linked,setLinked] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState<OAuthProvider|null>(null);
  const [message,setMessage] = useState('');
  useEffect(() => {
    let active=true;
    void Promise.all([api.get('/auth/oauth/providers'), connect ? api.get('/auth/oauth/linked') : Promise.resolve(null)]).then(([providers,accounts]) => {
      if (!active) return;
      if (providers.ok) setAvailable(providers.data.providers || {});
      if (accounts?.ok) setLinked((accounts.data.data || []).map((item:{provider:string})=>item.provider));
      setLoading(false);
    });
    return () => {active=false;};
  },[connect]);
  async function start(provider:OAuthProvider) {
    if (busy) return;
    setMessage(''); setBusy(provider);
    const result=await startOAuth(provider,connect);
    if (!result.ok) setMessage(result.error);
    else if ('data' in result) { login(result.data.user,result.data.token); if(connect) {setLinked(current=>[...current,provider]);setMessage('Account connected.');} else router.replace('/(user)/chat'); }
    setBusy(null);
  }
  return <View className="gap-3">
    <View className={horizontal ? 'flex-row gap-2' : 'gap-2'}>
      {(['google','github'] as const).map(provider => {
        const label=provider==='google'?'Google':'GitHub'; const connected=linked.includes(provider);
        return <Pressable key={provider} accessibilityRole="button" accessibilityLabel={connect ? `${connected?'Connected to':'Connect'} ${label}` : `Continue with ${label}`}
          accessibilityState={{disabled:loading||!!busy||!available[provider]||connected}} disabled={loading||!!busy||!available[provider]||connected}
          onPress={()=>void start(provider)} className={`min-h-12 flex-row items-center justify-center gap-3 rounded-xl border border-line bg-elevated px-3 ${horizontal?'flex-1':''}`} style={{opacity:loading||!available[provider]?0.55:1}}>
          {busy===provider?<ActivityIndicator color={colors.primary}/>:provider==='github'?<Feather name="github" size={19} color={colors.onSurface}/>:<Text className="text-lg font-bold text-[#4285f4]">G</Text>}
          <Text className="font-body text-[15px] text-ink">{connected?`${label} connected`:connect?`Connect ${label}`:label}</Text>
        </Pressable>;
      })}
    </View>
    {!loading && (!available.google || !available.github) && <Text className="font-body text-xs leading-5 text-muted">{!available.google&&!available.github?'Social sign-in needs server configuration.':`${!available.google?'Google':'GitHub'} sign-in needs server configuration.`}</Text>}
    {!!message && <Text accessibilityLiveRegion="polite" className="font-body text-sm leading-5 text-ink">{message}</Text>}
  </View>;
}
