"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import VerifyingAccess from './VerifyingAccess';

export default function StudentAuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const studentToken = localStorage.getItem('studentToken');
            const studentDataStr = localStorage.getItem('studentData');

            // 1. Redirect to students-login if no token and trying to access portal
            if (!studentToken && pathname === '/students-portal') {
                router.replace('/students-login');
                return;
            }

            // 2. Already logged in but trying to go to login
            if (studentToken && pathname === '/students-login') {
                router.replace('/students-portal');
                return;
            }

            // 3. Authorized to see current page
            setIsAuthorized(true);
        };

        checkAuth();
        
        // Listen for storage changes
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname, router]);

    return isAuthorized || pathname === '/students-login' ? children : <VerifyingAccess />;
}
