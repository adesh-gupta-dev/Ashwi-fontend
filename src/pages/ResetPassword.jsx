import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Missing reset token.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      showToast(res.data?.message || 'Password updated successfully.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.response?.data?.error || 'Unable to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)] font-body min-h-screen flex flex-col">
      <nav className="flex justify-between items-center px-8 w-full top-0 sticky z-40 bg-[var(--color-surface)]/80 backdrop-blur-md h-16 border-b border-[var(--color-outline-variant)]/10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] bg-clip-text text-transparent font-headline tracking-tight">Ashwi</Link>
        </div>
        <div className="flex items-center">
          <button onClick={toggleTheme} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]" aria-label="Toggle theme">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="glass-panel p-8 md:p-10 rounded-[2rem] shadow-2xl border border-[var(--color-surface-container-highest)]/20 w-full max-w-md">
          <div className="mb-6 space-y-2">
            <h2 className="text-3xl font-headline font-extrabold text-[var(--color-on-surface)]">Set New Password</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm">Create a new password for your account.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-[var(--color-on-surface-variant)] ml-1 tracking-wide">NEW PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]/50 font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-[var(--color-on-surface-variant)] ml-1 tracking-wide">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]/50 font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-headline font-bold rounded-xl shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
