"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, Trophy } from 'lucide-react';
import SlidingDock from './SlidingDock';
import { canApplyLeave } from '@/lib/teacherPermissions.mjs';

export default function TeacherDock({ teacher }) {
  const pathname = usePathname() || '/';
  const [storedTeacher, setStoredTeacher] = useState(null);
  useEffect(() => {
    if (teacher !== undefined) return;
    const update = () => {
      try { setStoredTeacher(JSON.parse(localStorage.getItem('teacher') || 'null')); }
      catch { setStoredTeacher(null); }
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [pathname, teacher]);
  const account = teacher === undefined ? storedTeacher : teacher;
  const items = [
    { href: '/', icon: Home, label: 'Attendance' },
    { href: '/leave-dashboard', icon: LayoutGrid, label: 'Leave dash' },
    ...(canApplyLeave(account) ? [{ href: '/leave-form', icon: Plus, label: 'Apply leave' }] : []),
    { href: '/zehnuth/submit-point', icon: Trophy, label: 'Achievements' },
  ];
  const activeIndex = items.findIndex(({ href }) => href === '/' ? pathname === '/' || pathname.startsWith('/attendance') || pathname.startsWith('/edit-attendance') || pathname === '/class-wise' : href.startsWith('/zehnuth') ? pathname.startsWith('/zehnuth') : pathname === href);
  return <SlidingDock items={items} activeIndex={activeIndex} />;
}
