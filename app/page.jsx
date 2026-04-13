"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import AllClass from '@/components/allClasses/AllClass'
import { Plus, LayoutDashboard, ClipboardList } from 'lucide-react'
import Link from 'next/link'

function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
        <Header/>
        
        <main className="pt-4">
          <AllClass edit={false}/>
        </main>

        {/* Quick Access Panel - Floating Icons */}
        <div className="fixed bottom-8 right-6 flex flex-col gap-3 z-50">
           {/* Apply Leave Button */}
           <Link 
              href="/leave-form" 
              className="w-12 h-12 bg-sky-500 text-white rounded-2xl shadow-xl shadow-sky-200 border border-sky-400 flex items-center justify-center hover:bg-sky-600 transition-all hover:scale-110 active:scale-95 group relative"
           >
              <Plus size={24} strokeWidth={2.5} />
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap translate-x-2 group-hover:translate-x-0 shadow-xl">
                Apply Leave
              </div>
           </Link>

           {/* Dashboard Button */}
           <Link 
              href="/leave-dashboard" 
              className="w-12 h-12 bg-white text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 group relative"
           >
              <LayoutDashboard size={20} />
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap translate-x-2 group-hover:translate-x-0 shadow-xl">
                Leave Dashboard
              </div>
           </Link>

           {/* Quick Status Button */}
           <Link 
              href="/leave-dashboard?tab=onLeave" 
              className="w-12 h-12 bg-white text-rose-500 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-rose-50 transition-all hover:scale-110 active:scale-95 group relative"
           >
              <ClipboardList size={20} />
              <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap translate-x-2 group-hover:translate-x-0 shadow-xl">
                Leave Status
              </div>
           </Link>
        </div>

        {/* Bottom padding for mobile to ensure content isn't hidden behind floating buttons */}
        <div className="h-20 sm:hidden"></div>
    </div>
  )
}

export default Home
