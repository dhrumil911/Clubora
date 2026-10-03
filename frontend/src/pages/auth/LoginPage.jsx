import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { Lock, Mail, AlertTriangle, CheckCircle2, ArrowRight, Shield, Award, User, Coffee } from 'lucide-react';

export default function LoginPage({ role, title, subtitle, demoCredentials, onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoCredentials?.email || '');
  const [password, setPassword] = useState(demoCredentials?.password || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getRoleIcon = () => {
    switch (role) {
      case 'OWNER': return Award;
      case 'FRONT_DESK_STAFF': return Shield;
      case 'BAR_SHOP_STAFF': return Coffee;
      case 'MEMBER': return User;
      default: return User;
    }
  };
  const RoleIcon = getRoleIcon();

  const getRedirectPath = (userRole) => {
    switch (userRole) {
      case 'OWNER': return '/owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK': return '/front-desk';
      case 'BAR_SHOP_STAFF':
      case 'BAR': return '/bar-shop';
      case 'MEMBER': return '/member';
      default: return '/member';
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
        targetRole: role
      });

      if (res.data.token && res.data.user) {
        localStorage.setItem('clubora_token', res.data.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user, res.data.token);
        }
        const targetPath = getRedirectPath(res.data.user.role);
        navigate(targetPath);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid credentials or access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-slate-950">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-sky-500/20 mb-3">
            <RoleIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{title || 'Login to Clubora'}</h2>
          <p className="text-xs text-slate-400 mt-1">{subtitle || 'Enter your credentials to access your portal'}</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email / User ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="user@clubora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : `Login as ${role.replace('_', ' ')}`}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {role === 'MEMBER' && (
          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
            Don't have a Member account yet?{' '}
            <Link to="/auth/member/signup" className="text-sky-400 hover:underline font-bold">
              Sign Up Here
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
