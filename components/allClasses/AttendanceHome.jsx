"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, Home, LayoutGrid, Plus, Trophy, Check } from 'lucide-react';
import App from './App';
import Header from '@/components/Header/Header';
import styles from './AttendanceHome.module.css';

const colors = ['#ffd078', '#bfd9ff', '#f4c6f0', '#c7efdf', '#e1d2fc', '#ffd078', '#bfd9ff', '#f4c6f0', '#c7efdf', '#e1d2fc'];

export default function AttendanceHome({ classes, date, setDate, time, setTime, period, setPeriod, more, setMore, err, setErr, preAttendance, isSuperAdmin, students, loading }) {
  const router = useRouter();
  const isTaken = cls => preAttendance.some(record =>
    Number(record.classNumber ?? record.class) === Number(cls.class) &&
    record.attendanceDate?.slice(0, 10) === date && record.attendanceTime === time &&
    (time !== 'Period' || String(record.period) === String(period)) &&
    (!['Jamath', 'More'].includes(time) || (record.custom || record.more || '').trim().toLowerCase() === more.trim().toLowerCase())
  );
  const openClass = (cls, taken) => {
    if (taken) { router.push(`/edit-attendance/${cls.class}`); return; }
    if (time === 'Period' && !period) { setErr('Choose a period to take attendance.'); return; }
    if (time === 'Jamath' && !more) { setErr('Choose a prayer to take attendance.'); return; }
    const query = new URLSearchParams({ date, time, period: time === 'Period' ? String(period) : '', more: ['Jamath', 'More'].includes(time) ? more : '' });
    router.push(`/attendance/${cls.class}?${query}`);
  };

  return <div className={styles.page}>
    <Header appearance="attendance" />
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="attendance-title">
        <h1 id="attendance-title">Mark<br />Attendance</h1>
        <img src="/attendance-calendar.png" alt="" width="156" height="156" className={styles.illustration} />
      </section>
      <section className={styles.filters} aria-label="Attendance session">
        <div className={styles.filterRow}>
          <label className={styles.date} title={isSuperAdmin ? 'Choose attendance date' : 'Only super admins can change the attendance date'}>
            <CalendarDays size={16} />
            <input aria-label="Attendance date" type="date" value={date} disabled={!isSuperAdmin}
              onClick={event => {
                try { event.currentTarget.showPicker?.(); } catch { /* Keep native date input behaviour as fallback. */ }
              }}
              onChange={event => setDate(event.target.value)} />
          </label>
          <select aria-label="Attendance session" value={time} onChange={event => { setTime(event.target.value); setPeriod(''); setMore(''); setErr(''); }}>
            {['Period', 'Morning', 'Afternoon', 'Night', 'Jamath', 'Quiraath', 'Minus'].map(option => <option key={option}>{option}</option>)}
          </select>
        </div>
        {time === 'Period' && <div className={styles.periods}>{Array.from({ length: 10 }, (_, index) => index + 1).map(value => <button type="button" key={value} disabled={[1, 7, 8].includes(value)} aria-pressed={Number(period) === value} className={Number(period) === value ? styles.selected : ''} onClick={() => { setPeriod(value); setErr(''); }}>{value}</button>)}</div>}
        {time === 'Jamath' && <div className={styles.prayers}>{['Fajr', 'Zuhr', 'Asr', 'Maghrib', 'Isha'].map(value => <button key={value} aria-pressed={more === value} className={more === value ? styles.selected : ''} onClick={() => { setMore(value); setErr(''); }}>{value}</button>)}</div>}
        {err && <p className={styles.error} role="alert">{err}</p>}
      </section>
      {time === 'Minus' ? <App students={students} /> : <section className={styles.grid} aria-label="Choose a class" aria-busy={loading}>
        {loading ? Array.from({ length: 10 }, (_, index) => <div key={index} className={styles.skeleton} />) : classes.length ? classes.map((cls, index) => {
          const taken = isTaken(cls);
          return <button key={cls._id || cls.class} className={styles.card} style={{ backgroundColor: colors[index % colors.length] }} onClick={() => openClass(cls, taken)} aria-label={`Class ${cls.class}, ${taken ? 'attendance completed, edit' : 'take attendance'}`}>
            <span className={styles.number}>{cls.class}</span>
            {taken ? <Check className={`${styles.cardArrow} ${styles.completedTick}`} size={20} strokeWidth={3} /> : <ArrowUpRight className={styles.cardArrow} size={13} />}
            <strong>Class {cls.class}</strong><span className={styles.count}>{taken ? 'Completed ? Edit' : `${cls.totalStudents ?? cls.students_count ?? 0} students`}</span>
          </button>;
        }) : <p className={styles.empty}>No classes available. Refresh to try again.</p>}
      </section>}
    </main>
    <nav className={styles.bottomNav} aria-label="Quick navigation">
      {[[ '/', Home, 'Attendance'], ['/leave-dashboard', LayoutGrid, 'Leave dash'], ['/leave-form', Plus, 'Apply leave'], ['/zehnuth/submit-point', Trophy, 'Achievements']].map(([href, Icon, label]) => <Link key={href} href={href} prefetch={false} className={href === '/' ? styles.activeNav : ''} aria-current={href === '/' ? 'page' : undefined}><Icon size={18} strokeWidth={1.7} /><span>{label}</span></Link>)}
    </nav>
  </div>;
}
