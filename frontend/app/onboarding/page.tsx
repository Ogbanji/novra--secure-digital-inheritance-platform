'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: 'Welcome to Novra',
      description: 'Let\'s set up your digital legacy',
      content: (
        <div className="space-y-4">
          <p>Novra helps you:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Store digital assets securely
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Designate trusted heirs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Release assets automatically
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Leave messages for loved ones
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Upload Your First File',
      description: 'Store important documents securely',
      content: (
        <div className="space-y-4">
          <p>You can upload:</p>
          <ul className="space-y-2">
            <li>💼 Documents & contracts</li>
            <li>🔑 Private keys & credentials</li>
            <li>📝 Notes & instructions</li>
            <li>💬 Messages & videos</li>
          </ul>
          <p className="text-slate-400 text-sm">All encrypted with AES-256</p>
        </div>
      )
    },
    {
      title: 'Add Your First Heir',
      description: 'Designate who should inherit your digital assets',
      content: (
        <div className="space-y-4">
          <p>You can add:</p>
          <ul className="space-y-2">
            <li>👨‍👩‍👧‍👦 Family members</li>
            <li>👥 Close friends</li>
            <li>⚖️ Trusted advisors</li>
            <li>🏛️ Organizations</li>
          </ul>
          <p className="text-slate-400 text-sm">Each heir gets specific permissions</p>
        </div>
      )
    },
    {
      title: 'Create Inheritance Rules',
      description: 'Decide when and how assets transfer',
      content: (
        <div className="space-y-4">
          <p>Choose your trigger:</p>
          <ul className="space-y-2">
            <li>⏱️ Dead-man switch (inactivity)</li>
            <li>📅 Scheduled date release</li>
            <li>🎂 Milestone-based (age, event)</li>
            <li>🔀 Multi-signature approval</li>
          </ul>
        </div>
      )
    },
    {
      title: 'You're All Set!',
      description: 'Your digital legacy is now protected',
      content: (
        <div className="space-y-4 text-center">
          <p className="text-lg">Your vault is encrypted and secure</p>
          <p className="text-slate-400">Your private keys never leave your device</p>
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500 rounded">
            <p className="text-green-400">✓ All data encrypted end-to-end</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🔐 Novra
          </Link>
        </div>
      </nav>

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    i + 1 <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {i + 1 <= step ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all"
                style={{ width: `${(step / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="card">
            <h1 className="text-4xl font-bold mb-2">{currentStep.title}</h1>
            <p className="text-slate-400 mb-8">{currentStep.description}</p>

            <div className="mb-8">
              {currentStep.content}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-between pt-6 border-t border-slate-700">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Back
              </button>

              {step === steps.length ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                >
                  Next
                </button>
              )}
            </div>
          </div>

          {/* Skip */}
          {step !== steps.length && (
            <div className="text-center mt-6">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-white transition"
              >
                Skip for now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}