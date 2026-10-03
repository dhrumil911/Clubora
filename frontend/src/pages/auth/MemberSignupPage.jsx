import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { User, Mail, Phone, Lock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MemberSignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (form.phone.trim().length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', form);
      setSuccessMsg(res.data.message || 'Registration successful! Logging you in...');
      
      if (res.data.token && res.data.user) {
        localStorage.setItem('clubora_token', res.data.token);
        if (onLoginSuccess) onLoginSuccess(res.data.user, res.data.token);
        setTimeout(() => {
          navigate('/member');
        }, 1000);
      } else {
        setTimeout(() => {
          navigate('/auth/member/login');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please try again.');
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
            C
          </div>
          <h2 className="text-2xl font-extrabold text-white">Join Clubora</h2>
          <p className="text-xs text-slate-400 mt-1">Create your Member account to book courts & unlock tier perks</p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Roger Federer"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="roger@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="+1 555-0100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up as Member'}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
          Already a Member?{' '}
          <Link to="/auth/member/login" className="text-sky-400 hover:underline font-bold">
            Member Login
          </Link>
        </div>

      </div>
    </div>
  );
}
