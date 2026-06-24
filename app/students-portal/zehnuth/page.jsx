"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Star, Loader2, PlusCircle, CheckCircle, Clock, XCircle, Trophy } from 'lucide-react';
import { API_PORT } from '@/Constants';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

import MetricCard from '@/components/StudentPortal/MetricCard';
import ApplyZehnuthModal from '@/components/StudentPortal/ApplyZehnuthModal';

export default function ZehnuthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [zehnuthPoints, setZehnuthPoints] = useState([]);
    const [mentor, setMentor] = useState(null);
    const [rank, setRank] = useState('-');
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    useEffect(() => {
        fetchZehnuthData();
    }, []);

    const fetchZehnuthData = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            router.push('/students-login');
            return;
        }

        try {
            const profileRes = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = profileRes.data;
            setStudent(profileData);

            const sid = profileData._id || profileData.id;
            if (sid) {
                const [pointsRes, mentorRes, rankRes] = await Promise.all([
                    axios.get(`${API_PORT}/zehnuth/points?studentId=${sid}`),
                    axios.get(`${API_PORT}/zehnuth/mentor-mentee?studentId=${sid}`),
                    axios.get(`${API_PORT}/zehnuth/points?rankStudentId=${sid}`)
                ]);
                
                setZehnuthPoints(pointsRes.data || []);
                if (mentorRes.data && mentorRes.data.length > 0) {
                    setMentor(mentorRes.data[0].mentorId);
                }
                if (rankRes.data && rankRes.data.rank) {
                    setRank(rankRes.data.rank === '-' ? '-' : `#${rankRes.data.rank}`);
                }
            }
        } catch (err) {
            console.error("Error fetching zehnuth data:", err);
            if (err?.response?.status === 401) {
                localStorage.removeItem('studentToken');
                router.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        let total = 0;
        let approved = 0;
        let pending = 0;

        zehnuthPoints.forEach(point => {
            if (point.status === 'approved') {
                total += (Number(point.points) || 0);
                approved++;
            } else if (point.status === 'pending') {
                pending++;
            }
        });
        return { total, approved, pending };
    }, [zehnuthPoints]);

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Analytics */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-800">My Zehnuth Points</h2>
                        <button 
                            onClick={() => setIsApplyModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        >
                            <PlusCircle size={18} /> Apply for Points
                        </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard 
                            title="Total Points"
                            value={stats.total}
                            color="blue"
                            icon={Star}
                        />
                        <MetricCard 
                            title="My Rank"
                            value={rank}
                            color="amber"
                            icon={Trophy}
                        />
                        <MetricCard 
                            title="Approved Requests"
                            value={stats.approved}
                            color="slate"
                            icon={CheckCircle}
                        />
                        <MetricCard 
                            title="Pending Requests"
                            value={stats.pending}
                            color="slate"
                            icon={Clock}
                        />
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-800">Zehnuth Log</h2>
                </div>
                <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {zehnuthPoints.length > 0 ? zehnuthPoints.map(item => (
                        <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                            <div className="flex items-center gap-4">
                                {item.status === 'approved' ? (
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <CheckCircle size={24} />
                                    </div>
                                ) : item.status === 'rejected' ? (
                                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                        <XCircle size={24} />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <Clock size={24} />
                                    </div>
                                )}
                                <div>
                                    <div className="text-[14px] font-black text-slate-800 uppercase italic tracking-tight">{item.activity}</div>
                                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-1">
                                        <span className="uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{item.category}</span>
                                        • {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        {item.status === 'pending' && (
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest shrink-0 ${
                                                item.mentorApproved 
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {item.mentorApproved ? 'Pending Admin Approval' : 'Pending Mentor Approval'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                {item.imageUrl && (
                                    <a href={item.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-500 hover:text-blue-700 underline uppercase">View Evidence</a>
                                )}
                                {/* <div className="text-center">
                                    <div className={`text-xl font-black ${item.status === 'approved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        +{item.points || 0}
                                    </div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pts</div>
                                </div> */}
                            </div>
                        </div>
                    )) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Star className="w-12 h-12 text-slate-200 mb-4" />
                            <h3 className="text-lg font-black text-slate-800 mb-2">No Zehnuth Points Yet</h3>
                            <p className="text-xs font-bold text-slate-500">Apply for points to build up your achievements record.</p>
                        </div>
                    )}
                </div>
            </div>

            <ApplyZehnuthModal 
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                student={student}
                mentor={mentor}
                onComplete={fetchZehnuthData}
                zehnuthPoints={zehnuthPoints}
            />
        </div>
    );
}
