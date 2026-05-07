"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header/Header';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import { 
    FileText, CheckCircle, Clock, X, ExternalLink, 
    Search, Filter, Loader2, User, Calendar
} from 'lucide-react';

const MedicalDocsPage = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [codeSearch, setCodeSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            // We want leaves that have been submitted OR have a legacy document URL
            const res = await axios.get(`${API_PORT}/leave`);
            const docsOnly = res.data.filter(leave => leave.documentUrl || leave.isMedicalSubmitted);
            setLeaves(docsOnly);
        } catch (err) {
            console.error("Error fetching leaves:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.patch(`${API_PORT}/leave/${id}`, {
                documented: true
            });
            alert("Document approved successfully!");
            fetchLeaves();
        } catch (err) {
            console.error("Error approving document:", err);
            alert("Failed to approve document.");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const filteredLeaves = leaves.filter(leave => {
        const studentName = leave.studentId?.["FULL NAME"] || "";
        const adNo = String(leave.studentId?.ADNO || "");
        const medCode = leave.medicalCode || "";
        
        const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             adNo.includes(searchTerm);
        
        const matchesCode = medCode.toLowerCase().includes(codeSearch.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || 
                             (filterStatus === 'approved' && leave.documented) || 
                             (filterStatus === 'pending' && !leave.documented);
        
        return matchesSearch && matchesCode && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            
            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <FileText size={24} />
                            </div>
                            Medical Verification
                        </h1>
                        <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">
                            Review and approve student medical documentation
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
                        <div className="flex flex-col sm:flex-row bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64 border-b sm:border-b-0 sm:border-r border-slate-100">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search student..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none"
                                />
                            </div>
                            <div className="relative flex-1 sm:w-48">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Medical Code..." 
                                    value={codeSearch}
                                    onChange={(e) => setCodeSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 text-sm font-black text-blue-600 uppercase tracking-widest focus:outline-none placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal"
                                />
                            </div>
                        </div>

                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full lg:w-auto px-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                        >
                            <option value="all">All Documents</option>
                            <option value="pending">Pending Approval</option>
                            <option value="approved">Approved Docs</option>
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading documents...</p>
                        </div>
                    ) : filteredLeaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Info</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Details</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLeaves.map((leave) => (
                                        <tr key={leave._id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all font-black text-sm shadow-inner">
                                                        {leave.studentId?.["FULL NAME"]?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 uppercase italic leading-none mb-1">
                                                            {leave.studentId?.["FULL NAME"]}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                AD: {leave.studentId?.ADNO} • CLASS: {leave.studentId?.CLASS}
                                                            </p>
                                                            {leave.medicalCode && (
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase">
                                                                    CODE: {leave.medicalCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-700 italic line-clamp-1">"{leave.reason}"</p>
                                                    <div className="flex flex-col gap-1 text-[9px] font-black uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Calendar size={10} className="text-slate-300" /> 
                                                            <span className="text-slate-500">From:</span> {leave.fromDate} {leave.fromTime}
                                                        </div>
                                                        {/* <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Calendar size={10} className="text-slate-300" /> 
                                                            <span className="text-slate-500">To:</span> {leave.toDate} {leave.toTime}
                                                        </div> */}
                                                        {leave.returnedAt && (
                                                            <div className="flex items-center gap-1.5 text-blue-500 mt-0.5 pt-0.5 border-t border-slate-100">
                                                                <Clock size={10} /> 
                                                                <span>Returned:</span> {formatDateTime(leave.returnedAt)}       
                                                            </div>
                                                        )}
                                                        {!leave.returnedAt && (
                                                            <div className="flex items-center gap-1.5 text-amber-500 mt-0.5 pt-0.5 border-t border-slate-100">
                                                                <Clock size={10} /> 
                                                                <span>Not Returned</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {leave.documentUrl ? (
                                                    <a 
                                                        href={leave.documentUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <ExternalLink size={14} /> View Doc
                                                    </a>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase italic">No Doc Uploaded</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm inline-flex items-center gap-1.5
                                                    ${leave.documented ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'}`}>
                                                    {leave.documented ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                    {leave.documented ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {!leave.documented ? (
                                                    <button 
                                                        onClick={() => handleApprove(leave._id)}
                                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-slate-200"
                                                    >
                                                        Approve
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center justify-end gap-2 px-4">
                                                        Approved <CheckCircle size={14} />
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                                <FileText size={48} />
                            </div>
                            <h3 className="text-lg font-black text-slate-400 uppercase italic">No documents found</h3>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2 max-w-xs mx-auto">
                                No student has uploaded any medical documentation matching your criteria.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MedicalDocsPage;
