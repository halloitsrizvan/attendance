"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/StudentPortal/Sidebar';
import Topbar from '@/components/StudentPortal/Topbar';
import Link from '@/components/navigation/NavigationLink';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, CalendarDays, Star } from 'lucide-react';
import { usesCollegeTheme } from '@/lib/uiTheme.mjs';

export default function StudentPortalLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname() || '/students-portal';
    const themed = usesCollegeTheme(pathname);

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
            {themed && <nav className="college-dock student-dock" aria-label="Student quick navigation">
                {[
                    ['/students-portal', Home, 'Dashboard'],
                    ['/students-portal/attendance', CalendarCheck, 'Attendance'],
                    ['/students-portal/leave', CalendarDays, 'Leave'],
                    ['/students-portal/zehnuth', Star, 'Zehnuth'],
                ].map(([href, Icon, label]) => <Link key={href} href={href} prefetch={false} aria-current={(href === '/students-portal' ? pathname === href : pathname.startsWith(href)) ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>)}
            </nav>}
        </div>
    );
}
