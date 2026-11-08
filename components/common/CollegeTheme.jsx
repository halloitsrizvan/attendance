"use client";

import SlidingDock from '@/components/navigation/SlidingDock';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, Trophy } from 'lucide-react';
import { showsTeacherDock, usesCollegeTheme } from '@/lib/uiTheme.mjs';

const teacherLinks = [
  ['/', Home, 'Attendance'], ['/leave-dashboard', LayoutGrid, 'Leave dash'],
  ['/leave-form', Plus, 'Apply leave'], ['/zehnuth/submit-point', Trophy, 'Achievements'],
];

export default function CollegeTheme({ children }) {
  const pathname = usePathname() || '/';
  if (!usesCollegeTheme(pathname)) return children;
  const dock = showsTeacherDock(pathname);
  const activeIndex = teacherLinks.findIndex(([href]) => href === '/' ? pathname.startsWith('/attendance') || pathname.startsWith('/edit-attendance') || pathname === '/class-wise' : href.startsWith('/zehnuth') ? pathname.startsWith('/zehnuth') : pathname === href);
  return <div className={`college-theme${dock ? ' college-with-dock' : ''}`} data-page={pathname === '/' ? 'home' : 'inner'}>
    {children}
    {dock && <SlidingDock activeIndex={activeIndex} items={teacherLinks.map(([href, icon, label]) => ({ href, icon, label }))} />}
  </div>;
}
