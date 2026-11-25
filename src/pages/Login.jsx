import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale, Eye, EyeOff, Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
  const { loginWithCredentials, currentUser, authLoading } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated with active Supabase session, redirect to appropriate role portal
  useEffect(() => {
    if (!authLoading && currentUser) {
      const targetRole = (currentUser.role || 'client').toLowerCase();
      if (targetRole === 'admin') navigate('/admin', { replace: true });
      else if (targetRole === 'lawyer') navigate('/lawyer', { replace: true });
      else navigate('/client', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      // 5. Await the authentication response before navigation.
      const res = await loginWithCredentials(trimmedEmail, password);

      // 2. Never redirect users to the dashboard unless Supabase confirms successful authentication.
      if (res?.success && res.user) {
        const targetRole = (res.user.role || 'client').toLowerCase();
        if (targetRole === 'admin') navigate('/admin');
        else if (targetRole === 'lawyer') navigate('/lawyer');
        else navigate('/client');
      } else {
        // 3. Check the returned error from Supabase.
        // 4. If the email or password is incorrect, display a clear error message.
        const rawMsg = res?.error?.message || '';
        if (
          rawMsg.toLowerCase().includes('invalid login credentials') ||
          rawMsg.toLowerCase().includes('invalid grant') ||
          rawMsg.toLowerCase().includes('invalid_grant') ||
          rawMsg.toLowerCase().includes('user not found')
        ) {
          setError('Invalid email or password. Please verify your credentials or register a new account.');
        } else if (rawMsg) {
          setError(rawMsg);
        } else {
          setError('Invalid email or password. Please verify your credentials or register a new account.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F1E33] via-[#142B4A] to-[#24466B] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#C6A15B] rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
          Verifying Judicial Session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1E33] via-[#142B4A] to-[#24466B] flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in">
        {/* Header Branding */}
        <div className="bg-[#142B4A] dark:bg-slate-950 px-8 pt-8 pb-6 text-center border-b border-[#24466B]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C6A15B] to-[#92732B] shadow-lg mb-3">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Juris<span className="text-[#C6A15B]">Track</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 uppercase tracking-widest font-semibold">
            Legal Case Document & Hearing Tracker
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#142B4A] dark:text-white">Account Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Access verified court dockets, cause lists, and legal filings</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20 focus:border-[#142B4A] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#142B4A]/20 focus:border-[#142B4A] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#142B4A] focus:ring-[#142B4A]"
                />
                <span>Remember session</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[#C6A15B] hover:text-[#92732B] font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#142B4A] hover:bg-[#24466B] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an active account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#142B4A] dark:text-[#C6A15B] hover:underline"
            >
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
