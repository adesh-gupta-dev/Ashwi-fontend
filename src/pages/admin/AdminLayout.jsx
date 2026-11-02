import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar';

const AdminLayout = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)]">
      <Sidebar isAdmin={true} />
      
      <main className="flex-1 lg:ml-64 p-8 relative overflow-hidden">
        {/* Top Navbar Header common to Admin Routes */}
        <header className="flex justify-between items-center w-full mb-10 relative z-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-primary)] font-headline tracking-tight">Admin Console</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">Real-time system health and management.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/chat"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold shadow-sm hover:opacity-90 transition"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              Chat
            </Link>
            <div className="flex items-center bg-[var(--color-surface-container-low)] px-4 py-2 rounded-full border border-[var(--color-outline-variant)]/15 hidden md:flex">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-xl mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/50 w-48" placeholder="Search system..." type="text" />
            </div>
            
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors"
            >
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            
            <div className="ml-4 flex flex-shrink-0 items-center gap-3 pl-4 border-l border-[var(--color-outline-variant)]/30">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none truncate max-w-[120px]">{user.email}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center border-2 border-[var(--color-primary-container)]/20 text-[var(--color-on-primary-container)] font-bold text-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="relative z-10 h-[calc(100%-8rem)] overflow-y-auto pr-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
