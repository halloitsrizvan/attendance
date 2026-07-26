"use client";
import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import Link from 'next/link';

export default function Topbar({ onMenuClick }) {
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            const token = localStorage.getItem('studentToken');
            if (token) {
                try {
                    const res = await axios.get(`${API_PORT}/students/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setStudent(res.data);
                } catch (err) {
                    console.error("Error fetching student in topbar:", err);
                    if (err?.response?.status === 401) {
                        localStorage.removeItem('studentToken');
                        window.location.href = '/students-login';
                    }
                }
            }
        };
        fetchStudent();
    }, []);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        localStorage.removeItem('vivaToken');
        window.location.href = '/students-login';
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md fixed top-0 left-0 md:left-64 right-0 z-40 border-b border-slate-100 shrink-0">
            <div className="flex items-center">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-all active:scale-95 shrink-0"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
                {student && (
                    <div className="relative" ref={dropdownRef}>
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <div className="hidden sm:block text-right">
                                <div className="text-sm font-black text-slate-800">{student["FULL NAME"] || student["SHORT NAME"]}</div>
                                <div className="text-[10px] font-bold text-slate-400">{student.CLASS}th Class</div>
                            </div>
                            {student.image ? (
                                <img src={student.image} alt={student["SHORT NAME"] || student["FULL NAME"]} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold border-2 border-white shadow-sm uppercase">
                                    {(student["SHORT NAME"] || student["FULL NAME"])?.charAt(0) || 'S'}
                                </div>
                            )}
                        </div>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 space-y-1">
                                    <Link 
                                        href="/students-portal/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="block px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"
                                    >
                                        My Profile
                                    </Link>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
