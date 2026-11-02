import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoleSelector from '../components/RoleSelector';
import ChatBox from '../components/ChatBox';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ChatDashboard = () => {
  const [activeRole, setActiveRole] = useState('assistant');
  const [roles, setRoles] = useState([]);
  const [sessionId, setSessionId] = useState(uuidv4());
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const didHydrateRef = useRef(false);
  const storageKey = user?.id ? `ashwi_chat_${user.id}` : null;
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const location = useLocation();
  const isHistoryRoute = location.pathname === '/chat/history';

  const fetchSessionHistory = async (sid) => {
    try {
      const res = await api.get(`/chat/history?sessionId=${sid}`);
      if (res.data.success) {
        const historyMsgs = [];
        res.data.data.forEach(item => {
          historyMsgs.push({ text: item.user_message, isBot: false });
          historyMsgs.push({ text: item.ai_response, isBot: true });
        });
        setMessages(historyMsgs);
        if (res.data.data.length > 0) {
          setActiveRole(res.data.data[0].profession_key || res.data.data[0].persona_role);
        }
      }
    } catch {
      showToast('Unable to load selected chat history.', 'error');
    }
  };

  const fetchProfessions = useCallback(async () => {
    try {
      const res = await api.get('/chat/professions');
      if (res.data.success) {
        setRoles(res.data.data || []);
        setActiveRole((prev) => {
          const hasCurrent = (res.data.data || []).some((r) => r.keyName === prev);
          if (hasCurrent) return prev;
          const assistant = (res.data.data || []).find((r) => r.keyName === 'assistant');
          return assistant?.keyName || res.data.data?.[0]?.keyName || 'assistant';
        });
      }
    } catch {
      showToast('Unable to load professions.', 'error');
    }
  }, [showToast]);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/chat/sessions');
      if (res.data.success) {
        setSessions(res.data.data || []);
      }
    } catch {
      showToast('Unable to load chat history.', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfessions();
  }, [fetchProfessions]);

  useEffect(() => {
    if (isHistoryRoute) {
      fetchSessions();
    }
  }, [isHistoryRoute, fetchSessions, historyRefreshKey]);

  useEffect(() => {
    setNameInput(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    if (!storageKey || didHydrateRef.current) return;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.sessionId) {
          setSessionId(parsed.sessionId);
        }
        if (parsed?.activeRole) {
          setActiveRole(parsed.activeRole);
        }
        if (Array.isArray(parsed?.messages)) {
          setMessages(parsed.messages);
        }
      } catch {
        // Ignore invalid cache
      }
    }
    didHydrateRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    const payload = {
      sessionId,
      activeRole,
      messages,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, sessionId, activeRole, messages]);

  const handleSelectSession = (sid) => {
    if (sid === null) {
      setSessionId(uuidv4());
      setMessages([]);
    } else {
      setSessionId(sid);
      fetchSessionHistory(sid);
    }
  };

  const handleSendMessage = async (text) => {
    const newMsg = { text, isBot: false };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await api.post('/chat/message', {
        message: text,
        personaRole: activeRole,
        sessionId: sessionId,
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { text: res.data.data.aiResponse, isBot: true }]);
        if (res.data?.data?.sessionId) {
          setSessionId(res.data.data.sessionId);
        }
        setHistoryRefreshKey((prev) => prev + 1);
      }
    } catch {
      setMessages(prev => [...prev, { text: 'Sorry, I encountered an error. Please try again.', isBot: true }]);
      showToast('Message failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (roleKey) => {
    if (roleKey === activeRole) return;
    setActiveRole(roleKey);
    setSessionId(uuidv4());
    setMessages([]);
    setHistoryRefreshKey((prev) => prev + 1);
  };

  const handleResendVerification = async () => {
    if (!user) {
      showToast('Please log in to resend verification email.', 'error');
      return;
    }
    if (user.isVerified) {
      showToast('Your email is already verified.', 'success');
      return;
    }
    if (!localStorage.getItem('token')) {
      showToast('Please log in again to resend verification.', 'error');
      return;
    }
    setIsResendingVerification(true);
    try {
      const res = await api.post('/auth/resend-verification', {}, { skipAuthRedirect: true });
      showToast(res.data?.message || 'Verification email sent.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to resend verification email.', 'error');
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-surface)] text-[var(--color-on-surface)] antialiased overflow-hidden selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)]">
      <Sidebar isAdmin={false} />

      <main className="flex-1 lg:ml-64 flex flex-col relative bg-[var(--color-surface)] overflow-hidden">
        {/* Role Selector Top Bar */}
        <header className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-xl px-4 md:px-8 py-4 flex items-center justify-between">
          <RoleSelector roles={roles} activeRole={activeRole} onRoleChange={handleRoleChange} />
          
          <div className="flex items-center gap-4 pl-4 shrink-0">
            <div className="hidden sm:flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-highest)] border-2 border-[var(--color-surface)] flex items-center justify-center font-bold text-[var(--color-primary)] text-sm shadow-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
            </div>
            <button onClick={toggleTheme} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {user?.role === 'admin' && (
              <a
                href="/admin"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-semibold shadow-sm hover:opacity-90 transition"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                Admin Dashboard
              </a>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="hidden sm:block p-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        {/* Verification Alert */}
        {user && !user.isVerified && (
          <div className="z-30 mx-4 md:mx-8 mb-4 mt-2 relative rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-[#713700]/10 px-4 py-3 text-sm text-[var(--color-tertiary-container)] dark:text-[var(--color-tertiary-fixed)] border-[var(--color-tertiary-fixed-dim)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-[var(--color-tertiary)]">warning</span>
                 <p className="font-medium text-[var(--color-tertiary)]">Your email is not verified yet. Verification helps secure your account.</p>
               </div>
               <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="rounded-lg bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] px-3 py-1.5 text-xs font-bold transition hover:opacity-80 shadow-sm"
               >
                  {isResendingVerification ? 'Sending...' : 'Resend verification'}
               </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative z-20">
          {isHistoryRoute && (
            <aside className="hidden lg:flex w-80 border-r border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)]/40 p-4 overflow-y-auto">
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-on-surface-variant)]">History</h3>
                  <button
                    type="button"
                    onClick={() => handleSelectSession(null)}
                    className="text-xs font-semibold text-[var(--color-primary)] hover:opacity-80"
                  >
                    New chat
                  </button>
                </div>
                {isLoadingSessions ? (
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Loading...</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.length === 0 && (
                      <p className="text-xs text-[var(--color-on-surface-variant)]">No history yet.</p>
                    )}
                    {sessions.map((session) => (
                      <button
                        key={session.session_id}
                        type="button"
                        onClick={() => handleSelectSession(session.session_id)}
                        className={`w-full text-left p-3 rounded-xl border transition ${
                          session.session_id === sessionId
                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-surface-container-high)]'
                            : 'border-[var(--color-outline-variant)]/20 hover:bg-[var(--color-surface-container-high)]/60'
                        }`}
                      >
                        <p className="text-sm font-medium line-clamp-2">{session.title || 'Chat session'}</p>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">Session: {session.session_id.slice(0, 8)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
          <ChatBox 
            messages={messages} 
            isLoading={isLoading} 
            onSendMessage={handleSendMessage}
            onVoiceError={(message) => showToast(message, 'error')}
          />
        </div>

        {/* Floating Decoration */}
        <div className="absolute top-1/4 -right-24 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-24 w-64 h-64 bg-[var(--color-tertiary)]/5 rounded-full blur-[100px] pointer-events-none"></div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/20 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-full hover:bg-[var(--color-surface-container-high)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Profile</h4>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  placeholder="Your name"
                />
                <button
                  type="button"
                  disabled={isSavingProfile || !nameInput.trim()}
                  onClick={async () => {
                    setIsSavingProfile(true);
                    try {
                      const res = await api.patch('/auth/profile', { name: nameInput.trim() });
                      if (res.data?.success && res.data?.user) {
                        updateUser(res.data.user);
                        showToast('Name updated successfully.', 'success');
                      }
                    } catch (err) {
                      showToast(err.response?.data?.error || 'Unable to update name.', 'error');
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                  className="w-full rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] py-2.5 font-semibold disabled:opacity-60"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Name'}
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-on-surface-variant)]">Change Password</h4>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
                  placeholder="New password"
                />
                <button
                  type="button"
                  disabled={isSavingPassword || !currentPassword || !newPassword}
                  onClick={async () => {
                    setIsSavingPassword(true);
                    try {
                      const res = await api.post('/auth/change-password', {
                        currentPassword,
                        newPassword,
                      });
                      showToast(res.data?.message || 'Password updated.', 'success');
                      setCurrentPassword('');
                      setNewPassword('');
                    } catch (err) {
                      showToast(err.response?.data?.error || 'Unable to update password.', 'error');
                    } finally {
                      setIsSavingPassword(false);
                    }
                  }}
                  className="w-full rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] py-2.5 font-semibold disabled:opacity-60"
                >
                  {isSavingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDashboard;
