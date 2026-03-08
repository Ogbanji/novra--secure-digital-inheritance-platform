'use client';

import Link from 'next/link';
import { useAuthStore } from './lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-slate-700 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
        <div className="container flex justify-between items-center py-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🔐 Novra
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition">
              Create Legacy
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Preserve Your Digital Legacy
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Novra is a secure platform to store digital assets, documents, and instructions.
          Your heirs will receive everything when you want them to.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold text-lg transition">
            Start Now
          </Link>
          <a href="#features" className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded text-white font-semibold text-lg transition">
            Learn More
          </a>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-800/50 py-10 border-y border-slate-700">
        <div className="container flex justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>Zero-Knowledge Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>Military-Grade Security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span>No Hidden Fees</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Digital Vault', desc: 'Securely store files, documents, and digital assets', icon: '🔒' },
            { title: 'Heir Management', desc: 'Add and manage trusted heirs and their permissions', icon: '👥' },
            { title: 'Dead-Man Switch', desc: 'Automatic release triggered by inactivity', icon: '⏱️' },
            { title: 'Time-Locked Release', desc: 'Release assets on specific dates or milestones', icon: '🔓' },
            { title: 'Video Messages', desc: 'Record personal messages for your heirs', icon: '📹' },
            { title: 'Smart Contracts', desc: 'Blockchain-verified inheritance agreements', icon: '⛓️' }
          ].map((feature, i) => (
            <div key={i} className="card hover:border-blue-500 transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20">
        <h2 className="text-4xl font-bold mb-12 text-center">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Free', storage: '5GB', price: '$0', features: ['Basic encryption', 'Up to 5 heirs', 'Email support'] },
            { name: 'Standard', storage: '100GB', price: '$9.99/mo', features: ['Advanced rules', 'Unlimited heirs', 'Video messages', 'Priority support'], highlight: true },
            { name: 'Premium', storage: '1TB', price: '$24.99/mo', features: ['Everything in Standard', 'Smart contracts', 'Multi-signature', 'Phone support'] }
          ].map((plan, i) => (
            <div key={i} className={`card ${plan.highlight ? 'border-blue-500 ring-1 ring-blue-500' : ''} transition`}>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-slate-400 mb-4">{plan.storage} storage</p>
              <p className="text-3xl font-bold mb-6">{plan.price}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2 rounded font-semibold transition ${
                plan.highlight 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 rounded-lg mt-20 mb-20 mx-4">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Legacy?</h2>
          <p className="text-lg mb-8 text-blue-100">Join thousands protecting their digital future</p>
          <Link href="/register" className="px-8 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded font-semibold text-lg transition inline-block">
            Create Your Legacy Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-10 text-slate-400 text-sm">
        <div className="container text-center">
          <p>&copy; 2024 Novra - Digital Inheritance Platform. Inspired by Ada Lovelace's vision.</p>
          <div className="flex gap-6 justify-center mt-4">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Security</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}