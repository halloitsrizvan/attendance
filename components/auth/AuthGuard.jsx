"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import VerifyingAccess from './VerifyingAccess';

const ADMIN_PAGES = [
    '/report',
    '/students-management',
    '/teachers-management',
    '/minus-report'
];

export default function AuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const teacherStr = localStorage.getItem('teacher');
            const teacher = teacherStr ? JSON.parse(teacherStr) : null;

            // NEW: Ignore student-related paths
            if (pathname.startsWith('/students-')) {
                setIsAuthorized(true);
                return;
            }

            // 1. Redirect to login if no token and not already on login page
            if (!token && pathname !== '/login') {
                router.replace('/login');
                return;
            }

            // 2. Already logged in but trying to go to login
            if (token && pathname === '/login') {
                router.replace('/');
                return;
            }

            // 3. Role-based access control for admin pages
            const isAdminPage = ADMIN_PAGES.some(page => pathname === page || pathname.startsWith(page + '/'));
            if (token && isAdminPage && teacher?.role !== 'super_admin') {
                router.replace('/');
                return;
            }

            // 4. Role-based access for leave-form
            const isLeaveForm = pathname === '/leave-form' || pathname.startsWith('/leave-form/');
            const allowedLeaveRoles = ["class_teacher", "super_admin", "HOD", "HOS", "Principal"];
            if (token && isLeaveForm && !allowedLeaveRoles.includes(teacher?.role)) {
                router.replace('/');
                return;
            }

            // 5. Authorized to see current page
            setIsAuthorized(true);
        };

        checkAuth();
        
        // Listen for storage changes (logout in other tab etc)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname, router]);

    // Show nothing while checking (or a loading skeleton if preferred)
    // For now, only show children if authorized
    return isAuthorized || pathname === '/login' ? children : (
        <VerifyingAccess />
    );
}
