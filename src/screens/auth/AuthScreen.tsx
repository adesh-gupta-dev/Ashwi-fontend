import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getKeyboardAvoidingProps, keyboardDismissMode } from '@/utils/platform';
import api from '@/services/api';
import { consoleTerminal } from '@/utils/consoleTerminal';
import { triggerError, triggerPress, triggerSuccess } from '@/services/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

type FeedbackState = {
  kind: 'error' | 'success';
  message: string;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function getErrorMessage(error: unknown) {
  consoleTerminal('auth.unexpected', error);
  const response = (error as { response?: { data?: { error?: string; errors?: string[] } } })?.response?.data;

  if (response?.errors?.length) {
    return response.errors.join(' ');
  }

  if (response?.error) {
    return response.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  helperText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  textContentType?: React.ComponentProps<typeof TextInput>['textContentType'];
  helperText?: string;
}) {
  const { colors, scheme } = useTheme();
  const [visible, setVisible] = useState(false);
  return <View className="gap-2">
    <View className="flex-row items-center gap-2"><Feather name={keyboardType === 'email-address' ? 'mail' : secureTextEntry ? 'lock' : 'user'} size={15} color={colors.onSurfaceVariant} /><Text className="font-geist text-sm font-semibold text-ink">{label}</Text></View>
    <View className="min-h-12 flex-row items-center gap-3 rounded-xl border px-4" style={{ borderColor: scheme === 'dark' ? '#27272b' : colors.outlineVariant, backgroundColor: scheme === 'dark' ? '#18191c' : colors.surfaceContainerLow }}>
      <Feather name={keyboardType === 'email-address' ? 'mail' : secureTextEntry ? 'lock' : label.includes('token') ? 'key' : 'user'} size={16} color={colors.outline} />
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.outline} secureTextEntry={secureTextEntry && !visible}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoComplete={autoComplete} textContentType={textContentType}
        className="min-h-12 min-w-0 flex-1 py-3 font-body text-[15px] text-ink" />
      {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(current => !current)} hitSlop={12}><Feather name={visible ? 'eye' : 'eye-off'} size={16} color={colors.outline} /></Pressable>}
    </View>
    {helperText ? <Text className="font-body text-xs leading-5 text-muted">{helperText}</Text> : null}
  </View>;
}

function PrimaryActionButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={loading} onPress={() => { void triggerPress(); onPress(); }} className="overflow-hidden rounded-xl" style={{ opacity: loading ? 0.6 : 1 }}>
    <LinearGradient colors={['#ff361f', '#ff2018']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 }}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <><Text className="font-geist text-[15px] font-semibold text-white">{label}</Text><Feather name="arrow-right" color="#ffffff" size={16} /></>}
    </LinearGradient>
  </Pressable>;
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { isWide, isCompact, horizontalPadding, height } = useResponsiveLayout();
  const compactDesktop = isWide && height < 820;
  const { colors, scheme, toggleScheme } = useTheme();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ email?: string | string[]; token?: string | string[] }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState(normalizeParam(params.email));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState(normalizeParam(params.token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextEmail = normalizeParam(params.email);
    if (nextEmail) {
      setEmail(nextEmail);
    }
  }, [params.email]);

  useEffect(() => {
    const nextToken = normalizeParam(params.token);
    if (nextToken) {
      setToken(nextToken);
    }
  }, [params.token]);

  const isLargeLayout = isWide;

  const copy = {
    login: {
      eyebrow: 'Redefining expertise',
      title: 'Your Cognitive Sanctuary.',
      subtitle: 'Your intelligence partner, adapted to your professional world.',
      features: [
        'Specialized help for your profession',
        'All your conversations in one place',
        'A workspace that feels like yours',
      ],
    },
    signup: {
      eyebrow: 'New workspace',
      title: 'Create your Ashwi account.',
      subtitle: 'Start with a verified account and move straight into the workspace.',
      features: [
        'Create your personal workspace',
        'Choose the expertise you need',
        'Return to your conversations anytime',
      ],
    },
    'forgot-password': {
      eyebrow: 'Recovery',
      title: 'Send a reset link.',
      subtitle: 'We will email a password reset link to the address on file.',
      features: [
        'Check your inbox for a reset link',
        'Follow the link to choose a new password',
        'Get back to your conversations',
      ],
    },
    'reset-password': {
      eyebrow: 'Reset access',
      title: 'Set a new password.',
      subtitle: 'Paste the reset token from your email and create a fresh password.',
      features: [
        'Use the reset token from your email',
        'Choose and confirm your new password',
        'Sign in again when you are ready',
      ],
    },
  }[mode];

  const title = copy.title;
  const subtitle = copy.subtitle;

  async function handleSubmit() {
    setFeedback(null);
    setCompletionMessage(null);

    if (mode === 'login') {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail || !password) {
        setFeedback({ kind: 'error', message: 'Enter your email and password to continue.' });
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await api.post('/auth/login', {
          email: trimmedEmail,
          password,
        });
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }

        if (!response.data?.user || typeof response.data?.token !== 'string') {
          consoleTerminal('auth.invalid-login-response');
          setFeedback({ kind: 'error', message: 'Unable to sign in. Please try again.' });
          return;
        }
        login(response.data.user, response.data.token);
        void triggerSuccess();
        router.replace('/(user)/chat');
      } catch (error) {
        void triggerError();
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signup') {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedName.length < 2) {
        setFeedback({ kind: 'error', message: 'Your name needs at least 2 characters.' });
        return;
      }

      if (!trimmedEmail) {
        setFeedback({ kind: 'error', message: 'Enter a valid email address.' });
        return;
      }

      if (password.length < 8) {
        setFeedback({ kind: 'error', message: 'Password must be at least 8 characters long.' });
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await api.post('/auth/signup', {
          name: trimmedName,
          email: trimmedEmail,
          password,
        });
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }

        setCompletionMessage(response.data.message || 'Account created. Please verify your email before logging in.');
        void triggerSuccess();
      } catch (error) {
        void triggerError();
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'forgot-password') {
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        setFeedback({ kind: 'error', message: 'Enter the email address you used to create your account.' });
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await api.post('/auth/forgot-password', {
          email: trimmedEmail,
        });
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }

        setCompletionMessage(response.data.message || 'If the account exists, we sent a reset link.');
        void triggerSuccess();
      } catch (error) {
        void triggerError();
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const normalizedToken = token.trim();

    if (!normalizedToken) {
      setFeedback({ kind: 'error', message: 'Paste the reset token from your email.' });
      return;
    }

    if (password.length < 8) {
      setFeedback({ kind: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ kind: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token: normalizedToken,
        password,
      });
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }

      setCompletionMessage(response.data.message || 'Password updated successfully.');
      void triggerSuccess();
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToLogin() {
    const nextParams = email.trim() ? { email: email.trim() } : undefined;
    router.replace(nextParams ? { pathname: '/(auth)/login', params: nextParams } : '/(auth)/login');
  }

  const submitLabel =
    mode === 'login'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : mode === 'forgot-password'
          ? 'Send reset link'
          : 'Update password';

  const footerPrompt =
    mode === 'login'
      ? 'New to Ashwi?'
      : mode === 'signup'
        ? 'Already have an account?'
        : mode === 'forgot-password'
          ? 'Remembered it?'
          : 'Need another link?';

  const footerAction =
    mode === 'login'
      ? 'Create account'
      : mode === 'signup'
        ? 'Log in'
        : mode === 'forgot-password'
          ? 'Back to login'
          : 'Go to reset request';

  const footerHref =
    mode === 'login'
      ? '/(auth)/signup'
      : mode === 'signup'
        ? '/(auth)/login'
        : mode === 'forgot-password'
          ? '/(auth)/login'
          : '/(auth)/forgot-password';

  const isSignup = mode === 'signup';
  const isLogin = mode === 'login';
  return <View className="flex-1 overflow-hidden bg-canvas" style={[scheme === 'dark' ? { backgroundColor: '#08090b' } : undefined, isSignup && isLargeLayout ? { height, position: 'relative' } : undefined]}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={scheme === 'dark' ? ['#4a0d10', '#140b0d', '#09090b'] : ['#ffe0d9', '#fff8f6']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',width:isCompact?360:760,height:isCompact?360:760,borderRadius:500,left:isCompact?-230:-310,top:isCompact?-240:-520,borderWidth:1,borderColor:'rgba(255,45,30,0.14)'}} />
      <LinearGradient colors={scheme === 'dark' ? ['#0b090b', '#3d0c10'] : ['#fff8f6', '#ffe0d9']} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:'absolute',width:isCompact?420:900,height:isCompact?420:900,borderRadius:600,right:isCompact?-290:-430,bottom:isCompact?-270:-640,borderWidth:1,borderColor:'rgba(255,45,30,0.14)'}} />
    </View>
    {isSignup && isLargeLayout ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: '50%', height, overflow: 'hidden', backgroundColor: '#111217' }}>
      <Image source={require('../../../assets/signup-architecture.png')} resizeMode="cover" style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', opacity: 0.96 }]} />
      <LinearGradient colors={['rgba(8,9,11,0.02)', 'rgba(8,9,11,0.10)', 'rgba(18,19,26,0.58)']} style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%', justifyContent: 'flex-end', padding: Math.max(32, height * 0.05) }]}>
        <Text className="font-geist text-3xl font-semibold text-white">Ashwi</Text>
        <Text className="mt-6 font-geist text-[48px] font-semibold leading-[56px] text-white">A workspace for your{'\n'}<Text className="text-brand">next great idea.</Text></Text>
        <Text className="mt-4 font-body text-sm text-[#c7c4d7]">Focused intelligence. Thoughtful orchestration.</Text>
      </LinearGradient>
    </View> : null}
    <SafeAreaView style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20 }}>
      <View className="mx-5 mt-3 flex-row items-center justify-between sm:mx-9 lg:ml-[5vw] lg:mr-[3vw]">
        <View className="flex-row items-center gap-5"><Pressable accessibilityRole="link" accessibilityLabel="Ashwi home" onPress={() => router.push('/')} className="flex-row items-center gap-2"><Image source={require('../../../assets/ashwi-logo.png')} style={{width:32,height:32}} resizeMode="contain" /><Text className="font-geist text-xl font-bold text-ink">Ashwi</Text></Pressable><View className="h-7 w-px bg-line" /><Pressable accessibilityRole="link" onPress={() => router.push('/(marketing)/about')}><Text className="font-geist text-xs text-muted">About Ashwi</Text></Pressable></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={toggleScheme} className="h-10 w-10 items-center justify-center rounded-full border border-line"><Feather name={scheme === 'dark' ? 'sun' : 'moon'} color={colors.onSurfaceVariant} size={17} /></Pressable>
      </View>
    </SafeAreaView>
    <SafeAreaView style={{ flex: 1, marginLeft: isSignup && isLargeLayout ? '50%' : 0 }}>
      <KeyboardAvoidingView {...getKeyboardAvoidingProps()} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={keyboardDismissMode} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: horizontalPadding, paddingTop: compactDesktop ? 60 : isCompact ? 90 : 76, paddingBottom: compactDesktop ? 18 : 36 }}>
          <View className="w-full self-center" style={{maxWidth:isLogin||isSignup?600:440}}>
            {!isSignup && <View className="mb-6 items-center gap-2">
              {!isSignup && <View className="mb-1 h-[72px] w-[72px] items-center justify-center rounded-2xl border border-white/10" style={{backgroundColor:scheme==='dark'?'#111214':colors.surfaceContainerLow}}><Image source={require('../../../assets/ashwi-logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" /></View>}
              <Text className={`font-geist font-bold tracking-[-1.5px] text-ink ${isLogin ? 'text-[48px] leading-[54px]' : 'text-[32px] leading-10 text-center'}`}>{isLogin ? 'Ashwi' : mode === 'forgot-password' ? 'Reset your password.' : 'Set a new password.'}</Text>
              <Text className="text-center font-body text-[16px] leading-6 text-muted">{isLogin ? 'AI Orchestrator Sign In' : mode === 'forgot-password' ? 'Enter your email to receive a reset link.' : 'Use the reset token from your email.'}</Text>
              {isLogin && <View className="mt-3 h-px w-56 items-center bg-line"><View style={{height:2,width:72,backgroundColor:'#ff2a20'}} /></View>}
            </View>}
            <View testID="auth-form" className={`rounded-[18px] border ${compactDesktop ? 'p-4' : 'p-5 sm:p-8'}`} style={{ borderColor: scheme === 'dark' ? '#29292e' : colors.outlineVariant, backgroundColor: scheme === 'dark' ? 'rgba(15,16,19,0.88)' : colors.surfaceContainerLowest }}>
              {isSignup && <View className={compactDesktop ? 'mb-4 gap-2' : 'mb-7 gap-3'}>
                <Text className={`${compactDesktop ? 'text-[36px] leading-[39px]' : 'text-[42px] leading-[46px]'} font-geist font-bold tracking-[-1.5px] text-ink`}>Orchestrate{'\n'}<Text className="text-brand">Intelligence.</Text></Text>
                <Text className="font-body text-[16px] leading-6 text-muted">Create your workspace to orchestrate enterprise AI models.</Text>
              </View>}
              {completionMessage ? <View className="gap-6"><Feather name="check-circle" color={colors.primary} size={32} /><Text className="font-body text-base leading-6 text-ink">{completionMessage}</Text><PrimaryActionButton label="Back to login" onPress={goToLogin} /></View> : <View className={compactDesktop ? 'gap-4' : 'gap-6'}>
                {feedback && <View accessibilityLiveRegion="polite" className="rounded-lg border border-brand/30 bg-brand/10 p-3"><Text className="font-body text-sm leading-5 text-ink">{feedback.message}</Text></View>}
                {isSignup && <AuthField label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" autoComplete="name" />}
                {mode !== 'reset-password' && <AuthField label="Work email" value={email} onChangeText={setEmail} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />}
                {mode === 'reset-password' && <AuthField label="Reset token" value={token} onChangeText={setToken} placeholder="Paste your reset token" autoCapitalize="none" />}
                {mode !== 'forgot-password' && <AuthField label="Password" value={password} onChangeText={setPassword} placeholder={isSignup ? 'Create a password' : 'Enter your password'} secureTextEntry autoCapitalize="none" autoComplete={isLogin ? 'current-password' : 'new-password'} helperText={isSignup ? 'Must be at least 8 characters.' : undefined} />}
                {mode === 'reset-password' && <AuthField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm your new password" secureTextEntry autoCapitalize="none" />}
                {isLogin && <Pressable accessibilityRole="link" onPress={() => router.push('/(auth)/forgot-password')} className="self-end"><Text className="font-geist text-sm font-semibold text-brand">Forgot password?</Text></Pressable>}
                <PrimaryActionButton label={isSignup ? 'Create workspace' : submitLabel} loading={isSubmitting} onPress={handleSubmit} />
              </View>}
              {(isLogin || isSignup) && !completionMessage && <>
                <View className={`${compactDesktop ? 'my-3' : 'my-6'} flex-row items-center gap-4`}><View className="h-px flex-1 bg-line" /><Text className="font-geist text-[10px] font-semibold tracking-widest text-muted">OR CONTINUE WITH</Text><View className="h-px flex-1 bg-line" /></View>
                <OAuthButtons horizontal={isSignup} />
              </>}
            </View>
            <View className={`${compactDesktop ? 'mt-3' : 'mt-6'} flex-row flex-wrap items-center justify-center gap-1`}><Text className="font-body text-sm text-muted">{isLogin ? "Don't have an account?" : footerPrompt}</Text><Pressable onPress={() => router.push(footerHref)}><Text className="font-body text-sm text-brand">{isLogin ? 'Sign up' : footerAction}</Text></Pressable></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>;
}
