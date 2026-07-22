"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { Trophy, Medal, Crown, TrendingUp, Loader2, Search, Download, X, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ADMIN_EMAIL = 'krehmankoolivayal13889@gmail.com';

const LEAGUES = [
    { name: 'Diamond', min: 750, color: 'text-sky-400', bg: 'bg-sky-50' },
    { name: 'Platinum', min: 500, color: 'text-slate-400', bg: 'bg-slate-50' },
    { name: 'Emerald', min: 250, color: 'text-emerald-400', bg: 'bg-emerald-50' },
    { name: 'Gold', min: 100, color: 'text-amber-400', bg: 'bg-amber-50' },
    { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [teacher, setTeacher] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentPoints, setStudentPoints] = useState([]);
    const [loadingPoints, setLoadingPoints] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
            setTeacher(JSON.parse(storedTeacher));
        }
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get('/api/zehnuth/points?leaderboard=true');
            setLeaderboard(res.data);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentClick = async (studentItem) => {
        if (!studentItem || !studentItem.student) return;
        const studentId = studentItem.student._id;
        setSelectedStudent(studentItem);
        setModalOpen(true);
        setLoadingPoints(true);
        try {
            const res = await axios.get(`/api/zehnuth/points?studentId=${studentId}&status=approved`);
            setStudentPoints(res.data);
        } catch (err) {
            console.error("Error fetching student points:", err);
        } finally {
            setLoadingPoints(false);
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text("ZEHNUTH Leaderboard", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);

        const tableData = filteredData.map((item, index) => [
            index + 1,
            item.student["SHORT NAME"] || item.student["FULL NAME"],
            item.student.ADNO,
            getLeague(item.totalPoints).name,
            item.mentorName || '-',
            item.totalPoints
        ]);

        autoTable(doc, {
            startY: 38,
            head: [['Rank', 'Student Name', 'ADNO', 'League', 'Mentor', 'Points']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 38 },
            styles: { fontSize: 9 }
        });

        doc.save(`Zehnuth_Leaderboard_${new Date().toISOString().split('T')[0]}.pdf`);
        setDownloadModalOpen(false);
    };

    const downloadExcel = () => {
        const tableData = filteredData.map((item, index) => ({
            'Rank': index + 1,
            'Student Name': item.student["SHORT NAME"] || item.student["FULL NAME"],
            'ADNO': item.student.ADNO,
            'League': getLeague(item.totalPoints).name,
            'Mentor': item.mentorName || '-',
            'Points': item.totalPoints
        }));

        const worksheet = XLSX.utils.json_to_sheet(tableData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");
        
        XLSX.writeFile(workbook, `Zehnuth_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`);
        setDownloadModalOpen(false);
    };

    const filteredData = leaderboard.filter(item =>
        (item.student["SHORT NAME"] || item.student["FULL NAME"] || "").toLowerCase().includes(search.toLowerCase()) ||
        item.student.ADNO.toString().includes(search)
    );

    const getLeague = (points) => {
        return LEAGUES.find(l => points >= l.min) || LEAGUES[LEAGUES.length - 1];
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                <div className="animate-pulse">
                    <div className="mb-8 px-2 flex justify-between items-end">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                                <div className="h-8 bg-slate-100 rounded-lg w-32"></div>
                            </div>
                            <div className="h-4 bg-slate-50 rounded-md w-40"></div>
                        </div>
                        <div className="h-10 bg-slate-50 rounded-xl w-32"></div>
                    </div>

                    <div className="flex items-end justify-center gap-2 mb-10 px-2 h-48">
                        <div className="flex-1 bg-slate-50 h-16 rounded-t-xl"></div>
                        <div className="flex-1 bg-slate-100 h-24 rounded-t-xl scale-110"></div>
                        <div className="flex-1 bg-slate-50 h-12 rounded-t-xl"></div>
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-slate-50/50 rounded-2xl w-full border border-slate-100"></div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
    
    const isZehnuthAdmin = teacher && (
        (teacher.email || teacher.EMAIL)?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
        (Array.isArray(teacher.role) ? teacher.role.includes('zehnuth_admin') : teacher.role === 'zehnuth_admin')
    );

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-xl mx-auto px-4 pt-20 pb-12">
                {/* Header */}
                <div className="mb-8 px-2">
                    <div className="flex items-center justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <span className="p-2 bg-amber-500 text-white rounded-xl"><Trophy size={20} /></span>
                                Rankings
                            </h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Top performers this season</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-slate-100 transition-all w-32"
                                />
                            </div>
                        </div>
                        {isZehnuthAdmin && (
                            <button
                                onClick={() => setDownloadModalOpen(true)}
                                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 group shadow-lg shadow-slate-100"
                                title="Download Report"
                            >
                                <Download size={18} />
                                {/* <span className="text-[10px] font-black uppercase tracking-widest pr-1">Report</span> */}
                            </button>
                        )}
                        
                    </div>
                </div>

                {/* Compact Top 3 */}
                {!search && filteredData.length >= 3 && (
                    <div className="flex items-end justify-center gap-2 mb-10 px-2 h-48">
                        {/* 2nd Place */}
                        <div
                            className="flex-1 flex flex-col items-center cursor-pointer hover:scale-[1.03] transition-all"
                            onClick={() => handleStudentClick(filteredData[1])}
                        >
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2 relative shadow-sm">
                                <Medal size={24} />
                                <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">2</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-800 text-center line-clamp-1 w-full">{filteredData[1].student["SHORT NAME"] || filteredData[1].student["FULL NAME"]}</p>
                            <p className="text-[9px] font-bold text-amber-500">{filteredData[1].totalPoints} PTS</p>
                            <div className="w-full bg-slate-100 h-16 rounded-t-xl mt-2"></div>
                        </div>

                        {/* 1st Place */}
                        <div
                            className="flex-1 flex flex-col items-center cursor-pointer hover:scale-[1.03] transition-all"
                            onClick={() => handleStudentClick(filteredData[0])}
                        >
                            <div className="w-18 h-18 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-500 mb-2 relative scale-110 shadow-md">
                                <Crown size={32} />
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">1</span>
                            </div>
                            <p className="text-[11px] font-black text-slate-900 text-center line-clamp-1 w-full">{filteredData[0].student["SHORT NAME"] || filteredData[0].student["FULL NAME"]}</p>
                            <p className="text-[10px] font-black text-amber-600">{filteredData[0].totalPoints} PTS</p>
                            <div className="w-full bg-amber-400 h-24 rounded-t-xl mt-2 shadow-lg shadow-amber-100"></div>
                        </div>

                        {/* 3rd Place */}
                        <div
                            className="flex-1 flex flex-col items-center cursor-pointer hover:scale-[1.03] transition-all"
                            onClick={() => handleStudentClick(filteredData[2])}
                        >
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 mb-2 relative shadow-sm">
                                <Medal size={24} />
                                <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">3</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-800 text-center line-clamp-1 w-full">{filteredData[2].student["SHORT NAME"] || filteredData[2].student["FULL NAME"]}</p>
                            <p className="text-[9px] font-bold text-amber-500">{filteredData[2].totalPoints} PTS</p>
                            <div className="w-full bg-orange-100 h-12 rounded-t-xl mt-2"></div>
                        </div>
                    </div>
                )}

                {/* Ranking List */}
                <div className="space-y-3">
                    {filteredData.map((item, index) => {
                        const league = getLeague(item.totalPoints);
                        return (
                            <div
                                key={item._id}
                                onClick={() => handleStudentClick(item)}
                                className="bg-slate-50/50 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 cursor-pointer active:scale-[0.99]"
                            >
                                <div className="w-8 font-black text-slate-300 text-sm italic">
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.student["SHORT NAME"] || item.student["FULL NAME"]}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AD: {item.student.ADNO}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${league.bg} ${league.color}`}>
                                            {league.name}
                                        </span>
                                        {item.mentorName && (
                                            <span className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-400">
                                                {item.mentorName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-800 flex items-center justify-end gap-1.5">
                                        <Trophy size={14} className="text-amber-400" /> {item.totalPoints}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {modalOpen && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black uppercase italic leading-none">{selectedStudent.student["SHORT NAME"] || selectedStudent.student["FULL NAME"]}</h2>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Zehnuth Points Breakdown</p>
                                {selectedStudent.mentorName && (
                                    <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Mentor: {selectedStudent.mentorName}</p>
                                )}
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 flex-grow max-h-[60vh] custom-scrollbar">
                            {loadingPoints ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            ) : studentPoints.length === 0 ? (
                                <p className="text-center text-slate-500 py-12 text-sm font-bold italic">No approved points found.</p>
                            ) : (
                                studentPoints.map((pt) => (
                                    <div key={pt._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{pt.activity}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {pt.category} • {new Date(pt.createdAt).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black">
                                                +{pt.points}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col pl-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Points</span>
                                <span className="text-sm font-black text-indigo-600">{selectedStudent.totalPoints} PTS</span>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {downloadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDownloadModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black uppercase italic leading-none">Download Report</h2>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Select Format</p>
                            </div>
                            <button onClick={() => setDownloadModalOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={18} /></button>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            <button
                                onClick={downloadPDF}
                                className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] border border-red-100"
                            >
                                <div className="p-2.5 bg-white rounded-xl shadow-sm text-red-500">
                                    <FileText size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-sm uppercase tracking-tight">PDF Document</h3>
                                    {/* <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">Best for printing</p> */}
                                </div>
                            </button>
                            <button
                                onClick={downloadExcel}
                                className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] border border-emerald-100"
                            >
                                <div className="p-2.5 bg-white rounded-xl shadow-sm text-emerald-500">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-sm uppercase tracking-tight">Excel Spreadsheet</h3>
                                    {/* <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">Best for analysis</p> */}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
