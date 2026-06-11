"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import { BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProgramSubmitForm from '@/components/programs/ProgramSubmitForm';

export default function SubmitClassReport() {
    const router = useRouter();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            setTeacher(JSON.parse(storedTeacher));
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Access Denied</h2>
                        <p className="text-slate-500 font-medium mt-2">Please login as a teacher to access this page.</p>
                        <button onClick={() => router.push('/login')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Header />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 space-y-6">

                {/* Header Section */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <BookOpen size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">Class Teacher Hub</p>
                                <h1 className="text-3xl font-black uppercase italic tracking-tight">Monthly Programs</h1>
                            </div>
                        </div>
                        <p className="text-indigo-100 font-medium max-w-xl text-sm leading-relaxed">
                            Submit your monthly class report containing all curriculum, co-curriculum, and extra-curricular programs executed.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <ProgramSubmitForm 
                    submitterId={teacher._id || teacher.id}
                    classNumber={teacher.classNum}
                    submitterType="teacher"
                />
            </div>
        </div>
    );
}
