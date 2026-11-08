"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/StudentPortal/Sidebar';
import Topbar from '@/components/StudentPortal/Topbar';
import SlidingDock from '@/components/navigation/SlidingDock';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, CalendarDays, Star } from 'lucide-react';
import { usesCollegeTheme } from '@/lib/uiTheme.mjs';

export default function StudentPortalLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname() || '/students-portal';
    const themed = usesCollegeTheme(pathname);
    const dockItems = [
        { href: '/students-portal', icon: Home, label: 'Dashboard' },
        { href: '/students-portal/attendance', icon: CalendarCheck, label: 'Attendance' },
        { href: '/students-portal/leave', icon: CalendarDays, label: 'Leave' },
        { href: '/students-portal/zehnuth', icon: Star, label: 'Zehnuth' },
    ];

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
                <main className="student-portal-content flex-1 px-4 pb-4 pt-[88px] md:px-8 md:pb-8 md:pt-[104px] w-full max-w-full">
                    {children}
                </main>
            </div>
            {themed && <SlidingDock mobileOnly label="Student quick navigation" items={dockItems} activeIndex={dockItems.findIndex(item => item.href === '/students-portal' ? pathname === item.href : pathname.startsWith(item.href))} />}
        </div>
    );
}
