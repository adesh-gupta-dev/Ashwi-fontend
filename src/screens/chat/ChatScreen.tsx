import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { WorkspaceSidebar } from '@/components/navigation/WorkspaceSidebar';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { getKeyboardAvoidingProps, keyboardDismissMode } from '@/utils/platform';
import api from '@/services/api';
import { consoleTerminal } from '@/utils/consoleTerminal';
import { triggerError, triggerPress, triggerSuccess } from '@/services/haptics';
import { sendLocalNotification } from '@/services/notifications';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { componentTokens, gradients, radii, shadows, spacing, typography } from '@/theme';

type ChatMode = 'chat' | 'history';

type Profession = {
  id: string;
  keyName: string;
  label: string;
  icon?: string;
};

type SessionItem = {
  session_id: string;
  title: string;
  first_message_at: string;
  last_message_at: string;
  message_count: number;
};

type ChatHistoryRow = {
  id: string;
  session_id: string;
  persona_role: string;
  profession_key?: string;
  profession_label?: string;
  user_message: string;
  ai_response: string;
  created_at: string;
};

type MessageItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
};

type FeedbackState = {
  kind: 'error' | 'success';
  message: string;
};

function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown) {
  consoleTerminal('chat.unexpected', error);
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

function PillButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => {
        void triggerPress();
        onPress();
      }}
      style={[
        styles.pill,
        {
          backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
          borderColor: active ? colors.primary : colors.outlineVariant,
        },
      ]}
    >
      <Feather name={label.toLowerCase().includes('engineer') || label.toLowerCase().includes('programmer') ? 'code' : label.toLowerCase().includes('doctor') ? 'heart' : label.toLowerCase().includes('teacher') ? 'book-open' : 'zap'} color={active ? colors.onPrimary : colors.onSurfaceVariant} size={14} />
      <Text
        style={[
          styles.pillLabel,
          {
            color: active ? colors.onPrimary : colors.onSurface,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MessageBubble({ item }: { item: MessageItem }) {
  const { colors } = useTheme();
  async function copy(text: string) {
    try { await Clipboard.setStringAsync(text); }
    catch (error) { consoleTerminal('chat.copy', error, 'warn'); }
  }
  return <View className="mb-5 w-full flex-row items-start gap-3">
    <View className={`h-8 w-8 items-center justify-center rounded-full border border-line ${item.role === 'assistant' ? 'bg-brand' : 'bg-elevated'}`}><Feather name={item.role === 'assistant' ? 'cpu' : 'user'} color={item.role === 'assistant' ? '#ffffff' : colors.onSurfaceVariant} size={16} /></View>
    <View className="min-w-0 flex-1 gap-3 rounded-2xl border border-line bg-panel p-4">
      {item.text.split(/(```[\s\S]*?```)/g).map((part, index) => {
        if (!part.startsWith('```')) return part ? <Text key={index} selectable className="font-body text-[15px] leading-6 text-ink">{part}</Text> : null;
        const raw = part.slice(3,-3); const newline = raw.indexOf('\n');
        const language = newline >= 0 ? raw.slice(0,newline) : 'code';
        const code = newline >= 0 ? raw.slice(newline+1) : raw;
        return <View key={index} className="overflow-hidden rounded border border-line bg-canvas"><View className="flex-row justify-between border-b border-line px-3 py-2"><Text className="font-geist text-[11px] text-muted">{language}</Text><Pressable accessibilityLabel="Copy code" onPress={() => void copy(code)} className="flex-row items-center gap-1"><Feather name="copy" size={12} color={colors.onSurfaceVariant} /><Text className="font-geist text-[11px] text-muted">Copy</Text></Pressable></View><ScrollView horizontal contentContainerClassName="p-3"><Text selectable style={{ fontFamily: typography.code.fontFamily }} className="text-xs leading-5 text-ink">{code}</Text></ScrollView></View>;
      })}
    </View>
  </View>;
}

export function ChatScreen({ mode }: { mode: ChatMode }) {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ sessionId?: string }>();
  const { isCompact, isWide, isShort, height, horizontalPadding } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const { colors, scheme, toggleScheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const messagesRef = useRef<ScrollView>(null);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [activeProfession, setActiveProfession] = useState('');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState(typeof routeParams.sessionId === 'string' ? routeParams.sessionId : '');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [composer, setComposer] = useState('');
  const [isLoadingProfessions, setIsLoadingProfessions] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

  const isLargeLayout = isWide && !isShort;
  const isHistoryMode = mode === 'history';

  useEffect(() => {
    if (isHistoryMode || !user?.id) return;
    let cancelled = false;
    void AsyncStorage.getItem(`ashwi.chat.${user.id}`).then((raw) => {
      if (!raw || cancelled) return;
      const draft = JSON.parse(raw);
      if (typeof draft.sessionId === 'string') setActiveSessionId(draft.sessionId);
      if (typeof draft.profession === 'string') setActiveProfession(draft.profession);
      if (typeof draft.composer === 'string') setComposer(draft.composer);
      if (Array.isArray(draft.messages)) {
        setMessages(draft.messages.filter((item: MessageItem) =>
          typeof item?.id === 'string' && typeof item.text === 'string' &&
          (item.role === 'user' || item.role === 'assistant') && typeof item.createdAt === 'string'));
      }
    }).catch((error) => {
      consoleTerminal('chat.restore-draft', error, 'warn');
    }).finally(() => {
      if (!cancelled) setIsDraftHydrated(true);
    });
    return () => { cancelled = true; };
  }, [isHistoryMode, user?.id]);

  useEffect(() => {
    if (isHistoryMode || !isDraftHydrated || !user?.id || isSending) return;
    void AsyncStorage.setItem(`ashwi.chat.${user.id}`, JSON.stringify({
      sessionId: activeSessionId, profession: activeProfession, messages, composer,
    })).catch((error) => {
      consoleTerminal('chat.save-draft', error, 'warn');
    });
  }, [isHistoryMode, isDraftHydrated, user?.id, activeSessionId, activeProfession, messages, composer, isSending]);

  useEffect(() => {
    const loadProfessions = async () => {
      setIsLoadingProfessions(true);
      try {
        const response = await api.get('/chat/professions');
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }
        const nextProfessions = response.data?.data || [];
        setProfessions(nextProfessions);

        setActiveProfession((current) => {
          if (current && nextProfessions.some((profession: Profession) => profession.keyName === current)) {
            return current;
          }

          const preferred = nextProfessions.find((profession: Profession) => profession.keyName === 'assistant');
          return preferred?.keyName || nextProfessions[0]?.keyName || 'assistant';
        });
      } catch (error) {
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsLoadingProfessions(false);
      }
    };

    void loadProfessions();
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const response = await api.get('/chat/sessions');
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }
        const nextSessions = response.data?.data || [];
        setSessions(nextSessions);

        if (nextSessions.length > 0 && !nextSessions.some((session: SessionItem) => session.session_id === activeSessionId)) {
          setActiveSessionId(nextSessions[0].session_id);
        }
      } catch (error) {
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsLoadingSessions(false);
      }
    };

    void loadSessions();
  }, [isHistoryMode]);

  useEffect(() => {
    if (!isHistoryMode || !activeSessionId) {
      return;
    }

    const loadHistory = async () => {
      setIsLoadingThread(true);
      setFeedback(null);
      try {
        const response = await api.get(`/chat/history?sessionId=${encodeURIComponent(activeSessionId)}`);
        if (!response.ok) {
          setFeedback({ kind: 'error', message: response.error.message });
          void triggerError();
          return;
        }
        const historyRows: ChatHistoryRow[] = response.data?.data || [];

        const nextMessages: MessageItem[] = [];
        historyRows.forEach((row) => {
          nextMessages.push({
            id: `${row.id}-user`,
            role: 'user',
            text: row.user_message,
            createdAt: row.created_at,
          });
          nextMessages.push({
            id: `${row.id}-assistant`,
            role: 'assistant',
            text: row.ai_response,
            createdAt: row.created_at,
          });
        });

        setMessages(nextMessages);
        if (historyRows[0]?.profession_key) {
          setActiveProfession(historyRows[0].profession_key);
        } else if (historyRows[0]?.persona_role) {
          setActiveProfession(historyRows[0].persona_role);
        }
      } catch (error) {
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsLoadingThread(false);
      }
    };

    void loadHistory();
  }, [activeSessionId, isHistoryMode]);

  useEffect(() => {
    messagesRef.current?.scrollToEnd({ animated: true });
  }, [messages, isSending]);

  useEffect(() => {
    setNameInput(user?.name || '');
  }, [user?.name]);

  const hasUnverifiedAccount = Boolean(user && !user.isVerified);

  async function handleSend() {
    const text = composer.trim();
    if (!text || (!isHistoryMode && !isDraftHydrated) || isSending || isLoadingThread || hasUnverifiedAccount || isLoadingProfessions || !activeProfession) {
      return;
    }

    const selectedProfession = activeProfession || professions[0]?.keyName || 'assistant';
    const nextSessionId = activeSessionId || createSessionId();

    setComposer('');
    setFeedback(null);
    setIsSending(true);
    void triggerPress();

    const userMessage: MessageItem = {
      id: `${nextSessionId}-${Date.now()}-user`,
      role: 'user',
      text: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const response = await api.post('/chat/message', {
        message: text,
        personaRole: selectedProfession,
        sessionId: nextSessionId,
        mode: 'PROFESSIONAL',
      });
      if (!response.ok) {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setComposer(text);
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }

      const responseData = response.data?.data;
      const sessionIdFromServer = responseData?.sessionId || nextSessionId;

      if (sessionIdFromServer !== activeSessionId) {
        setActiveSessionId(sessionIdFromServer);
      }

      setMessages((current) => [
        ...current,
        {
          id: `${sessionIdFromServer}-${Date.now()}-assistant`,
          role: 'assistant',
          text: responseData?.aiResponse || 'Response received.',
          createdAt: responseData?.createdAt || new Date().toISOString(),
        },
      ]);

      {
        void api.get('/chat/sessions').then((refreshed) => {
          if (refreshed.ok) {
            setSessions(refreshed.data?.data || []);
          } else {
            setFeedback({ kind: 'error', message: 'Reply received. Unable to refresh the session list.' });
          }
        }).catch(() => {
          setFeedback({ kind: 'error', message: 'Reply received. Unable to refresh the session list.' });
        });
      }
      void triggerSuccess();
      void sendLocalNotification('Ashwi', `Message sent to ${selectedProfession}.`);
    } catch (error) {
      setMessages((current) => current.slice(0, -1));
      setComposer(text);
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setIsSending(false);
    }
  }

  async function handleResendVerification() {
    if (!user) {
      void triggerError();
      setFeedback({ kind: 'error', message: 'Please sign in again to resend verification.' });
      return;
    }

    setIsResendingVerification(true);
    setFeedback(null);

    try {
      const response = await api.post('/auth/resend-verification', {});
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }
      setFeedback({ kind: 'success', message: response.data?.message || 'Verification email sent.' });
      void triggerSuccess();
      void sendLocalNotification('Ashwi', 'Verification email sent.');
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setIsResendingVerification(false);
    }
  }

  async function handleSaveProfile() {
    const nextName = nameInput.trim();
    if (!nextName) {
      void triggerError();
      setFeedback({ kind: 'error', message: 'Enter a display name before saving.' });
      return;
    }

    setIsSavingProfile(true);
    setFeedback(null);
    try {
      const response = await api.patch('/auth/profile', { name: nextName });
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }
      if (response.data?.success && response.data?.user) {
        updateUser(response.data.user);
        setFeedback({ kind: 'success', message: 'Name updated successfully.' });
        void triggerSuccess();
      }
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword) {
      void triggerError();
      setFeedback({ kind: 'error', message: 'Enter your current and new password.' });
      return;
    }

    setIsSavingPassword(true);
    setFeedback(null);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }
      setFeedback({ kind: 'success', message: response.data?.message || 'Password updated successfully.' });
      void triggerSuccess();
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setIsSavingPassword(false);
    }
  }

  function handleNewChat() {
    setShowSessions(false);
    void triggerPress();
    setActiveSessionId(createSessionId());
    setMessages([]);
    setComposer('');
    setFeedback(null);
  }

  function handleLogout() {
    void triggerPress();
    logout();
    router.replace('/(auth)/login');
  }

  const title = isHistoryMode ? 'Conversation history' : 'Chat workspace';
  const subtitle = isHistoryMode
    ? 'Review earlier sessions, then return to a fresh thread when you are ready.'
    : 'Choose a profession, write a prompt, and keep the conversation moving.';
  const routeToggleLabel = isHistoryMode ? 'Live chat' : 'History';
  const routeToggleHref = isHistoryMode ? '/(user)/chat' : '/(user)/chat/history';

  const sessionsPanel = (
    <View style={[styles.sessionsPanel, {
      width: isLargeLayout ? 240 : '100%', maxHeight: isLargeLayout ? '100%' : height * 0.6,
      borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow,
    }]}>
      <View style={styles.panelHeader}>
        <Text style={[styles.panelTitle, { color: colors.onSurface }]}>Sessions</Text>
        <Pressable accessibilityRole="button" onPress={handleNewChat} disabled={isSending || isLoadingThread} style={{backgroundColor:colors.primaryContainer,borderRadius:20,paddingHorizontal:14,paddingVertical:10}}>
          <Text style={[styles.panelAction, { color: colors.onPrimaryContainer }]}>New chat</Text>
        </Pressable>
      </View>

      {isLoadingSessions ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : sessions.length === 0 ? (
        <Text style={[styles.emptyPanelText, { color: colors.onSurfaceVariant }]}>No history yet. Start a conversation to create one.</Text>
      ) : (
        <ScrollView style={{ minHeight: 0 }} contentContainerStyle={styles.sessionList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {sessions.map((session) => {
            const active = session.session_id === activeSessionId;
            return (
              <Pressable
                key={session.session_id}
                disabled={isSending || isLoadingThread}
                onPress={() => { if (isHistoryMode) setActiveSessionId(session.session_id); else router.push({ pathname: '/(user)/chat/history', params: { sessionId: session.session_id } }); setShowSessions(false); }}
                style={[
                  styles.sessionCard,
                  {
                    backgroundColor: active ? colors.surfaceContainer : colors.surfaceContainerLow,
                    borderColor: active ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                <Text style={[styles.sessionTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {session.title || 'Chat session'}
                </Text>
                <Text style={[styles.sessionMeta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {session.message_count} messages · {formatDateTime(session.last_message_at)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const conversation = (
    <View testID="chat-workspace" style={styles.threadColumn}>
      {!keyboardVisible ? <View style={styles.professionRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.professionScroller}>
          {isLoadingProfessions ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            professions.map((profession) => (
              <PillButton
                key={profession.id}
                label={profession.label}
                active={profession.keyName === activeProfession}
                onPress={() => {
                  if (isSending || isLoadingThread || profession.keyName === activeProfession) return;
                  setActiveProfession(profession.keyName);
                  handleNewChat();
                }}
              />
            ))
          )}
        </ScrollView>
      </View> : null}

      {feedback ? (
        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor: feedback.kind === 'error' ? 'rgba(255, 38, 0, 0.10)' : 'rgba(76, 215, 246, 0.10)',
              borderColor: feedback.kind === 'error' ? 'rgba(255, 38, 0, 0.25)' : 'rgba(76, 215, 246, 0.25)',
            },
          ]}
        >
          <Text style={[styles.feedbackText, { color: colors.onSurface }]}>{feedback.message}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={messagesRef}
        style={styles.messagesPane}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={keyboardDismissMode}
        onContentSizeChange={() => messagesRef.current?.scrollToEnd({ animated: true })}
      >
        {isLoadingThread ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerState}>
            {!isShort && <Image source={require('../../../assets/ashwi-logo.png')} style={{width:isCompact?56:82,height:isCompact?56:82,marginBottom:12}} resizeMode="contain" />}
            <Text style={[styles.emptyTitle, { color: colors.onSurface, fontSize:isCompact?25:34,lineHeight:isCompact?32:42 }]}>Ready <Text style={{color:colors.primary}}>when you are.</Text></Text>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              Ask a question or start a fresh conversation with a different profession.
            </Text>
          </View>
        ) : (
          messages.map((item) => <MessageBubble key={item.id} item={item} />)
        )}

        {isSending ? (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={[styles.bubble, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View testID="chat-composer" style={[styles.composerCard, isShort && { padding: 12, gap: 8 }, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <View style={styles.composerHeader}>
          <Text style={[styles.composerLabel, { color: colors.onSurfaceVariant }]}>
            {hasUnverifiedAccount ? 'Verify your email to chat.' : 'Message Ashwi'}
          </Text>
        {hasUnverifiedAccount ? (
            <Pressable onPress={handleResendVerification} disabled={isResendingVerification}>
              <Text style={[styles.inlineAction, { color: colors.primary }]}>
                {isResendingVerification ? 'Sending...' : 'Resend verification'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.composerInputShell, isShort && { minHeight: 48, paddingVertical: 6 }, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <TextInput
            accessibilityLabel="Message Ashwi"
            value={composer}
            onChangeText={setComposer}
            placeholder={hasUnverifiedAccount ? 'Verify your account to start chatting' : 'Type a message...'}
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            editable={!hasUnverifiedAccount && !isSending && !isLoadingThread && (isHistoryMode || isDraftHydrated)}
            style={[styles.composerInput, isShort && { minHeight: 32, maxHeight: 64 }, { color: colors.onSurface }]}
          />
        </View>

        <View style={styles.composerFooter}>
          <Text style={[styles.composerMeta, { color: colors.onSurfaceVariant }]}>
            {activeProfession ? `Profession: ${activeProfession}` : 'Choose a profession to begin.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={handleSend}
            disabled={isSending || isLoadingThread || hasUnverifiedAccount || isLoadingProfessions || !activeProfession || !composer.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: colors.primary,
                opacity:
                  isSending || isLoadingThread || hasUnverifiedAccount || isLoadingProfessions || !activeProfession || !composer.trim()
                    ? 0.55
                    : 1,
              },
              pressed &&
              !isSending &&
              !hasUnverifiedAccount &&
              !isLoadingProfessions &&
              activeProfession &&
              composer.trim()
                ? styles.sendPressed
                : null,
            ]}
          >
            <Feather name="send" size={16} color={colors.onPrimary} />
            <Text style={[styles.sendLabel, { color: colors.onPrimary }]}>{isSending ? 'Sending...' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={scheme === 'dark' ? gradients.background : gradients.backgroundLight} style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground subtle />
      <View className="min-h-0 min-w-0 flex-1 flex-row">
        {isLargeLayout && <WorkspaceSidebar onSettings={() => setShowSettings(true)} onNewChat={() => { if (!isSending) handleNewChat(); }} />}
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView {...getKeyboardAvoidingProps()} style={styles.flex}>
          <View style={[styles.page, { paddingHorizontal: 0, paddingVertical: 0, gap: 0 }]}>
            {!keyboardVisible ? <View className="border border-line bg-panel px-4 py-3" style={[styles.header, isCompact && styles.headerCompact, {borderRadius:isLargeLayout?24:16,margin:isLargeLayout?12:8}]}>
              <View className="min-w-0 flex-row items-center gap-3">
                {!isLargeLayout && <Pressable accessibilityRole="button" accessibilityLabel="Open navigation" onPress={() => setShowNavigation(true)} className="h-8 w-8 items-center justify-center"><Feather name="menu" color={colors.onSurface} size={20} /></Pressable>}
                <Feather name="message-square" color={colors.primary} size={20} />
                <Text className="font-geist text-[14px] font-semibold text-ink">{isHistoryMode ? 'Conversation history' : 'AI Workspace'}</Text>
              </View>

              <View style={[styles.headerActions, isCompact && styles.headerActionsCompact]}>
                <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => setShowSettings(true)} className="h-9 w-9 items-center justify-center rounded-md border border-line"><Feather name="settings" size={16} color={colors.onSurfaceVariant} /></Pressable>
                <Pressable
                  onPress={() => router.push(routeToggleHref)}
                  style={[styles.routeToggle, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                >
                  <Text style={[styles.routeToggleLabel, { color: colors.onSurface }]}>{routeToggleLabel}</Text>
                </Pressable>
                {user?.role === 'admin' && !isCompact ? (
                  <Pressable onPress={() => router.push('/admin')}>
                    <Text style={[styles.inlineAction, { color: colors.primary }]}>Admin</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={toggleScheme}
                  style={[
                    styles.schemeToggle,
                    {
                      borderColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainerLow,
                    },
                  ]}
                >
                  <Text style={[styles.schemeToggleLabel, { color: colors.onSurface }]}>
                    {scheme === 'dark' ? (isCompact ? 'Light' : 'Light mode') : (isCompact ? 'Dark' : 'Dark mode')}
                  </Text>
                </Pressable>
                {!isCompact && <Pressable accessibilityRole="button" onPress={handleLogout} className="rounded-full border border-line px-4 py-3">
                  <Text style={[styles.inlineAction, { color: colors.onSurfaceVariant }]}>Logout</Text>
                </Pressable>}
              </View>
            </View> : null}


            {hasUnverifiedAccount ? (
              <View style={[styles.verificationBanner, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[styles.verificationText, { color: colors.onSurface }]}>
                  Your email is not verified yet. Chat is locked until verification completes.
                </Text>
                <Pressable
                  onPress={handleResendVerification}
                  disabled={isResendingVerification}
                  style={[
                    styles.verificationButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: isResendingVerification ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.verificationButtonLabel, { color: colors.onPrimary }]}>
                    {isResendingVerification ? 'Sending...' : 'Resend verification'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {isLargeLayout ? (
              <View style={styles.workspaceWide}>
                {sessionsPanel}
                <View style={styles.workspacePanel}>{conversation}</View>
              </View>
            ) : (
              <View style={[styles.workspaceStack, isShort && { gap: 8, padding: 8 }]}>
                {isHistoryMode ? <>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: showSessions }} onPress={() => setShowSessions((current) => !current)} style={styles.historyToggle}>
                    <Text style={[styles.panelAction, { color: colors.primary }]}>{showSessions ? 'Hide sessions' : 'Choose a conversation'}</Text>
                  </Pressable>
                </> : null}
                {conversation}
              </View>
            )}

            {!keyboardVisible && !isShort ? <Text className="px-4 pb-3 text-center font-geist text-[10px] text-muted">Ashwi AI can make mistakes. Consider verifying important information.</Text> : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </View>

      {showSettings ? <Modal visible transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <KeyboardAvoidingView {...getKeyboardAvoidingProps()} style={styles.settingsOverlay}>
          <Pressable style={styles.settingsBackdrop} onPress={() => setShowSettings(false)} />
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={keyboardDismissMode}
            testID="settings-sheet"
            style={[styles.settingsSheet, { maxHeight: height - insets.top - 16, backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}
            contentContainerStyle={[styles.settingsContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.settingsHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>Settings</Text>
                <Text style={[styles.settingsSubtitle, { color: colors.onSurfaceVariant }]}>Profile and password controls from the web dashboard.</Text>
              </View>
              <Pressable onPress={() => setShowSettings(false)} style={[styles.closeButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <Text style={[styles.closeButtonLabel, { color: colors.onSurface }]}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: colors.onSurfaceVariant }]}>Profile</Text>
              <View style={[styles.settingsInputShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your name"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.settingsInput, { color: colors.onSurface }]}
                />
              </View>
              <Pressable
                onPress={handleSaveProfile}
                disabled={isSavingProfile || !nameInput.trim()}
                style={({ pressed }) => [
                  styles.settingsPrimaryButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isSavingProfile || !nameInput.trim() ? 0.6 : 1,
                  },
                  pressed && !isSavingProfile && nameInput.trim() ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.settingsPrimaryLabel, { color: colors.onPrimary }]}>
                  {isSavingProfile ? 'Saving...' : 'Save name'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: colors.onSurfaceVariant }]}>Connected accounts</Text>
              <OAuthButtons connect />
            </View>
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: colors.onSurfaceVariant }]}>Change password</Text>
              <View style={[styles.settingsInputShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry
                  style={[styles.settingsInput, { color: colors.onSurface }]}
                />
              </View>
              <View style={[styles.settingsInputShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password"
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry
                  style={[styles.settingsInput, { color: colors.onSurface }]}
                />
              </View>
              <Pressable
                onPress={handleSavePassword}
                disabled={isSavingPassword || !currentPassword || !newPassword}
                style={({ pressed }) => [
                  styles.settingsSecondaryButton,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderColor: colors.outlineVariant,
                    opacity: isSavingPassword || !currentPassword || !newPassword ? 0.6 : 1,
                  },
                  pressed && !isSavingPassword && currentPassword && newPassword ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.settingsSecondaryLabel, { color: colors.onSurface }]}>
                  {isSavingPassword ? 'Saving...' : 'Update password'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal> : null}
      {!isLargeLayout && showSessions ? <Modal visible transparent animationType="slide" onRequestClose={() => setShowSessions(false)}>
        <View style={styles.settingsOverlay}>
          <Pressable accessibilityLabel="Close conversations" style={styles.settingsBackdrop} onPress={() => setShowSessions(false)} />
          <View style={[styles.settingsSheet, styles.settingsContent, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surfaceContainer }]}>
            <Pressable accessibilityRole="button" onPress={() => setShowSessions(false)} style={styles.historyToggle}>
              <Text style={[styles.panelAction, { color: colors.primary }]}>Close conversations</Text>
            </Pressable>
            {sessionsPanel}
          </View>
        </View>
      </Modal> : null}
      {showNavigation ? <Modal visible transparent animationType="fade" onRequestClose={() => setShowNavigation(false)}>
        <View className="flex-1 flex-row bg-black/60"><Pressable accessibilityLabel="Close navigation" onPress={() => setShowNavigation(false)} style={StyleSheet.absoluteFill} /><WorkspaceSidebar onSettings={() => setShowSettings(true)} onNewChat={handleNewChat} onNavigate={() => setShowNavigation(false)} /></View>
      </Modal> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing.xs,
  },
  headerActionsCompact: {
    justifyContent: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  brandDot: {
    flex: 1,
    borderRadius: radii.md,
  },
  brandName: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: typography.headlineMd.fontWeight,
    letterSpacing: -0.4,
  },
  brandTag: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  schemeToggle: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  schemeToggleLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  inlineAction: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  historyToggle: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  routeToggle: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  routeToggleLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  heroBanner: {
    gap: spacing.xs,
    maxWidth: 820,
  },
  heroTitle: {
    fontFamily: typography.displayLg.fontFamily,
    fontSize: typography.displayLgMobile.fontSize,
    lineHeight: typography.displayLgMobile.lineHeight,
    fontWeight: typography.displayLgMobile.fontWeight,
    letterSpacing: typography.displayLgMobile.letterSpacing,
    maxWidth: 760,
  },
  heroDescription: {
    fontFamily: typography.bodyLg.fontFamily,
    fontSize: typography.bodyLg.fontSize,
    lineHeight: typography.bodyLg.lineHeight,
    maxWidth: 760,
  },
  verificationBanner: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  verificationText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  verificationButton: {
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  verificationButtonLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  workspaceWide: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 0,
  },
  workspaceStack: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 0,
  },
  sessionsPanel: {
    width: 256,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.ambient,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  panelTitle: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: typography.headlineMd.fontWeight,
  },
  panelAction: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  loadingRow: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPanelText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  sessionList: {
    gap: spacing.sm,
  },
  sessionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sessionTitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  sessionMeta: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 10,
    lineHeight: 18,
  },
  workspacePanel: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  threadColumn: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    gap: spacing.sm,
  },
  professionRow: {
    minHeight: 48,
    flexShrink: 0,
  },
  professionScroller: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  pillLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  messagesPane: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  bubbleText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  bubbleMeta: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  centerState: {
    flexGrow: 1,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: typography.headlineMd.fontWeight,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  composerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  composerLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  composerInputShell: {
    borderWidth: 0,
    borderRadius: 12,
    minHeight: componentTokens.composer.minHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composerInput: {
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  composerMeta: {
    flex: 1,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    minWidth: 92,
    alignItems: 'center',
  },
  sendPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  sendLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  glow: {
    position: 'absolute',
    borderRadius: radii.pill,
  },
  glowTop: {
    top: -120,
    right: -80,
    width: 280,
    height: 280,
  },
  glowBottom: {
    left: -100,
    bottom: -140,
    width: 260,
    height: 260,
  },
  settingsTrigger: {
    alignSelf: 'center',
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  settingsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  settingsSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    flexGrow: 0,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  settingsContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  closeButton: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  closeButtonLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  settingsSubtitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  settingsSection: {
    gap: spacing.sm,
  },
  settingsSectionTitle: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
  },
  settingsInputShell: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  settingsInput: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  settingsPrimaryButton: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  settingsPrimaryLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  settingsSecondaryButton: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  settingsSecondaryLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  settingsTitle: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: typography.headlineMd.fontWeight,
  },
  settingsText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
