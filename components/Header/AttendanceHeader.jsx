"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from '@/components/navigation/NavigationLink';
import { useNavigationRouter as useRouter } from '@/components/navigation/NavigationProvider';
import { Menu, X, ArrowLeft, ChevronDown, ClipboardCheck, CalendarDays, Trophy, Settings, LogOut } from 'lucide-react';
import styles from './AttendanceHeader.module.css';
import { hasAssignedTeacherRole } from '@/lib/teacherPermissions.mjs';

export default function AttendanceHeader({ teacher, hasRole, isTestUser, onLogout, admin = false }) {
  const pathname = usePathname();
  const desktopNav = useRef(null);
  const [desktopGroup, setDesktopGroup] = useState(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState('Attendance');
  const trigger = useRef(null);
  const panel = useRef(null);
  const router = useRouter();
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    setDesktopGroup(null);
  }, [pathname]);
  useEffect(() => {
    if (!desktopGroup) return;
    const dismiss = event => {
      if (!desktopNav.current?.contains(event.target)) setDesktopGroup(null);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        desktopNav.current?.querySelector('[aria-expanded="true"]')?.focus();
        setDesktopGroup(null);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [desktopGroup]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.current?.querySelectorAll('button, a[href]') || []);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const canApply = ['class_teacher', 'super_admin', 'HOD', 'HOS', 'Principal', 'vice_principal', 'medical_teacher'].some(hasRole);
  const canReview = isTestUser || hasRole('zehnuth_admin') || (teacher?.email || teacher?.EMAIL) === 'krehmankoolivayal13889@gmail.com';
  const groups = [
    { name: 'Attendance', icon: ClipboardCheck, links: [['/', 'Take Attendance'], ...(hasRole('class_teacher') || hasRole('super_admin') ? [['/complaints', 'Complaints']] : []), ['/class-wise', 'Attendance Status']] },
    { name: 'Leave', icon: CalendarDays, links: [
      ...(canApply ? [['/leave-form', 'Apply Leave']] : []), ['/leave-dashboard', 'Leave Dashboard'],
      ...(hasAssignedTeacherRole(teacher, 'class_teacher') ? [['/leave-recovery', 'Recovery'], ['/leave-documentation', 'Documentation']] : []),
      ...(hasAssignedTeacherRole(teacher, 'CEPApproval') ? [['/cep-applications', 'CEP Applications']] : []),
    ] },
    { name: 'Zehnuth', icon: Trophy, links: [['/zehnuth/submit-point', 'Submit Point'],
      ...(canReview ? [['/zehnuth/requests', 'Pending Requests'], ['/zehnuth/mentor-approvals', 'Mentor Approvals'], ['/zehnuth/admin-achievements', 'Manage Achievements']] : []),
      ['/zehnuth/leaderboard', 'Student Leaderboard'],
      ['/zehnuth/mentees-requests', "Mentees' Requests"], ['/zehnuth/points', "My Mentees' Points"],
    ] },
    ...(hasRole('super_admin') ? [{ name: 'Admin', icon: Settings, links: [['/students-management', 'Students'], ['/teachers-management', 'Teachers'], ['/attendance-report', 'Attendance Report'], ['/admin-complaints', 'Attendance Complaints'], ['/report', 'Deduction Report'], ['/leave-docs', 'Leave Documentation'], ['/settings', 'Settings'], ['/medical-report', 'Medical Report'], ['/minus-report', 'Minus Report']] }] : []),
  ];
  const initials = (teacher?.name || 'Teacher').slice(0, 2).toUpperCase();
  return <>
    <header className={`${styles.header} ${admin ? styles.adminHeader : ''}`}>
      <div className={styles.bar}>
        <button ref={trigger} className={styles.menu} aria-label="Open navigation" aria-expanded={open} aria-controls="attendance-navigation" onClick={() => setOpen(true)}><Menu size={19} /></button>
        <span className={styles.brand} aria-hidden="true" />
        {admin && <nav ref={desktopNav} className={styles.desktopNav} aria-label="Admin navigation" onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDesktopGroup(null);
        }}>{groups.map(({ name, icon: Icon, links }) => <div className={styles.desktopGroup} key={name} onMouseEnter={() => setDesktopGroup(name)} onMouseLeave={event => {
          if (!event.currentTarget.contains(document.activeElement)) setDesktopGroup(null);
        }}>
          <button className={`${styles.desktopButton} ${links.some(([href]) => href === pathname) ? styles.currentGroup : ''}`} aria-expanded={desktopGroup === name} aria-controls={`desktop-navigation-${name}`} onClick={() => setDesktopGroup(desktopGroup === name ? null : name)}><Icon size={17} />{name}<ChevronDown size={15} className={desktopGroup === name ? styles.rotated : ''} /></button>
          {desktopGroup === name && <div id={`desktop-navigation-${name}`} className={styles.desktopLinks}>{links.map(([href, label]) => <Link key={href} href={href} prefetch={false} aria-current={pathname === href ? 'page' : undefined} onClick={() => setDesktopGroup(null)}>{label}</Link>)}</div>}
        </div>)}</nav>}
        <button className={styles.back} aria-label="Go back" onClick={() => router.back()}><ArrowLeft size={17} /></button>
        <button className={styles.avatar} aria-label="Open account and navigation" onClick={() => setOpen(true)}>{initials}</button>
      </div>
    </header>
    {open && <div className={styles.overlay} onClick={close}>
      <div ref={panel} className={styles.panel} role="dialog" aria-modal="true" aria-label="Main navigation" onClick={event => event.stopPropagation()}>
        <div className={styles.panelTitle}><strong>Menu</strong><button aria-label="Close navigation" onClick={close}><X size={21} /></button></div>
        <nav id="attendance-navigation" className={styles.navigation} aria-label="Teacher navigation">{groups.map(({ name, icon: Icon, links }) => <div className={styles.group} key={name}>
          <button className={styles.groupButton} aria-expanded={expanded === name} aria-controls={`navigation-${name}`} onClick={() => setExpanded(expanded === name ? null : name)}><Icon size={19} /><span>{name}</span><ChevronDown size={17} className={expanded === name ? styles.rotated : ''} /></button>
          {expanded === name && <div id={`navigation-${name}`} className={styles.links}>{links.map(([href, label]) => <Link key={href} href={href} prefetch={false} onClick={close}>{label}</Link>)}</div>}
        </div>)}</nav>
        <div className={styles.account}><span className={styles.avatar}>{initials}</span><div><strong>{teacher?.name || 'Teacher'}</strong><span>{isTestUser ? 'Super Admin' : (Array.isArray(teacher?.role) ? teacher.role : [teacher?.role || 'teacher']).map(role => role.replaceAll('_', ' ')).join(' · ')}</span></div></div>
        <button className={styles.logout} onClick={onLogout}><LogOut size={18} />Log out</button>
      </div>
    </div>}
  </>;
}
