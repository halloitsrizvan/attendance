"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import VerifyingAccess from './VerifyingAccess';
import { teacherSessionIsCurrent, teacherSignInPath, teacherReturnPath } from '@/lib/teacherSession.mjs';

const EMPTY_ROLES = [];

const ADMIN_PAGES = [
    '/report',
    '/attendance-report',
    '/students-management',
    '/teachers-management',
    '/minus-report',
    '/admin-complaints'
];

export default function AuthGuard({ children, roles = EMPTY_ROLES }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            // NEW: Ignore student-related paths
            if (pathname.startsWith('/students-')) {
                setIsAuthorized(true);
                return;
            }

            let token = localStorage.getItem('token');
            let teacher = null;
            try { teacher = JSON.parse(localStorage.getItem('teacher') || 'null'); } catch { /* Invalid cached account. */ }
            if (token && !teacherSessionIsCurrent(token)) {
                localStorage.removeItem('token');
                localStorage.removeItem('teacher');
                token = null;
                setIsAuthorized(false);
                if (pathname !== '/login') {
                    router.replace(teacherSignInPath(window.location.pathname + window.location.search));
                    return;
                }
            }

            // 1. Redirect to login if no token and not already on login page
            if (!token && pathname !== '/login') {
                setIsAuthorized(false);
                router.replace('/login');
                return;
            }

            // 2. Already logged in but trying to go to login
            if (token && pathname === '/login') {
                router.replace(teacherReturnPath(new URLSearchParams(window.location.search).get('next')));
                return;
            }

            const email = (teacher?.email || teacher?.EMAIL || '').trim().toLowerCase();
            const isTestUser = email === 'test@gmail.com';

            // Test user can view the entire website
            if (isTestUser) {
                setIsAuthorized(true);
                return;
            }

            const teacherRoles = Array.isArray(teacher?.role) ? teacher.role : (teacher?.role ? [teacher.role] : []);

            // Check explicitly passed roles prop if any
            if (roles && roles.length > 0) {
                const hasRequiredRole = roles.some(r => teacherRoles.includes(r));
                if (!hasRequiredRole) {
                    router.replace('/');
                    return;
                }
            }

            // 3. Role-based access control for admin pages
            const isAdminPage = ADMIN_PAGES.some(page => pathname === page || pathname.startsWith(page + '/'));
            if (token && isAdminPage && !teacherRoles.includes('super_admin')) {
                router.replace('/');
                return;
            }

            // 4. Role-based access for leave-form
            const isLeaveForm = pathname === '/leave-form' || pathname.startsWith('/leave-form/');
            const allowedLeaveRoles = ["class_teacher", "super_admin", "HOD", "HOS", "Principal", "vice_principal", "medical_teacher"];
            if (token && isLeaveForm && !teacherRoles.some(r => allowedLeaveRoles.includes(r))) {
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
    }, [pathname, router, roles]);

    // Show nothing while checking (or a loading skeleton if preferred)
    // For now, only show children if authorized
    return isAuthorized || pathname === '/login' ? children : (
        <VerifyingAccess />
    );
}
