import React from 'react';
import Sidebar from '@/components/StudentPortal/Sidebar';
import Topbar from '@/components/StudentPortal/Topbar';

export default function StudentPortalLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Topbar />
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
