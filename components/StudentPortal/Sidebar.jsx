"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, CalendarCheck, CalendarDays, Award, Star, Trophy, LayoutDashboard, User, BookOpen, Sliders } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const router = useRouter();
    const [role, setRole] = React.useState('student');

    React.useEffect(() => {
        if (onClose) onClose();
    }, [pathname]);

    React.useEffect(() => {
        const fetchStudentRole = async () => {
            const token = localStorage.getItem('studentToken');
            if (token) {
                try {
                    const res = await axios.get(`${API_PORT}/students/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && res.data.role) {
                        setRole(res.data.role);
                        // Sync back to local storage
                        const storedData = localStorage.getItem('studentData');
                        if (storedData) {
                            const parsed = JSON.parse(storedData);
                            parsed.role = res.data.role;
                            localStorage.setItem('studentData', JSON.stringify(parsed));
                        }
                    }
                } catch (err) {
                    console.error("Error fetching student profile in sidebar:", err);
                }
            }
        };

        const storedData = localStorage.getItem('studentData');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                if (parsed && parsed.role) {
                    setRole(parsed.role);
                }
            } catch (e) {
                console.error("Error parsing student data in sidebar:", e);
            }
        }
        fetchStudentRole();
    }, []);

    const navItems = [
        { name: 'Dashboard', path: '/students-portal', icon: LayoutDashboard },
        { name: 'Attendance', path: '/students-portal/attendance', icon: CalendarCheck },
        { name: 'Leave', path: '/students-portal/leave', icon: CalendarDays },
        { name: 'CEP', path: '/students-portal/cep', icon: Award },
        { name: 'Zehnuth', path: '/students-portal/zehnuth', icon: Star },
        { name: 'Best Class', path: '/students-portal/best-class', icon: Trophy },
        { name: 'Lisan', path: '/students-portal/lisan', icon: BookOpen },
        { name: 'Controls', path: '/students-portal/controls', icon: Sliders },
        { name: 'Profile', path: '/students-portal/profile', icon: User },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (item.name === 'Best Class') {
            return role && role !== 'student';
        }
        if (item.name === 'Lisan') {
            return role && role.toLowerCase() === 'lisan';
        }
        if (item.name === 'Controls') {
            return role && role.toLowerCase() === 'studentadmin';
        }
        return true;
    });

    const handleLogout = () => {
        localStorage.removeItem('studentToken');
        router.push('/students-login');
    };

    return (
        <div className={`w-64 bg-[#0A84C6] min-h-screen text-white flex flex-col fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 transform md:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src="/logo.png" alt="Darul Irfan" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display='none'; }} />
                    <CalendarCheck className="w-6 h-6 text-[#0A84C6] absolute" style={{ zIndex: -1 }} /> 
                </div>
                <div>
                    <h1 className="text-sm font-black leading-tight">Darul Irfan</h1>
                    <h2 className="text-sm font-semibold opacity-90 leading-tight">Student Portal</h2>
                </div>
            </div>

            <nav className="flex-1 mt-8 px-4 flex flex-col gap-2">
                {filteredNavItems.map((item) => {
                    const isActive = item.path === '/students-portal' 
                        ? pathname === item.path 
                        : pathname.startsWith(item.path);

                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            className={`flex items-center px-4 py-3 rounded-2xl transition-all font-semibold text-lg ${
                                isActive 
                                ? 'bg-white/20 shadow-inner' 
                                : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                            }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <button 
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-semibold text-lg opacity-90 hover:opacity-100"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
