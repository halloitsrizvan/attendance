"use client";

import TeacherDock from '@/components/navigation/TeacherDock';
import { usePathname } from 'next/navigation';
import { showsTeacherDock, usesCollegeTheme } from '@/lib/uiTheme.mjs';

export default function CollegeTheme({ children }) {
  const pathname = usePathname() || '/';
  if (!usesCollegeTheme(pathname)) return children;
  const dock = showsTeacherDock(pathname);
  return <div className={`college-theme${dock ? ' college-with-dock' : ''}`} data-page={pathname === '/' ? 'home' : 'inner'}>
    {children}
    {dock && <TeacherDock />}
  </div>;
}
