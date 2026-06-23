"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/StudentPortal/Sidebar';
import Topbar from '@/components/StudentPortal/Topbar';

export default function StudentPortalLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            {/* Backdrop overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden animate-in fade-in duration-200" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 md:ml-64 ml-0 flex flex-col min-h-screen w-full overflow-x-hidden">
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 px-4 pb-4 pt-[88px] md:px-8 md:pb-8 md:pt-[104px] w-full max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
