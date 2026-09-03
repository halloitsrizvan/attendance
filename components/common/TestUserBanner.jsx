"use client";

import React, { useEffect, useState } from 'react';
import { isTestUser, setupAxiosTestUserInterceptors } from '@/utils/testUserUtils';
import { Eye, ShieldAlert, X } from 'lucide-react';

export default function TestUserBanner() {
  const [isTest, setIsTest] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setupAxiosTestUserInterceptors();

    const checkUser = () => {
      setIsTest(isTestUser());
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  if (!isTest || dismissed) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-amber-500/30 flex items-center gap-2.5 text-xs font-medium">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-bold text-amber-400">Test Account (test@gmail.com)</span>
        <span className="text-slate-300 hidden sm:inline">• View-Only Mode Active</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 ml-1 transition-colors rounded-full"
          title="Dismiss banner"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
