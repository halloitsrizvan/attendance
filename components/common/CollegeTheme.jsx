"use client";

import Link from '@/components/navigation/NavigationLink';
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
  return <div className={`college-theme${dock ? ' college-with-dock' : ''}`} data-page={pathname === '/' ? 'home' : 'inner'}>
    {children}
    {dock && <nav className="college-dock" aria-label="Quick navigation">
      {teacherLinks.map(([href, Icon, label]) => {
        const active = href === '/' ? pathname.startsWith('/attendance') || pathname.startsWith('/edit-attendance') || pathname === '/class-wise' : href.startsWith('/zehnuth') ? pathname.startsWith('/zehnuth') : pathname === href;
        return <Link key={href} href={href} prefetch={false} aria-current={active ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>;
      })}
    </nav>}
  </div>;
}
