"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    // Form states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudent(profileRes.data);
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMsg('All password fields are required.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('New password and confirmation do not match.');
            return;
        }

        if (isNaN(Number(currentPassword)) || isNaN(Number(newPassword))) {
            setErrorMsg('Password must be a valid number.');
            return;
        }

        setActionLoading(true);
        const token = localStorage.getItem('studentToken');

        try {
            const res = await axios.put(
                `${API_PORT}/students/profile`,
                {
                    currentPassword: Number(currentPassword),
                    newPassword: Number(newPassword)
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccessMsg(res.data.message || 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.response?.data?.error || 'Failed to change password. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 mb-6">My Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-3xl border-4 border-slate-100 shadow-inner uppercase mb-4">
                        {(student?.['SHORT NAME'] || student?.['FULL NAME'])?.charAt(0) || 'S'}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                        {student?.['FULL NAME'] || 'Student Name'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {student?.role || 'Student'}
                    </p>

                    <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-3 text-left">
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Admission No:</span>
                            <span className="font-black text-slate-700">{student?.ADNO}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Class:</span>
                            <span className="font-black text-slate-700">{student?.CLASS}th Class</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Short Name:</span>
                            <span className="font-black text-slate-700">{student?.['SHORT NAME']}</span>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-800 shadow-none space-y-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-600" />
                            Change Password
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                            Secure your account by updating your numeric passcode.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {errorMsg && (
                            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-black text-rose-600 uppercase">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-black text-emerald-600 uppercase">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Password (Number)</label>
                            <input 
                                type="password" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="Enter current numeric password" 
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">New Password (Number)</label>
                            <input 
                                type="password" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="Enter new numeric password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Confirm New Password</label>
                            <input 
                                type="password" 
                                pattern="[0-9]*"
                                inputMode="numeric"
                                placeholder="Confirm new numeric password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={actionLoading}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
