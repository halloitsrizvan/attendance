"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Award, BookOpen, Clock, AlertCircle, RefreshCw, BarChart2, Star, CheckCircle, XCircle } from 'lucide-react';
import PortalSkeleton from '@/components/StudentPortal/PortalSkeleton';

const VIVA_BASE_URL = 'https://daily-viva-tracker-3p9w.vercel.app/api/student-portal';

export default function DailyVivaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [marksSummary, setMarksSummary] = useState(null);
    const [marksHistory, setMarksHistory] = useState([]);
    const [subjectMetrics, setSubjectMetrics] = useState([]);

    useEffect(() => {
        initializeVivaDashboard();
    }, []);

    const initializeVivaDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Ensure student is logged into main portal
            const studentDataStr = localStorage.getItem('studentData');
            if (!studentDataStr) {
                router.push('/students-login');
                return;
            }
            
            const studentToken = localStorage.getItem('studentToken');
            let studentData = {};
            if (studentDataStr) {
                try {
                    studentData = JSON.parse(studentDataStr);
                } catch(e){}
            }

            // Also try to decode the token payload just in case the data is in the JWT
            let tokenData = {};
            if (studentToken) {
                try {
                    const payloadBase64 = studentToken.split('.')[1];
                    tokenData = JSON.parse(atob(payloadBase64));
                } catch(e){}
            }

            const adNumber = studentData.ADNO || studentData.adNumber || tokenData.ADNO || tokenData.adno;
            // The current attendance backend doesn't store collegeId. 
            // We use the Darul Irfan Islamic Academy collegeId provided by the user as the default fallback.
            const collegeId = studentData.college?._id || studentData.collegeId || tokenData.collegeId || '69095cc816bb776fa2d3c4c9';

            if (!adNumber || !collegeId) {
                console.error("Missing credentials. StudentData:", studentData, "TokenData:", tokenData);
                setError(`Missing required credentials (ADNO or College ID) to sync with Daily Viva Tracker.`);
                setLoading(false);
                return;
            }

            // 2. Try to get or create Viva Token
            let vivaToken = localStorage.getItem('vivaToken');
            
            if (!vivaToken) {
                // Silent Login to Viva Tracker
                const loginRes = await axios.post(`${VIVA_BASE_URL}/login`, {
                    username: String(adNumber),
                    password: String(adNumber),
                    collegeId: collegeId
                });
                
                if (loginRes.data?.success && loginRes.data?.token) {
                    vivaToken = loginRes.data.token;
                    localStorage.setItem('vivaToken', vivaToken);
                } else {
                    throw new Error("Failed to authenticate with Viva Tracker");
                }
            }

            // 3. Fetch Data from Viva Tracker
            const authConfig = { headers: { Authorization: `Bearer ${vivaToken}` } };
            
            const [marksRes, subjectsRes] = await Promise.all([
                axios.get(`${VIVA_BASE_URL}/marks?limit=50`, authConfig),
                axios.get(`${VIVA_BASE_URL}/marks/subject-wise`, authConfig)
            ]);

            if (marksRes.data?.success) {
                setMarksSummary(marksRes.data.summary);
                setMarksHistory(marksRes.data.marks);
            }
            
            if (subjectsRes.data?.success) {
                setSubjectMetrics(subjectsRes.data.subjects);
            }

        } catch (err) {
            console.error("Error initializing Daily Viva:", err);
            // If token expired or invalid, clear it so next reload retries login
            if (err.response?.status === 401) {
                localStorage.removeItem('vivaToken');
                setError("Session expired. Please click 'Retry Connection' to reconnect.");
            } else {
                setError(err.response?.data?.error || "Failed to load Daily Viva scores.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <PortalSkeleton hasBanner={false} />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Error</h2>
                <p className="text-slate-500 max-w-md mb-6">{error}</p>
                <button 
                    onClick={initializeVivaDashboard}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0A84C6] text-white rounded-xl font-bold shadow-lg shadow-[#0A84C6]/20 hover:bg-[#086a9f] transition-all active:scale-95"
                >
                    <RefreshCw size={18} />
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-16 sm:mt-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Award className="text-[#0A84C6]" size={32} />
                        Daily Viva Scores
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Track your performance and daily evaluations.</p>
                </div>
            </div>

            {/* Overall Summary Stats */}
            {marksSummary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vivas</span>
                        <div className="text-3xl font-black text-slate-800">{marksSummary.totalVivas}</div>
                    </div>
                    <div className="bg-[#0A84C6]/5 p-5 rounded-3xl shadow-sm border border-[#0A84C6]/10 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-[#0A84C6] uppercase tracking-widest mb-1">Average Score</span>
                        <div className="text-3xl font-black text-[#0A84C6]">{marksSummary.averageMark?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-3xl shadow-sm border border-emerald-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Great (2)</span>
                        <div className="text-3xl font-black text-emerald-600">{marksSummary.distribution?.great || 0}</div>
                    </div>
                    <div className="bg-blue-50 p-5 rounded-3xl shadow-sm border border-blue-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Good (1)</span>
                        <div className="text-3xl font-black text-blue-600">{marksSummary.distribution?.good || 0}</div>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-3xl shadow-sm border border-amber-100 flex flex-col justify-center">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Poor (0)</span>
                        <div className="text-3xl font-black text-amber-600">
                            {marksSummary.totalVivas - (marksSummary.distribution?.great || 0) - (marksSummary.distribution?.good || 0)}
                        </div>
                    </div>
                </div>
            )}

            {/* Subject Metrics & Recent History Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Subject Metrics (Left Col - spans 1) */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                        <BarChart2 size={16} className="text-[#0A84C6]" />
                        Subject Averages
                    </h2>
                    
                    <div className="space-y-3">
                        {subjectMetrics.map((subject, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-[#0A84C6]/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800">{subject.subject}</h3>
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                                        {subject.totalVivas} Vivas
                                    </span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-2xl font-black text-[#0A84C6]">{subject.averageMark?.toFixed(2)}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Average</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-8 text-center">
                                            <div className="h-10 bg-emerald-100 rounded-t-md relative flex items-end justify-center pb-1">
                                                <span className="text-[10px] font-bold text-emerald-700">{subject.distribution?.great || 0}</span>
                                            </div>
                                            <div className="text-[8px] font-black text-emerald-600 uppercase mt-1">Grt</div>
                                        </div>
                                        <div className="w-8 text-center">
                                            <div className="h-10 bg-blue-100 rounded-t-md relative flex items-end justify-center pb-1">
                                                <span className="text-[10px] font-bold text-blue-700">{subject.distribution?.good || 0}</span>
                                            </div>
                                            <div className="text-[8px] font-black text-blue-600 uppercase mt-1">Good</div>
                                        </div>
                                        <div className="w-8 text-center">
                                            <div className="h-10 bg-amber-100 rounded-t-md relative flex items-end justify-center pb-1">
                                                <span className="text-[10px] font-bold text-amber-700">
                                                    {subject.totalVivas - (subject.distribution?.great || 0) - (subject.distribution?.good || 0)}
                                                </span>
                                            </div>
                                            <div className="text-[8px] font-black text-amber-600 uppercase mt-1">Poor</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {subjectMetrics.length === 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 font-semibold text-sm">
                                No subject data available.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent History (Right Col - spans 2) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                        <Clock size={16} className="text-[#0A84C6]" />
                        Recent History
                    </h2>
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {marksHistory.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {marksHistory.map((mark) => {
                                    const isGreat = mark.mark === 2;
                                    const isGood = mark.mark === 1;
                                    
                                    return (
                                        <div key={mark._id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isGreat ? 'bg-emerald-100 text-emerald-600' :
                                                    isGood ? 'bg-blue-100 text-blue-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {isGreat ? <Star size={20} className="fill-current" /> :
                                                     isGood ? <CheckCircle size={20} /> :
                                                     <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{mark.subject}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                                                        <span>{new Date(mark.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        {mark.teacherId?.name && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span>{mark.teacherId.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {mark.punishment && (
                                                        <div className="mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg inline-block border border-rose-100/50">
                                                            Task: {mark.punishment}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:flex-col sm:items-end shrink-0 pl-14 sm:pl-0">
                                                <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                                                    isGreat ? 'bg-emerald-500 text-white' :
                                                    isGood ? 'bg-blue-500 text-white' :
                                                    'bg-amber-500 text-white'
                                                }`}>
                                                    {isGreat ? 'Great (2)' : isGood ? 'Good (1)' : 'Poor (0)'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-semibold">No viva scores recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
