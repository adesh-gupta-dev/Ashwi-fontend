import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        showToast('Welcome back!', 'success');
        navigate('/chat');
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)] font-body selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)] min-h-screen flex flex-col">
      {/* Top Navigation Shell */}
      <nav className="flex justify-between items-center px-8 w-full top-0 sticky z-40 bg-[var(--color-surface)]/80 backdrop-blur-md h-16 border-b border-[var(--color-outline-variant)]/10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] bg-clip-text text-transparent font-headline tracking-tight">Ashwi</Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] font-label text-sm">Home</Link>
            <Link to="/about" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] font-label text-sm transition-colors">About</Link>
          </div>
        </div>
        <div className="flex items-center">
            <button onClick={toggleTheme} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]" aria-label="Toggle theme">
               <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
        </div>
      </nav>

      <main className="relative flex-1 flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-12 gap-12 overflow-hidden">
        {/* Background Abstract Elements */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-30">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-primary-fixed-dim)] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[var(--color-tertiary-fixed-dim)] rounded-full blur-[100px]"></div>
        </div>

        {/* Visual Anchor: Custom Animated Mesh Gradient (replacing image) */}
        <div className="hidden lg:block absolute bottom-0 right-[40%] translate-y-1/4 -z-10 w-[500px] h-[500px]">
          <div className="relative w-full h-full animate-spin-slow" style={{ animationDuration: '20s' }}>
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[var(--color-primary)] rounded-full mix-blend-multiply opacity-40 blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--color-tertiary)] rounded-full mix-blend-multiply opacity-50 blur-[90px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] left-[20%] w-[250px] h-[250px] bg-[var(--color-secondary)] rounded-full mix-blend-multiply opacity-40 blur-[70px] animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>
        </div>

        {/* Left Content: Value Proposition */}
        <div className="w-full md:w-1/2 space-y-10 z-10">
          <div className="space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-label text-xs font-semibold tracking-wider">REDEFINING EXPERTISE</span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-[var(--color-on-surface)] leading-tight tracking-tight">
              Your Cognitive <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-container)] bg-clip-text text-transparent">Sanctuary.</span>
            </h1>
            <p className="text-[var(--color-on-surface-variant)] text-lg md:text-xl max-w-xl leading-relaxed">
              Ashwi is a sophisticated intelligence partner that adapts to your professional world. One interface, infinite specialized depth.
            </p>
          </div>

          {/* Bento Expertise Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {[
                { title: 'The Clinician', desc: 'Precision diagnostics and medical research synthesis.', icon: 'medical_services' },
                { title: 'The Counsel', desc: 'Expert legal analysis and complex document review.', icon: 'gavel' },
                { title: 'The Engineer', desc: 'System architecture and multi-stack debugging.', icon: 'terminal' },
                { title: 'The Strategist', desc: 'Executive-level insights and data-driven vision.', icon: 'psychology_alt' }
            ].map((feature, i) => (
                <div key={i} className="p-6 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/10 flex flex-col gap-3 group hover:bg-[var(--color-surface-container-high)] hover:shadow-md transition-all duration-300">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">{feature.icon}</span>
                    <h3 className="font-headline font-bold text-[var(--color-on-surface)]">{feature.title}</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{feature.desc}</p>
                </div>
            ))}
          </div>
        </div>

        {/* Right Content: Auth Overlay Card */}
        <div className="w-full md:w-[460px] z-20">
          <div className="glass-panel p-8 md:p-10 rounded-[2rem] shadow-2xl border border-[var(--color-surface-container-highest)]/20">
            <div className="mb-8 space-y-2">
              <h2 className="text-3xl font-headline font-extrabold text-[var(--color-on-surface)]">Welcome Back</h2>
              <p className="text-[var(--color-on-surface-variant)] text-sm">Enter your credentials to access your sanctuary.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="font-label text-xs font-semibold text-[var(--color-on-surface-variant)] ml-1 tracking-wide">WORK EMAIL</label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]/50 font-medium"
                    placeholder="name@ashwi.ai"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label text-xs font-semibold text-[var(--color-on-surface-variant)] tracking-wide">PASSWORD</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/20 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]/50 font-medium"
                    placeholder="••••••••" 
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input id="remember" type="checkbox" className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)]/20 rounded focus:ring-[var(--color-primary)]" />
                <label htmlFor="remember" className="text-xs text-[var(--color-on-surface-variant)] font-medium">Stay signed in for 30 days</label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] font-headline font-bold rounded-xl shadow-lg shadow-[var(--color-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? 'Authenticating...' : 'Secure Login'}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--color-on-surface-variant)] font-medium">
                  New to Ashwi? <Link to="/signup" className="font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-container)] transition-colors ml-1">Request early access</Link>
                </p>
              </div>
            </form>
          </div>
          
          {/* Contextual Social Proof */}
          <div className="mt-8 flex flex-col items-center gap-4 opacity-70">
            <p className="text-xs font-label uppercase tracking-widest text-[var(--color-on-surface-variant)] font-bold">Trusted by teams at</p>
            <div className="flex gap-8 grayscale brightness-0 opacity-60">
              <span className="font-headline font-extrabold text-xl tracking-tight leading-none text-slate-800">BMW</span>
              <span className="font-headline font-extrabold text-xl tracking-tight leading-none text-slate-800">MERCEDES</span>
              <span className="font-headline font-extrabold text-xl tracking-tight leading-none text-slate-800">SIEMENS</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer for Landing Page Shell */}
      <footer className="mt-auto px-10 py-6 bg-[var(--color-surface-container-low)] flex flex-col md:flex-row justify-between items-center gap-6 border-t border-[var(--color-outline-variant)]/10 z-10">
        <div className="flex items-center gap-2 relative">
          <span className="text-xl font-bold font-headline text-[var(--color-primary)]">Ashwi AI</span>
          <span className="text-xs text-[var(--color-on-surface-variant)] font-medium ml-2 border-l border-[var(--color-outline-variant)]/30 pl-2">© 2024 Cognitive Sanctuary Inc.</span>
        </div>
        <div className="flex gap-8 text-xs font-label font-semibold text-[var(--color-on-surface-variant)]">
          <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
