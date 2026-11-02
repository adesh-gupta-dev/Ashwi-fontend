import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DashboardOverview = () => {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalChats: 0, totalLogs: 0 });
  const [activity, setActivity] = useState({ recentActivity: [], last24hChats: 0, last24hLogs: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, activityRes, usersRes, chatsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/activity-summary'),
          api.get('/admin/users?limit=5&page=1'),
          api.get('/admin/chats?limit=3&page=1'),
        ]);
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (activityRes.data.success) {
          setActivity(activityRes.data.data);
        }
        if (usersRes.data.success) {
          setRecentUsers(usersRes.data.data || []);
        }
        if (chatsRes.data.success) {
          setRecentChats(chatsRes.data.data || []);
        }
      } catch {
        showToast('Failed to load dashboard summary.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Metrics Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Metric Card 1: Total Users */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-outline-variant)]/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-2xl">group</span>
              </div>
              <span className="text-[var(--color-tertiary)] font-bold text-xs bg-[var(--color-tertiary-fixed-dim)]/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                24h: {activity.last24hLogs?.toLocaleString() || '0'}
              </span>
            </div>
            <p className="text-[var(--color-on-surface-variant)] font-medium text-sm">Total Users</p>
            <h3 className="text-4xl font-extrabold text-[var(--color-on-surface)] mt-1">{stats.totalUsers?.toLocaleString() || '0'}</h3>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">group</span>
          </div>
        </div>

        {/* Metric Card 2: Active Users */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-outline-variant)]/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-tertiary-fixed)]/30 flex items-center justify-center text-[var(--color-tertiary)]">
                <span className="material-symbols-outlined text-2xl">bolt</span>
              </div>
              <span className="text-[var(--color-tertiary)] font-bold text-xs bg-[var(--color-tertiary-fixed-dim)]/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">radio_button_checked</span>
                Active
              </span>
            </div>
            <p className="text-[var(--color-on-surface-variant)] font-medium text-sm">Active Users</p>
            <h3 className="text-4xl font-extrabold text-[var(--color-on-surface)] mt-1">{stats.activeUsers?.toLocaleString() || '0'}</h3>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">bolt</span>
          </div>
        </div>

        {/* Metric Card 3: Total Chats */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl shadow-sm border border-[var(--color-outline-variant)]/10 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-primary)]">
                <span className="material-symbols-outlined text-2xl">forum</span>
              </div>
              <span className="text-[var(--color-on-surface-variant)] font-bold text-xs bg-[var(--color-surface-container-high)] px-2 py-1 rounded-lg">
                24h: {activity.last24hChats?.toLocaleString() || '0'}
              </span>
            </div>
            <p className="text-[var(--color-on-surface-variant)] font-medium text-sm">Total Chats</p>
            <h3 className="text-4xl font-extrabold text-[var(--color-on-surface)] mt-1">{stats.totalChats?.toLocaleString() || '0'}</h3>
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">forum</span>
          </div>
        </div>
      </section>

      {/* Main Content Area: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        {/* User Management Section (Large Column) */}
        <section className="lg:col-span-2">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-8 border border-[var(--color-outline-variant)]/10 h-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-on-surface)] font-headline">User Management</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm">Manage user access and authentication states.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-container-high)] text-[var(--color-primary)] font-semibold text-sm rounded-xl hover:bg-[var(--color-surface-container-highest)] transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Filter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[var(--color-on-surface-variant)] text-xs font-bold uppercase tracking-wider border-b border-[var(--color-outline-variant)]/10">
                    <th className="pb-4 font-bold">Email</th>
                  <th className="pb-4 font-bold">Role</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold">Joined</th>
                  <th className="pb-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline-variant)]/5">
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-[var(--color-on-surface-variant)] italic">
                      No users found.
                    </td>
                  </tr>
                )}
                {recentUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
                          {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-on-surface)]">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-on-surface-variant)]">{u.role}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-[var(--color-tertiary-fixed-dim)]/20 text-[var(--color-tertiary)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
                        {u.is_active ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-on-surface-variant)]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '--'}
                    </td>
                    <td className="py-4 text-right flex justify-end">
                      <Link
                        to="/admin/users"
                        className="text-[var(--color-primary)] text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-all"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            <div className="mt-8 flex justify-center">
              <button className="text-[var(--color-primary)] text-sm font-bold hover:underline">View All Users</button>
            </div>
          </div>
        </section>

        {/* Recent Chat Logs Section (Side Column) */}
        <section className="lg:col-span-1">
          <div className="bg-[var(--color-surface-container-low)] rounded-3xl p-6 border border-[var(--color-outline-variant)]/10 h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[var(--color-on-surface)] font-headline">Recent Chat Logs</h3>
              <p className="text-[var(--color-on-surface-variant)] text-sm">Live interaction stream.</p>
            </div>
            <div className="space-y-4 flex-1">
              {recentChats.length > 0 ? (
                recentChats.map((chat, idx) => (
                  <div key={idx} className="bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase bg-[var(--color-surface-container)] px-2 py-0.5 rounded">
                        Chat #{idx + 1}
                      </span>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)]">
                        {new Date(chat.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-on-surface)] font-semibold mb-1 truncate">User: {chat.user_email || 'Unknown'}</p>
                    <p className="text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/5 p-2 rounded-lg italic truncate">
                      {chat.user_message}
                    </p>
                    <button className="mt-3 text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1 hover:gap-2 transition-all">
                      VIEW DETAILS <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase bg-[var(--color-surface-container)] px-2 py-0.5 rounded">No recent chats</span>
                    <span className="text-[10px] text-[var(--color-on-surface-variant)]">--</span>
                  </div>
                  <p className="text-xs text-[var(--color-on-surface)] font-semibold mb-1">Chats will appear here once users start messaging.</p>
                </div>
              )}
            </div>
            <button className="mt-6 w-full py-3 bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/20 text-[var(--color-on-surface-variant)] font-bold text-sm rounded-2xl hover:bg-[var(--color-surface-container-lowest)] transition-all active:scale-[0.98]">
              Explore Live Logs
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default DashboardOverview;
