"use client";
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';

export default function Topbar() {
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

    return (
        <div className="flex items-center justify-between p-4 md:p-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50 mr-4">
            <div className="flex-1 max-w-sm">
                <div className="relative flex items-center w-full bg-white rounded-full shadow-sm border border-slate-100 px-4 py-2">
                    <Search className="text-slate-400 w-5 h-5 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="w-full bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm"
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-4 ml-4">
                {student && (
                    <div className="flex items-center gap-3">
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
                )}
            </div>
        </div>
    );
}
