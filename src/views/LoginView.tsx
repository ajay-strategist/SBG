import React, { useState } from 'react';
import { useSBG } from '../store/sbgStore';
import {
  Gem,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Users,
  FileText,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, availableUsers } = useSBG();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);
      if (success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }, 400);
  };

  const handleQuickSelectUser = (uname: string) => {
    setUsername(uname);
    setPassword('••••••••••••');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#061F1E] text-white select-none">
      {/* Opulent Jewelry Visual Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep emerald green and luxury marble gradients */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(15, 92, 91, 0.4) 0%, rgba(6, 31, 30, 0.95) 100%)`,
          }}
        />

        {/* Ambient Golden Glows & Silk Light Trails */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#D9B76C]/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#0F5C5B]/30 to-[#D9B76C]/10 blur-3xl pointer-events-none" />

        {/* Decorative Luxury Arcs & Ribbons */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 450 C300 200, 700 700, 1100 350 C1300 180, 1500 500, 1600 300"
            stroke="url(#goldLineGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <path
            d="M100 800 C400 400, 800 850, 1200 450 C1400 250, 1550 600, 1650 400"
            stroke="url(#goldLineGrad2)"
            strokeWidth="1.5"
          />
          <circle cx="950" cy="450" r="180" stroke="url(#goldRingGrad)" strokeWidth="1.5" opacity="0.6" />
          <circle cx="980" cy="430" r="240" stroke="url(#goldRingGrad)" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4" />
          <defs>
            <linearGradient id="goldLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D9B76C" stopOpacity="0" />
              <stop offset="50%" stopColor="#F4E8C8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C49E4B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="goldLineGrad2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#0F5C5B" stopOpacity="0" />
              <stop offset="60%" stopColor="#D9B76C" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F4E8C8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="goldRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D9B76C" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8C6A23" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* 3D Jewelry Ring & Emerald Box Rendering (Vector Silhouette Art) */}
        <div className="absolute left-1/2 -translate-x-12 bottom-16 w-[420px] h-[340px] pointer-events-none opacity-85 hidden xl:block animate-float-slow">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Emerald Velvet Box with embossed SBG */}
            <div className="w-56 h-36 rounded-2xl bg-gradient-to-b from-[#0B4A48] via-[#073634] to-[#04201F] border-2 border-[#D9B76C]/40 shadow-2xl shadow-black/80 flex flex-col items-center justify-end pb-4 rotate-[-6deg]">
              <span className="font-cinzel text-xs tracking-widest text-[#E7CCA0] font-bold opacity-80">
                SBG
              </span>
            </div>
            {/* Diamond Solitaire Ring Artwork */}
            <div className="absolute -top-6 left-20 w-32 h-32 rounded-full border-[6px] border-[#E5C378] shadow-lg shadow-[#D9B76C]/30 flex items-center justify-center rotate-[15deg]">
              <div className="absolute -top-4 w-9 h-9 bg-gradient-to-tr from-white via-[#F4E8C8] to-[#9EE8E3] rotate-45 border-2 border-white shadow-lg shadow-white/80 flex items-center justify-center">
                <Gem className="w-5 h-5 text-[#0F5C5B] -rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 px-8 lg:px-14 py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <img src="/sbg-logo.png" alt="Sree Balaji Gold" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xl font-bold tracking-wider text-white">SBG</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D9B76C]/20 text-[#E7CCA0] border border-[#D9B76C]/40 tracking-wider">
                ERP
              </span>
            </div>
            <p className="text-[10px] font-medium tracking-widest text-[#E7CCA0]/90 uppercase">
              Sree Balaji Gold • Handcrafted 22ct
            </p>
          </div>
        </div>

        {/* Security & Reliability Badge */}
        <div className="hidden md:flex items-center gap-2 text-[11px] tracking-widest text-white/50 uppercase font-semibold">
          <span>SECURE</span>
          <span className="text-[#D9B76C]">•</span>
          <span>RELIABLE</span>
          <span className="text-[#D9B76C]">•</span>
          <span>BUILT FOR GROWTH</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 px-8 lg:px-14 py-6 flex flex-col lg:flex-row items-center justify-between gap-12 max-w-7xl mx-auto w-full">
        {/* Left Hero Narrative */}
        <div className="flex-1 max-w-xl space-y-8 text-left">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-[1.15] tracking-tight">
              <span className="italic block font-normal text-white/90">Turning</span>
              <span className="italic block font-normal text-white/90">Trust into</span>
              <span className="font-bold relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#E7CCA0] via-[#F4E8C8] to-[#D9B76C]">
                Lasting Value
                <span className="absolute left-0 -bottom-2 w-24 h-1 bg-gradient-to-r from-[#D9B76C] to-transparent rounded-full" />
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#B3CBC9] font-normal pt-2">
              Smart Commercial Management for a Brighter Tomorrow
            </p>
          </div>

          {/* 4 Frosted Glass Feature Cards in a Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Card 1 */}
            <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-left group">
              <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/40 border border-[#D9B76C]/30 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4 text-[#E7CCA0]" />
              </div>
              <h4 className="text-xs font-bold text-white block">Customers</h4>
              <p className="text-[10px] text-[#A2C4C2] leading-tight mt-0.5">Stronger Relationships</p>
            </div>

            {/* Card 2 */}
            <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-left group">
              <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/40 border border-[#D9B76C]/30 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-[#E7CCA0]" />
              </div>
              <h4 className="text-xs font-bold text-white block">Transactions</h4>
              <p className="text-[10px] text-[#A2C4C2] leading-tight mt-0.5">Complete Visibility</p>
            </div>

            {/* Card 3 */}
            <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-left group">
              <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/40 border border-[#D9B76C]/30 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4 text-[#E7CCA0]" />
              </div>
              <h4 className="text-xs font-bold text-white block">Insights</h4>
              <p className="text-[10px] text-[#A2C4C2] leading-tight mt-0.5">Data Driven Decisions</p>
            </div>

            {/* Card 4 */}
            <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-left group">
              <div className="w-8 h-8 rounded-xl bg-[#0F5C5B]/40 border border-[#D9B76C]/30 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4 text-[#E7CCA0]" />
              </div>
              <h4 className="text-xs font-bold text-white block">Secure</h4>
              <p className="text-[10px] text-[#A2C4C2] leading-tight mt-0.5">Your Business Our Priority</p>
            </div>
          </div>

          {/* Quotation */}
          <div className="pt-2 border-l-2 border-[#D9B76C]/60 pl-4">
            <p className="text-xs italic text-[#D8E6E4] font-serif tracking-wide">
              "Precision in every gram. Partnership in every step."
            </p>
          </div>
        </div>

        {/* Right Floating Glassmorphism Login Card */}
        <div className="w-full max-w-[440px]">
          <div className="relative p-8 sm:p-10 rounded-[32px] bg-white/85 text-[#173333] backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] transition-all">
            {/* Card Header Brand */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D9B76C] via-[#F4E8C8] to-[#C7A250] flex items-center justify-center mx-auto mb-3 shadow-md">
                <Gem className="w-7 h-7 text-[#0A4847]" />
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-cinzel font-bold text-lg text-[#0F5C5B]">SBG</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D9B76C]/25 text-[#8C6A23] border border-[#D9B76C]/40">
                  ERP
                </span>
              </div>
              <p className="text-[9px] font-bold text-[#8C6A23] uppercase tracking-widest mt-0.5">
                Jewellery Commercial Suite
              </p>

              <h2 className="text-2xl font-serif font-bold text-[#143B39] mt-3">
                Welcome Back
              </h2>
              <p className="text-xs text-[#647777] mt-1">
                Sign in to access your workspace
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email Field */}
              <div className="space-y-1.5">
                <div className="relative">
                  <User className="w-4 h-4 text-[#647777] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username / Email"
                    className="w-full text-sm pl-11 pr-4 py-3 rounded-2xl bg-[#F6F8F7] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all text-[#173333] placeholder-[#647777]/60"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#647777] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full text-sm pl-11 pr-11 py-3 rounded-2xl bg-[#F6F8F7] border border-[#DCE5E3] focus:outline-none focus:ring-2 focus:ring-[#0F5C5B]/20 focus:border-[#0F5C5B] transition-all text-[#173333] placeholder-[#647777]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#647777] hover:text-[#173333] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#647777] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#DCE5E3] text-[#0F5C5B] focus:ring-[#0F5C5B]"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions have been dispatched to your registered email.');
                  }}
                  className="font-semibold text-[#0F5C5B] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F5C5B] hover:bg-[#0A4847] active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-[#0F5C5B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-5 pt-4 border-t border-[#DCE5E3]/70">
              <div className="text-[10px] text-center uppercase tracking-wider text-[#647777] font-semibold mb-2">
                Quick Role Demo
              </div>
              <div className="flex items-center justify-center gap-2">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelectUser(u.username)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      username === u.username
                        ? 'bg-[#0F5C5B] text-white border-[#0F5C5B] font-bold shadow-sm'
                        : 'bg-white/80 text-[#647777] border-[#DCE5E3] hover:border-[#0F5C5B]'
                    }`}
                  >
                    {u.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="mt-5 pt-4 border-t border-[#DCE5E3]/50 flex items-center justify-center gap-2 text-[11px] text-[#647777]">
              <ShieldCheck className="w-4 h-4 text-[#0F5C5B]" />
              <span>Your data is secure with enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-20 px-8 lg:px-14 py-4 flex items-center justify-end text-[11px] text-white/40">
        <span>SBG Jewellery Commercial Suite | v1.0.0</span>
      </footer>
    </div>
  );
};
