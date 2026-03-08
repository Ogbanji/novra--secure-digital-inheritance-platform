'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useVaultStore, useHeirStore } from '../lib/store';
import { authAPI, vaultAPI, heirAPI, inheritanceAPI } from '../lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { token, user, setUser } = useAuthStore();
  const { items: vaultItems, setItems: setVaultItems } = useVaultStore();
  const { heirs, setHeirs } = useHeirStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [inactivityStatus, setInactivityStatus] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [userData, vaultData, heirData, statsData, inactivityData] = await Promise.all([
          authAPI.getMe(),
          vaultAPI.getItems(),
          heirAPI.getAll(),
          vaultAPI.getStats(),
          inheritanceAPI.getInactivityStatus()
        ]);

        setUser(userData);
        setVaultItems(vaultData);
        setHeirs(heirData);
        setStats(statsData);
        setInactivityStatus(inactivityData);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, router, setUser, setVaultItems, setHeirs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  const storageUsedPercent = user ? Math.round((user.storage_used_mb / (user.storage_limit_gb * 1024)) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🔐 Novra
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-slate-300">{user?.email}</span>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/');
              }}
              className="text-slate-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Digital Legacy</h1>
          <p className="text-slate-400">Manage your vault, heirs, and inheritance rules</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-slate-400 text-sm">Vault Items</p>
            <p className="text-3xl font-bold">{stats?.totalItems || 0}</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-slate-400 text-sm">Confirmed Heirs</p>
            <p className="text-3xl font-bold">{heirs.filter(h => h.status === 'confirmed').length}</p>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">💾</div>
            <p className="text-slate-400 text-sm">Storage Used</p>
            <p className="text-3xl font-bold">{Math.round(user?.storage_used_mb || 0)}MB</p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${storageUsedPercent}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="text-4xl mb-2">⏱️</div>
            <p className="text-slate-400 text-sm">Days Since Activity</p>
            <p className="text-3xl font-bold">
              {inactivityStatus
                ? Math.floor(
                    (new Date().getTime() - new Date(inactivityStatus.lastActivity).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/vault/upload"
              className="card text-center hover:border-blue-500 transition cursor-pointer"
            >
              <div className="text-4xl mb-3">📤</div>
              <p className="font-semibold">Upload File</p>
            </Link>

            <Link
              href="/dashboard/heirs/add"
              className="card text-center hover:border-blue-500 transition cursor-pointer"
            >
              <div className="text-4xl mb-3">➕</div>
              <p className="font-semibold">Add Heir</p>
            </Link>

            <Link
              href="/dashboard/rules/create"
              className="card text-center hover:border-blue-500 transition cursor-pointer"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <p className="font-semibold">Create Rule</p>
            </Link>

            <Link
              href="/dashboard/settings"
              className="card text-center hover:border-blue-500 transition cursor-pointer"
            >
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-semibold">Settings</p>
            </Link>
          </div>
        </div>

        {/* Recent Vault Items */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Items</h2>
            <Link href="/dashboard/vault" className="text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>

          {vaultItems.length > 0 ? (
            <div className="card">
              <div className="space-y-3">
                {vaultItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.file_name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {(item.file_size_bytes / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center text-slate-400">
              <p>No items yet. Start by uploading your first file.</p>
            </div>
          )}
        </div>

        {/* Heirs Summary */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Heirs</h2>
            <Link href="/dashboard/heirs" className="text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>

          {heirs.length > 0 ? (
            <div className="card">
              <div className="space-y-3">
                {heirs.slice(0, 5).map((heir) => (
                  <div key={heir.id} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                    <div className="flex-1">
                      <p className="font-semibold">{heir.name || heir.email}</p>
                      <p className="text-xs text-slate-400">{heir.relationship}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{heir.inheritance_share}%</p>
                      <p className={`text-xs ${heir.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {heir.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center text-slate-400">
              <p>No heirs added yet. Add your first heir to proceed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}