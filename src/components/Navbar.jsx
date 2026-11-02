import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaSignOutAlt, FaHome, FaUserShield } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    if (!user || user.isVerified || isResendingVerification) return;
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
    <nav className="h-16 glass-panel border-b-0 sticky top-0 z-50 flex items-center justify-between px-6 rounded-b-2xl mb-4">
      <div className="flex items-center space-x-4">
        <Link to="/chat" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
          Ashwi AI
        </Link>
        {user && (
          <div className="hidden md:flex space-x-2">
            <Link to="/chat" className="text-sm font-medium hover:text-[var(--accent)] flex items-center gap-1">
              <FaHome /> Chat
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium hover:text-[var(--accent)] flex items-center gap-1 px-4">
                <FaUserShield /> Admin
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
          {theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-slate-600" />}
        </button>
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-medium">{user.email}</span>
              {user.isVerified ? (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  title="Click to resend verification email"
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-70 transition"
                >
                  {isResendingVerification ? 'Sending...' : 'Unverified'}
                </button>
              )}
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition">
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary text-sm px-4 py-1">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
