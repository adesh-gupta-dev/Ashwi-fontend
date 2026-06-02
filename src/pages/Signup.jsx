import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      showToast('Please enter your name (at least 2 characters).', 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please provide a valid email address.', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/signup', { name: name.trim(), email, password });
      if (res.data.success) {
        setSuccessMsg('Account created successfully! Please check your email for the verification link.');
        showToast('Signup successful. Verify your email before logging in.', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Failed to create account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--color-background)] font-body text-[var(--color-on-background)] selection:bg-[var(--color-primary-fixed-dim)] selection:text-[var(--color-on-primary-fixed)] overflow-x-hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-background)] flex justify-between items-center w-full px-12 py-6 max-w-[1440px] mx-auto sticky top-0 z-50">
        <Link to="/" className="font-headline text-2xl font-bold tracking-tighter text-[var(--color-on-surface)]">
          Ashwi
        </Link>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex gap-8 font-label text-sm tracking-wide">
            <Link to="/" className="text-[var(--color-on-surface)]/60 hover:text-[var(--color-on-surface)] transition-colors duration-300">Home</Link>
            <Link to="/about" className="text-[var(--color-on-surface)]/60 hover:text-[var(--color-on-surface)] transition-colors duration-300">About</Link>
          </nav>
          <div className="flex gap-4 items-center">
            <button onClick={toggleTheme} className="p-2 mr-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]" aria-label="Toggle theme">
               <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <Link to="/login" className="font-label text-sm tracking-wide text-[var(--color-primary)] font-semibold hover:bg-[var(--color-surface-container-low)] px-4 py-2 rounded-lg transition-colors duration-300">Log In</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-stretch overflow-hidden">
        {/* Left: Branding & Visuals (Split Screen) */}
        <section className="hidden md:flex relative w-1/2 bg-[var(--color-surface-container-low)] overflow-hidden items-center justify-center p-24">
          {/* Background Mesh Gradient (Replacing image) */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent z-10"></div>
            
            {/* Mesh Nodes */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[var(--color-primary-fixed)] mix-blend-multiply blur-[120px] opacity-80 animate-pulse" style={{ animationDuration: '15s' }}></div>
            <div className="absolute bottom-[-10%] right-[-20%] w-[90%] h-[90%] rounded-full bg-[var(--color-tertiary-fixed-dim)] mix-blend-multiply blur-[140px] opacity-60 animate-pulse" style={{ animationDuration: '20s', animationDelay: '5s' }}></div>
            <div className="absolute top-[40%] right-[10%] w-[60%] h-[60%] rounded-full bg-[var(--color-inverse-primary)] mix-blend-multiply blur-[100px] opacity-70 animate-ping-slow" style={{ animationDuration: '25s' }}></div>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-[var(--color-on-surface)] mb-6 leading-tight">
              Intelligence designed for <span className="text-[var(--color-primary)] italic">humanity</span>.
            </h1>
            <p className="text-lg text-[var(--color-on-surface-variant)] leading-relaxed opacity-80">
              Step into a digital workspace where focus is the priority and complexity is whispered away by elegant AI orchestration.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">auto_awesome</span>
                <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Contextual Flow</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)]">AI that learns your pace, not just your patterns.</p>
              </div>
              <div className="space-y-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">security</span>
                <h3 className="font-headline font-bold text-[var(--color-on-surface)]">Secure Core</h3>
                <p className="text-xs text-[var(--color-on-surface-variant)]">Your data remains within your private sanctuary.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Registration Form */}
        <section className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[var(--color-surface)]">
          <div className="w-full max-w-md">
            <div className="text-center md:text-left mb-10">
              <h2 className="font-headline text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2">Join the Sanctuary</h2>
              <p className="text-[var(--color-on-surface-variant)] text-sm">Create your account to start your cognitive journey.</p>
            </div>

            {successMsg ? (
              <div className="mb-4 p-6 bg-[var(--color-tertiary-fixed)]/20 dark:bg-[var(--color-tertiary-container)] text-[var(--color-tertiary)] dark:text-[var(--color-on-tertiary-container)] border border-[var(--color-tertiary)]/30 rounded-xl text-center overflow-hidden flex flex-col items-center shadow-sm">
                <FaCheckCircle className="text-4xl mb-4 opacity-90" />
                <p className="font-medium">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mt-6 font-bold bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)] px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <label className="block font-label text-[11px] font-semibold text-[var(--color-on-surface-variant)] tracking-[0.1em] uppercase">FULL NAME</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[var(--color-surface-container-lowest)] border-none ring-1 ring-[var(--color-outline-variant)]/40 rounded-xl px-5 py-4 text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-300 font-medium" 
                      placeholder="Alex Sterling" 
                      required 
                      minLength={2} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-[11px] font-semibold text-[var(--color-on-surface-variant)] tracking-[0.1em] uppercase">WORK EMAIL</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[var(--color-surface-container-lowest)] border-none ring-1 ring-[var(--color-outline-variant)]/40 rounded-xl px-5 py-4 text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-300 font-medium" 
                      placeholder="alex@company.ai" 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-[11px] font-semibold text-[var(--color-on-surface-variant)] tracking-[0.1em] uppercase">PASSWORD</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[var(--color-surface-container-lowest)] border-none ring-1 ring-[var(--color-outline-variant)]/40 rounded-xl px-5 py-4 text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-300 font-medium" 
                      placeholder="••••••••" 
                      required 
                      minLength={8} 
                    />
                  </div>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] flex items-center gap-1 font-medium mt-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    At least 8 characters
                  </p>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <input type="checkbox" required className="mt-1 rounded-sm border-[var(--color-outline-variant)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-surface-container-lowest)]" />
                  <p className="text-xs text-[var(--color-on-surface-variant)] leading-tight font-medium">
                    I agree to the <a href="#" className="text-[var(--color-primary)] hover:underline ml-1">Terms of Service</a> and <a href="#" className="text-[var(--color-primary)] hover:underline ml-1">Privacy Policy</a>.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-headline font-bold rounded-xl shadow-lg shadow-[var(--color-primary)]/10 hover:shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {!successMsg && (
                <div className="mt-10 pt-8 border-t border-[var(--color-outline-variant)]/20 text-center">
                <p className="text-[var(--color-on-surface-variant)] text-sm mb-6 font-medium">Or continue with</p>
                <div className="flex gap-4 justify-center">
                    <button className="flex items-center justify-center w-full py-3 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/10 rounded-xl hover:bg-[var(--color-surface-container-highest)] transition-colors duration-300">
                      <span className="font-semibold text-sm">Google</span>
                    </button>
                    <button className="flex items-center justify-center w-full py-3 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/10 rounded-xl hover:bg-[var(--color-surface-container-highest)] transition-colors duration-300">
                      <span className="material-symbols-outlined mr-3 text-lg">terminal</span>
                      <span className="font-semibold text-sm">SSO</span>
                    </button>
                </div>
                <p className="mt-10 text-sm text-[var(--color-on-surface-variant)] font-medium">
                    Already have an account? <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline ml-1">Log in</Link>
                </p>
                </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-background)] py-8 z-10 relative border-t border-[var(--color-outline-variant)]/10 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 w-full max-w-[1440px] mx-auto">
          <div className="mb-4 md:mb-0">
            <span className="font-headline font-extrabold text-[var(--color-on-surface)] text-lg">Ashwi Intelligence.</span>
            <p className="text-[10px] font-label font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-1">© 2024 Ashwi Intelligence. Crafted for clarity.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="font-label text-xs font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:underline transition-all">Privacy Policy</a>
            <a href="#" className="font-label text-xs font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:underline transition-all">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
