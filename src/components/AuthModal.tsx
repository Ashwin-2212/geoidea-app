import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { X, Sparkles, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck, GraduationCap, Shield } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: 'student-login' | 'admin-login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, defaultTab = 'student-login' }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'student-login' | 'admin-login' | 'register'>(defaultTab);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await register(name, email, password, role, avatar || undefined, bio || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Helper
  const handleDemoLogin = async (demoEmail: string) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await login(demoEmail, 'Password123!');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header Bar */}
        <div className={`flex items-center justify-between p-5 border-b transition-colors ${
          activeTab === 'admin-login' ? 'bg-indigo-900 text-white border-indigo-800' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              activeTab === 'admin-login' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
            }`}>
              {activeTab === 'admin-login' ? <Shield className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {activeTab === 'student-login' && 'Student Portal Sign In'}
                {activeTab === 'admin-login' && 'Administrator Portal Sign In'}
                {activeTab === 'register' && 'New Account Registration'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {activeTab === 'student-login' && 'Post & upvote geo ideas across Chennai campuses'}
                {activeTab === 'admin-login' && 'Review, manage & oversee campus smart city proposals'}
                {activeTab === 'register' && 'Join GeoIdea as a Student or Administrator'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Role Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1">
          <button
            id="tab-student-login-btn"
            type="button"
            onClick={() => {
              setActiveTab('student-login');
              setEmail('student@chennai.edu');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'student-login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Login
          </button>

          <button
            id="tab-admin-login-btn"
            type="button"
            onClick={() => {
              setActiveTab('admin-login');
              setEmail('admin@chennai.edu');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin-login'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Login
          </button>

          <button
            id="tab-register-btn"
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'student-login' || activeTab === 'admin-login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                  activeTab === 'admin-login' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {activeTab === 'admin-login' ? '🛡️ Admin Account' : '🎓 Student Account'}
                </span>
                <span className="text-xs text-slate-500">
                  {activeTab === 'admin-login' ? 'Authorized Chennai Smart City Admin Access' : 'Chennai Student Portal Access'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder={activeTab === 'admin-login' ? 'admin@chennai.edu' : 'student@chennai.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                  activeTab === 'admin-login' ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-700/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <span>{loading ? 'Authenticating...' : `Sign In as ${activeTab === 'admin-login' ? 'Administrator' : 'Student'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  1-Click Demo Logins
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="demo-student-btn"
                    type="button"
                    onClick={() => handleDemoLogin('student@chennai.edu')}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="leading-none">Student Demo</p>
                      <p className="text-[10px] text-emerald-700 font-normal mt-0.5">student@chennai.edu</p>
                    </div>
                  </button>

                  <button
                    id="demo-admin-btn"
                    type="button"
                    onClick={() => handleDemoLogin('admin@chennai.edu')}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="leading-none">Admin Demo</p>
                      <p className="text-[10px] text-indigo-700 font-normal mt-0.5">admin@chennai.edu</p>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Role Picker for Registration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      role === 'student'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Student Innovator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      role === 'admin'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder={role === 'admin' ? 'Dr. Meenakshi Sundaram' : 'Aravind Kumar'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    placeholder={role === 'admin' ? 'admin@chennai.edu' : 'student@chennai.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bio / Department Tagline
                </label>
                <input
                  id="register-bio-input"
                  type="text"
                  placeholder={role === 'admin' ? 'Smart City Campus Director & Admin' : 'Anna University student passionate about smart mobility'}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Creating Account...' : `Register as ${role === 'admin' ? 'Admin' : 'Student'}`}</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
