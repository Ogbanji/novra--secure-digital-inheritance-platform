'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../lib/store';

export default function Register() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState({
    question1: '',
    answer1: '',
    question2: '',
    answer2: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(email, password, securityQuestions);
      setToken(response.token);
      setUser({
        userId: response.userId,
        email,
        heirCount: 0,
        vaultCount: 0,
        storage_limit_gb: 5,
        storage_used_mb: 0
      });
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-slate-700 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
        <div className="container flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🔐 Novra
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Create Your Digital Legacy</h1>
            <p className="text-slate-400 mb-6">Secure your assets and protect your future</p>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded p-4 mb-6 text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  required
                  className="w-full"
                />
                <p className="text-xs text-slate-400 mt-1">Must be at least 12 characters with numbers and symbols</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full"
                />
              </div>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-sm font-semibold mb-3">Security Questions (for recovery)</p>
                <div>
                  <input
                    type="text"
                    placeholder="Question 1"
                    value={securityQuestions.question1}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, question1: e.target.value })}
                    className="w-full text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={securityQuestions.answer1}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, answer1: e.target.value })}
                    className="w-full text-xs mt-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}