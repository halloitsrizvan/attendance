"use client";

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation';
import { useNavigationRouter as useRouter } from '@/components/navigation/NavigationProvider';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import AttendanceHeader from './AttendanceHeader';
import { clearApiCache } from '@/utils/apiCache';
import { usesCollegeTheme } from '@/lib/uiTheme.mjs';

const getSafeLocalStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => { }, removeItem: () => { } };

function Header({ appearance } = {}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    setMounted(true);
    const storedTeacher = getSafeLocalStorage().getItem("teacher");
    if (storedTeacher) {
      try {
        const parsedTeacher = JSON.parse(storedTeacher);
        setTeacher(parsedTeacher);

        const teacherId = parsedTeacher.id || parsedTeacher._id;
        if (teacherId) {
          axios.get(`${API_PORT}/teachers/${teacherId}`)
            .then(res => {
              if (res.data) {
                const updatedTeacher = {
                  ...parsedTeacher,
                  ...res.data,
                  id: res.data._id
                };
                setTeacher(updatedTeacher);
                getSafeLocalStorage().setItem('teacher', JSON.stringify(updatedTeacher));
              }
            })
            .catch(err => console.error("Error updating teacher data", err));
        }
      } catch (e) {
        console.error("Invalid teacher data in localStorage");
      }
    }
  }, []);

  const navigate = useRouter()

  if (!mounted) return null;

  const handleLogout = () => {
    clearApiCache();
    getSafeLocalStorage().removeItem('token')
    getSafeLocalStorage().removeItem('teacher')
    navigate.push('/login')
  }

  const isTestUser = (teacher?.email || teacher?.EMAIL || '').trim().toLowerCase() === 'test@gmail.com';

  const hasRole = (role) => {
    if (isTestUser) return true;
    if (!teacher?.role) return false;
    if (Array.isArray(teacher.role)) {
      return teacher.role.includes(role);
    }
    return teacher.role === role;
  };

  return <AttendanceHeader teacher={teacher} hasRole={hasRole} isTestUser={isTestUser} onLogout={handleLogout} admin={appearance !== 'attendance' && !usesCollegeTheme(pathname || '/')} />;
}

export default Header;
