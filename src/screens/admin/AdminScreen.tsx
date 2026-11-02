import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { WorkspaceSidebar } from '@/components/navigation/WorkspaceSidebar';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { exportReport } from '@/services/reports';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';
import { consoleTerminal } from '@/utils/consoleTerminal';
import { triggerError, triggerPress, triggerSuccess } from '@/services/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { gradients, radii, shadows, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

type AdminSection = 'overview' | 'users' | 'chats' | 'logs';

type AdminUser = {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified?: boolean;
};

type AdminChat = {
  id: string;
  user_email?: string;
  user_message: string;
  ai_response: string;
  created_at: string;
  persona_role: string;
  session_id: string;
};

type AdminLog = {
  id: string;
  action: string;
  created_at: string;
  user_email?: string;
  user_id?: string;
  details?: Record<string, unknown>;
};

type OverviewStats = {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalLogs: number;
};

type ActivitySummary = {
  last24hChats: number;
  last24hLogs: number;
  topActions: Array<{ action: string; count: number }>;
  recentActivity: Array<{ id: string; action: string; created_at: string; user_email?: string }>;
};

type FeedbackState = {
  kind: 'error' | 'success';
  message: string;
};

function getErrorMessage(error: unknown) {
  consoleTerminal('admin.unexpected', error);
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

function SectionButton({
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
      onPress={() => {
        void triggerPress();
        onPress();
      }}
      style={[
        styles.sectionButton,
        {
          backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
          borderColor: active ? colors.primary : colors.outlineVariant,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionButtonLabel,
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.onSurface }]}>{value.toLocaleString()}</Text>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
    </View>
  );
}

export function AdminScreen({ section }: { section: AdminSection }) {
  const router = useRouter();
  const { isWide, isCompact, horizontalPadding } = useResponsiveLayout();
  const { colors, scheme, toggleScheme } = useTheme();
  const { logout, user } = useAuth();

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userStatus, setUserStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [logAction, setLogAction] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setFeedback(null);
      const updatePagination = (data: { totalPages?: number; pagination?: { totalPages?: number } }) => {
        const pages = Math.max(1, Number(data.totalPages ?? data.pagination?.totalPages ?? 1));
        setTotalPages(pages);
        if (page > pages) setPage(pages);
      };

      try {
        if (section === 'overview') {
          const [statsRes, activityRes, usersRes, chatsRes] = await Promise.all([
            api.get('/admin/dashboard'),
            api.get('/admin/activity-summary'),
            api.get('/admin/users?limit=4&page=1&search=&status=all'),
            api.get('/admin/chats?limit=4&page=1&search='),
          ]);

          const failed = [statsRes, activityRes, usersRes, chatsRes].find((result) => !result.ok);
          if (failed && !failed.ok) {
            setFeedback({ kind: 'error', message: failed.error.message });
            return;
          }
          setOverview(statsRes.data?.data || null);
          setActivity(activityRes.data?.data || null);
          setUsers(usersRes.data?.data || []);
          setChats(chatsRes.data?.data || []);
        } else if (section === 'users') {
          const params = new URLSearchParams({
            page: String(page),
            limit: '25',
            search,
            status: userStatus,
          });
          const response = await api.get(`/admin/users?${params.toString()}`);
          if (!response.ok) {
            setFeedback({ kind: 'error', message: response.error.message });
            void triggerError();
            return;
          }
          setUsers(response.data?.data || []);
          updatePagination(response.data);
        } else if (section === 'chats') {
          const params = new URLSearchParams({
            page: String(page),
            limit: '20',
            search,
          });
          const response = await api.get(`/admin/chats?${params.toString()}`);
          if (!response.ok) {
            setFeedback({ kind: 'error', message: response.error.message });
            void triggerError();
            return;
          }
          setChats(response.data?.data || []);
          updatePagination(response.data);
        } else {
          const params = new URLSearchParams({
            page: String(page),
            limit: '20',
            search,
            action: logAction,
          });
          const response = await api.get(`/admin/logs?${params.toString()}`);
          if (!response.ok) {
            setFeedback({ kind: 'error', message: response.error.message });
            void triggerError();
            return;
          }
          setLogs(response.data?.data || []);
          updatePagination(response.data);
        }
      } catch (error) {
        setFeedback({ kind: 'error', message: getErrorMessage(error) });
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [logAction, refreshToken, search, section, userStatus, page]);

  function refreshSection() {
    setRefreshToken((value) => value + 1);
  }

  async function handleExport() {
    if (!overview) return;
    try {
      const exported = await exportReport([
        ['Metric', 'Value'], ['Total users', overview.totalUsers], ['Active users', overview.activeUsers],
        ['Total chats', overview.totalChats], ['Total logs', overview.totalLogs],
      ]);
      if (exported) setFeedback({ kind: 'success', message: 'Your report is ready.' });
    } catch (error) {
      consoleTerminal('admin.export-report', error);
      setFeedback({ kind: 'error', message: 'Unable to export this report. Please try again.' });
    }
  }

  async function toggleUserStatus(id: string, currentActive: boolean) {
    try {
      const response = await api.put(`/admin/users/${id}/block`, { isActive: !currentActive });
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }
      setUsers((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, is_active: response.data?.data?.is_active ?? !currentActive } : entry,
        ),
      );
      setFeedback({ kind: 'success', message: response.data?.message || 'User status updated.' });
      void triggerSuccess();
      refreshSection();
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    }
  }

  async function updateUserRole(id: string, role: 'user' | 'admin') {
    try {
      const response = await api.patch(`/admin/users/${id}/role`, { role });
      if (!response.ok) {
        setFeedback({ kind: 'error', message: response.error.message });
        void triggerError();
        return;
      }
      const updatedRole = response.data?.data?.role || role;
      setUsers((current) => current.map((entry) => (entry.id === id ? { ...entry, role: updatedRole } : entry)));
      setFeedback({ kind: 'success', message: response.data?.message || 'User role updated.' });
      void triggerSuccess();
    } catch (error) {
      void triggerError();
      setFeedback({ kind: 'error', message: getErrorMessage(error) });
    }
  }

  async function deleteUser(id: string) {
    void triggerPress();
    if (Platform.OS === 'web') {
      setPendingDelete(id);
      return;
    }
    Alert.alert('Delete user', 'Soft-delete this user and remove their access immediately?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.delete(`/admin/users/${id}`);
            if (!response.ok) {
              setFeedback({ kind: 'error', message: response.error.message });
              void triggerError();
              return;
            }
            setUsers((current) => current.filter((entry) => entry.id !== id));
            setFeedback({ kind: 'success', message: response.data?.message || 'User deleted.' });
            void triggerSuccess();
          } catch (error) {
            void triggerError();
            setFeedback({ kind: 'error', message: getErrorMessage(error) });
          }
        },
      },
    ]);
  }

  const sectionTitleMap: Record<AdminSection, string> = {
    overview: 'Admin Overview',
    users: 'User Management',
    chats: 'Chat Monitoring',
    logs: 'System Logs',
  };

  const heroSubtitleMap: Record<AdminSection, string> = {
    overview: 'Track the system at a glance and jump into management views when needed.',
    users: 'Review accounts, block access, or promote trusted users.',
    chats: 'Monitor live conversations and the prompts being sent through the backend.',
    logs: 'Review a dense audit trail in a mobile-friendly card format.',
  };

  const navItems: Array<{ label: string; route: string; sectionId: AdminSection }> = [
    { label: 'Overview', route: '/admin', sectionId: 'overview' },
    { label: 'Users', route: '/admin/users', sectionId: 'users' },
    { label: 'Chats', route: '/admin/chats', sectionId: 'chats' },
    { label: 'Logs', route: '/admin/logs', sectionId: 'logs' },
  ];

  const statCards = overview ? (
    <View style={styles.statGrid}>
      <StatCard label="Total users" value={overview.totalUsers} accent={colors.primary} />
      <StatCard label="Active users" value={overview.activeUsers} accent={colors.primary} />
      <StatCard label="Total chats" value={overview.totalChats} accent={colors.primary} />
    </View>
  ) : null;

  const volume = activity?.topActions || [];
  const maximum = Math.max(1,...volume.map(item => Number(item.count)));
  const overviewBlock = <View className="gap-6">
    <View className="flex-row flex-wrap items-center justify-between gap-3"><View className="flex-row items-center gap-2 rounded-md border border-line bg-panel px-4 py-3"><Feather name="calendar" color={colors.onSurfaceVariant} size={16} /><Text className="font-geist text-xs text-ink">Activity overview</Text></View><View className="flex-row items-center gap-3"><Pressable accessibilityLabel="Refresh dashboard" onPress={refreshSection} className="p-3"><Feather name="refresh-cw" color={colors.onSurfaceVariant} size={16} /></Pressable><Pressable onPress={() => void handleExport()} className="flex-row items-center gap-2 rounded-md bg-brand px-4 py-3"><Feather name="download" color="white" size={14} /><Text className="font-geist text-xs font-semibold text-white">Export report</Text></Pressable></View></View>
    {statCards}
    <View className={isWide ? 'flex-row gap-6' : 'gap-4'}>
      <View className="min-w-0 rounded-2xl border border-line bg-panel p-6" style={isWide ? {flex:2} : undefined}>
        <Text className="font-geist text-2xl font-semibold tracking-tight text-ink">Activity Volume</Text><Text className="mt-2 font-body text-sm leading-6 text-muted">Recorded actions across the workspace.</Text>
        {volume.length ? <View className="my-8 h-48 flex-row items-end gap-4 border-b border-line">{volume.slice(0,8).map(item => <View key={item.action} className={`min-w-0 flex-1 rounded-t ${Number(item.count)===maximum ? 'bg-brand' : 'bg-elevated'}`} style={{ height: `${Math.max(3,Number(item.count)/maximum*100)}%` }}><Text className="mt-1 text-center font-geist text-[10px] text-ink">{item.count}</Text></View>)}</View> : <View className="min-h-48 items-center justify-center gap-4"><Feather name="activity" color={colors.onSurfaceVariant} size={32} /><Text className="text-center font-body text-sm leading-6 text-muted">Activity will appear here as your workspace is used.</Text></View>}
        <Text className="font-geist text-xs text-muted">{activity?.last24hLogs || 0} events in the last 24 hours.</Text>
      </View>
      <View className="min-w-0 rounded-2xl border border-line bg-panel p-5" style={isWide ? {flex:1} : undefined}>
        <View className="mb-4 flex-row flex-wrap items-center justify-between gap-3"><Text className="font-geist text-base font-semibold text-ink">System Event Log</Text><Pressable onPress={() => router.push('/admin/logs')}><Text className="font-geist text-xs text-brand">View all</Text></Pressable></View>
        {activity?.recentActivity.length ? activity.recentActivity.slice(0,6).map(item => <View key={item.id} className="flex-row gap-3 border-t border-line py-4"><View className="mt-1 h-2 w-2 rounded-full bg-brand" /><View className="min-w-0 flex-1"><Text className="font-geist text-xs leading-5 text-ink">{item.action.replaceAll('_',' ')}</Text><Text className="mt-2 font-geist text-[10px] text-muted">{new Date(item.created_at).toLocaleString()}</Text></View></View>) : <Text className="font-body text-sm text-muted">No events recorded yet.</Text>}
      </View>
    </View>
  </View>;

  const usersBlock = (
    <View style={styles.sectionStack}>
      <View style={styles.filterRow}>
        <View style={[styles.searchShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <TextInput
            value={search}
            onChangeText={value => { setSearch(value); setPage(1); }}
            placeholder="Search by email..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
        </View>

        <View style={styles.filterChips}>
          {(['all', 'active', 'blocked'] as const).map((entry) => (
            <SectionButton key={entry} label={entry} active={entry === userStatus} onPress={() => { setUserStatus(entry); setPage(1); }} />
          ))}
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.cardList}>
            {users.map((entry) => (
              <View key={entry.id} style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={styles.userHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.onSurface }]}>{entry.email}</Text>
                  <Text style={[styles.listMeta, { color: colors.onSurfaceVariant }]}>
                      {entry.name || 'Unnamed'} - {entry.is_verified ? 'verified' : 'unverified'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: entry.is_active ? 'rgba(76,215,246,0.12)' : 'rgba(255,38,0,0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: entry.is_active ? colors.secondary : colors.primary,
                        },
                      ]}
                    >
                      {entry.is_active ? 'Active' : 'Blocked'}
                    </Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <Pressable
                    onPress={() => updateUserRole(entry.id, entry.role === 'admin' ? 'user' : 'admin')}
                    style={[styles.actionButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                  >
                    <Text style={[styles.actionLabel, { color: colors.onSurface }]}>
                      {entry.role === 'admin' ? 'Demote' : 'Promote'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleUserStatus(entry.id, entry.is_active)}
                    style={[styles.actionButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                  >
                    <Text style={[styles.actionLabel, { color: colors.onSurface }]}>
                      {entry.is_active ? 'Block' : 'Unblock'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => deleteUser(entry.id)}
                    style={[styles.actionButton, { backgroundColor: 'rgba(255,38,0,0.10)', borderColor: 'rgba(255,38,0,0.25)' }]}
                  >
                    <Text style={[styles.actionLabel, { color: colors.primary }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const chatsBlock = (
    <View style={styles.sectionStack}>
      <View style={[styles.panel, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
        <View style={styles.filterRow}>
          <View style={[styles.searchShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, flex: 1 }]}>
            <TextInput
              value={search}
              onChangeText={value => { setSearch(value); setPage(1); }}
              placeholder="Search user or message..."
              placeholderTextColor={colors.onSurfaceVariant}
              style={[styles.searchInput, { color: colors.onSurface }]}
            />
          </View>
          <Pressable onPress={() => setSearch('')} style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <Text style={[styles.actionLabel, { color: colors.onSurface }]}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.cardList}>
            {chats.map((entry) => (
              <View key={entry.id} style={[styles.chatCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatBadge, { color: colors.onSurfaceVariant }]}>{entry.user_email || 'Unknown user'}</Text>
                  <Text style={[styles.chatBadge, { color: colors.onSurfaceVariant }]}>{new Date(entry.created_at).toLocaleString()}</Text>
                </View>
                <Text style={[styles.listTitle, { color: colors.onSurface }]}>{entry.user_message}</Text>
                <Text style={[styles.chatMeta, { color: colors.onSurfaceVariant }]}>
                  Persona: {entry.persona_role} - Session: {entry.session_id.slice(0, 8)}
                </Text>
                <Text style={[styles.chatResponse, { color: colors.onSurface }]}> {entry.ai_response}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const logsBlock = (
    <View style={styles.sectionStack}>
      <View style={styles.filterRow}>
        <View style={[styles.searchShell, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, flex: 1 }]}>
          <TextInput
            value={search}
            onChangeText={value => { setSearch(value); setPage(1); }}
            placeholder="Search action or user..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          {['all', 'USER_LOGIN', 'USER_SIGNUP', 'UPDATE_USER_STATUS', 'CHAT_MESSAGE_SENT'].map((entry) => (
            <SectionButton
              key={entry}
              label={entry}
              active={entry === logAction}
              onPress={() => { setLogAction(entry); setPage(1); }}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.cardList}>
            {logs.map((entry) => (
              <View key={entry.id} style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logAction, { color: colors.primary }]}>{entry.action}</Text>
                  <Text style={[styles.chatBadge, { color: colors.onSurfaceVariant }]}>{new Date(entry.created_at).toLocaleString()}</Text>
                </View>
                <Text style={[styles.listMeta, { color: colors.onSurfaceVariant }]}>
                  {entry.user_email || entry.user_id || 'Unknown user'}
                </Text>
                <Text style={[styles.logDetails, { color: colors.onSurface }]}>
                  {entry.details ? JSON.stringify(entry.details) : '{}'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const content =
    section === 'overview'
      ? overviewBlock
      : section === 'users'
        ? usersBlock
        : section === 'chats'
          ? chatsBlock
          : logsBlock;

  return (
    <LinearGradient colors={scheme === 'dark' ? gradients.background : gradients.backgroundLight} style={[styles.root, { backgroundColor: colors.background }]}>
      <AmbientBackground subtle />
      <View className="min-h-0 min-w-0 flex-1 flex-row">
      {isWide && <WorkspaceSidebar admin />}
      <SafeAreaView style={styles.safeArea}>
        <View className="min-h-16 flex-row items-center justify-between gap-3 border-b border-line bg-panel px-5 py-3"><View className="min-w-0 flex-1 flex-row items-center gap-3">{!isWide && <Pressable accessibilityRole="button" accessibilityLabel="Open navigation" onPress={() => setShowNavigation(true)}><Feather name="menu" color={colors.onSurface} size={20} /></Pressable>}<Text className="min-w-0 flex-1 font-geist text-xl font-semibold tracking-tight text-ink">{sectionTitleMap[section]}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={toggleScheme}><Feather name={scheme === 'dark' ? 'sun' : 'moon'} color={colors.onSurfaceVariant} size={18} /></Pressable><View className="h-8 w-8 items-center justify-center rounded-full bg-brand"><Text className="font-geist text-xs font-semibold text-white">{(user?.name || user?.email || 'AD').slice(0,2).toUpperCase()}</Text></View></View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
            {!isWide && <View style={styles.sectionTabs}>
              {navItems.map((item) => (
                <SectionButton
                  key={item.sectionId}
                  label={item.label}
                  active={item.sectionId === section}
                  onPress={() => router.replace(item.route)}
                />
              ))}
            </View>}

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

            {content}
            {section !== 'overview' && <View className="flex-row items-center justify-between gap-3 border-t border-line py-4">
              <Pressable accessibilityRole="button" accessibilityLabel="Previous page" disabled={isLoading || page <= 1} onPress={() => setPage(current => Math.max(1, current - 1))} className="min-h-11 items-center justify-center rounded-md border border-line px-4" style={{opacity: page <= 1 || isLoading ? 0.4 : 1}}><Text className="font-geist text-xs text-ink">Previous</Text></Pressable>
              <Text className="font-geist text-xs text-muted">{page} / {totalPages}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next page" disabled={isLoading || page >= totalPages} onPress={() => setPage(current => Math.min(totalPages, current + 1))} className="min-h-11 items-center justify-center rounded-md border border-line px-4" style={{opacity: page >= totalPages || isLoading ? 0.4 : 1}}><Text className="font-geist text-xs text-ink">Next</Text></Pressable>
            </View>}
          </View>
        </ScrollView>
      </SafeAreaView>
      </View>
      {showNavigation ? <Modal visible transparent animationType="fade" onRequestClose={() => setShowNavigation(false)}><View className="flex-1 flex-row bg-black/60"><Pressable accessibilityLabel="Close navigation" onPress={() => setShowNavigation(false)} style={StyleSheet.absoluteFill} /><WorkspaceSidebar admin onNavigate={() => setShowNavigation(false)} /></View></Modal> : null}
      {Platform.OS === 'web' ? <ConfirmationDialog visible={pendingDelete !== null} onCancel={() => setPendingDelete(null)} onConfirm={() => {
        const id = pendingDelete;
        setPendingDelete(null);
        if (!id) return;
        void api.delete(`/admin/users/${id}`).then((response) => {
          if (!response.ok) {
            setFeedback({ kind: 'error', message: response.error.message });
            return;
          }
          setUsers((current) => current.filter((entry) => entry.id !== id));
          setFeedback({ kind: 'success', message: 'User deleted.' });
        }).catch((error) => setFeedback({ kind: 'error', message: getErrorMessage(error) }));
      }} /> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    minWidth: 0,
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  heroTitle: {
    fontFamily: typography.displayLg.fontFamily,
    fontSize: typography.displayLgMobile.fontSize,
    lineHeight: typography.displayLgMobile.lineHeight,
    fontWeight: typography.displayLgMobile.fontWeight,
    letterSpacing: typography.displayLgMobile.letterSpacing,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
    maxWidth: 820,
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
  sectionTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionButton: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  sectionButtonLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedbackText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  sectionStack: {
    gap: spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    minHeight: 160,
    flexGrow: 1,
    flexBasis: 220,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  statLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: typography.displayLg.fontFamily,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: typography.displayLg.fontWeight,
  },
  statAccent: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '65%',
    height: 4,
    opacity: 1,
  },
  panel: {
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  panelTitle: {
    fontFamily: typography.headlineMd.fontFamily,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: typography.headlineMd.fontWeight,
  },
  activityList: {
    gap: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  activityBadge: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
  },
  activityLabel: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  activityMeta: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  dualColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardList: {
    gap: spacing.sm,
  },
  listCard: {
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.md,
    gap: spacing.xs,
  },
  listTitle: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  listMeta: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  filterRow: {
    gap: spacing.sm,
  },
  filterChips: {
    gap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  searchShell: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  searchInput: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
  },
  loadingRow: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 11,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
  },
  userActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  actionLabel: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
  },
  chatCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chatBadge: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  chatMeta: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  chatResponse: {
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: 14,
    lineHeight: 22,
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  logAction: {
    fontFamily: typography.labelSm.fontFamily,
    fontSize: 12,
    fontWeight: typography.labelSm.fontWeight,
    letterSpacing: typography.labelSm.letterSpacing,
    textTransform: 'uppercase',
  },
  logDetails: {
    fontFamily: typography.code.fontFamily,
    fontSize: 13,
    lineHeight: 20,
  },
});
