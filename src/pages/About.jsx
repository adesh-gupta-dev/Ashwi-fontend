import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const About = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-on-surface)] font-body selection:bg-[var(--color-primary-container)] selection:text-[var(--color-on-primary-container)] min-h-screen flex flex-col overflow-x-hidden">
      {/* Top Navigation Shell */}
      <nav className="flex justify-between items-center px-8 w-full top-0 sticky z-40 bg-[var(--color-surface)]/80 backdrop-blur-md h-16 border-b border-[var(--color-outline-variant)]/10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] bg-clip-text text-transparent font-headline tracking-tight">Ashwi</Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] font-label text-sm transition-colors">Home</Link>
            <Link to="/about" className="text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] font-label text-sm">About</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors text-[var(--color-on-surface-variant)]" aria-label="Toggle theme">
             <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <Link to="/login" className="font-label text-sm tracking-wide text-[var(--color-primary)] font-semibold hover:bg-[var(--color-surface-container-low)] px-4 py-2 rounded-lg transition-colors duration-300">Log In</Link>
        </div>
      </nav>

      <main className="relative flex-1 flex flex-col items-center px-6 md:px-20 py-16 gap-12 overflow-hidden z-10">
        {/* Background Abstract Elements */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-primary-fixed-dim)] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[var(--color-tertiary-fixed-dim)] rounded-full blur-[100px]"></div>
        </div>

        {/* Hero Section */}
        <div className="w-full max-w-4xl text-center space-y-6 mt-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] font-label text-xs font-semibold tracking-wider uppercase">Mission Framework</span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-[var(--color-on-surface)] leading-tight tracking-tight">
              Intelligence designed for <span className="text-[var(--color-primary)] italic">humanity.</span>
            </h1>
            <p className="text-[var(--color-on-surface-variant)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We built Ashwi to elevate the modern professional. By combining specialized foundational models with unparalleled security architecture, we're redefining how deeply AI can integrate into a high-stakes workflow.
            </p>
        </div>

        {/* Content Section */}
        <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/10 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                <h3 className="font-headline text-2xl font-bold mb-3 text-[var(--color-on-surface)]">Global Vision</h3>
                <p className="text-[var(--color-on-surface-variant)] leading-relaxed text-[15px]">
                  Cognitive Sanctuary was established on the premise that intelligence shouldn't be generic. Professionals in medicine, law, and engineering require specialized precision. Our global network of nodes ensures that wherever you are, enterprise-grade AI is seamlessly accessible.
                </p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/10 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_maybe</span>
                <h3 className="font-headline text-2xl font-bold mb-3 text-[var(--color-on-surface)]">Data Sovereignty</h3>
                <p className="text-[var(--color-on-surface-variant)] leading-relaxed text-[15px]">
                  Trust isn't a feature; it's our foundation. Every interaction with Ashwi is guarded by stringent data residency laws and zero-retention policies for unauthorized nodes. Your ideas, your intellectual property, entirely secure.
                </p>
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

export default About;
