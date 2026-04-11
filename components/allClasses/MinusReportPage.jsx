"use client";

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { API_PORT } from '../../Constants'
import { Calendar, FileSignature, Download, FileText, Filter, ChevronRight, Trash2 } from 'lucide-react'
import ConfirmationModal from '../common/ConfirmationModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
};

function MinusReportPage() {
    const [minusList, setMinusList] = useState([])
    const [load, setLoad] = useState(false) 
    
    // Date Range State
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default last 30 days
        return d.toISOString().split('T')[0];
    });
    const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        isDangerous: false,
        action: null,
        leaveData: null,
        isLoading: false
    });

    useEffect(() => {
        fetchMinus();
    }, [fromDate, toDate]);

    const fetchMinus = async () => {
        setLoad(true)
        try {
            const res = await axios.get(`${API_PORT}/minus?fromDate=${fromDate}&toDate=${toDate}`);
            setMinusList(res.data)
        } catch (err) {
            console.log(err);
        } finally {
            setLoad(false)
        }
    };

    const handleDownloadExcel = () => {
        const wsData = minusList.map(item => ({
            "Admission No": item.studentId?.ADNO || item.ad,
            "Student Name": item.studentId?.['SHORT NAME'] || item.studentId?.['FULL NAME'] || item.name,
            "Class": item.studentId?.CLASS || item.classNum,
            "Reason": item.reason,
            "Teacher": item.teacherId?.name || item.teacher,
            "Minus Count": parseFloat(item.minusNum).toFixed(2),
            "Date": new Date(item.createdAt).toLocaleDateString('en-GB'),
            "Time": new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Minus Report");
        XLSX.writeFile(wb, `Minus_Report_${fromDate}_to_${toDate}.xlsx`);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Minus Points Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${fromDate} to ${toDate}`, 14, 28);
        doc.text(`Total Records: ${minusList.length}`, 14, 34);

        const tableData = minusList.map((item, idx) => [
            idx + 1,
            item.studentId?.ADNO || item.ad,
            item.studentId?.['SHORT NAME'] || item.studentId?.['FULL NAME'] || item.name,
            item.studentId?.CLASS || item.classNum,
            item.reason,
            item.teacherId?.name || item.teacher,
            parseFloat(item.minusNum).toFixed(2),
            new Date(item.createdAt).toLocaleDateString('en-GB')
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['#', 'ADNO', 'Student Name', 'Class', 'Reason', 'Teacher', 'Minus', 'Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22], textColor: 255 },
            styles: { fontSize: 8 },
        });

        doc.save(`Minus_Report_${fromDate}_to_${toDate}.pdf`);
    };

    const removeMinus = async (id) => {
        setConfirmationModal(prev => ({ ...prev, isLoading: true }));
        try {
            await axios.delete(`${API_PORT}/minus/${id}`);
            setMinusList(prev => prev.filter(item => item._id !== id));
            setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err) {
            console.log(err);
            setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        }
    }

    return (
        <div className='min-h-screen bg-[#f8fafc] mt-16 p-4 sm:p-8 space-y-6 font-sans text-slate-800'>
            
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 flex items-center justify-center rounded-2xl shadow-inner uppercase font-black">
                        <Filter size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Minus Report</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Historical ledger
                        </p>
                    </div>
                </div>

                {/* Date Selection - One line on mobile */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 w-full md:w-auto overflow-hidden">
                    <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-50 focus-within:border-orange-400 focus-within:bg-white transition-all">
                        <span className="text-[9px] font-black text-slate-400 uppercase">From</span>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full min-w-[100px]"
                        />
                    </div>
                    <div className="flex-1 md:flex-none flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-50 focus-within:border-orange-400 focus-within:bg-white transition-all">
                        <span className="text-[9px] font-black text-slate-400 uppercase">To</span>
                        <input 
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full min-w-[100px]"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
                <button 
                    onClick={handleDownloadExcel}
                    disabled={load || minusList.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all border border-emerald-100 disabled:opacity-50"
                >
                    <Download size={16} /> Excel Report
                </button>
                <button 
                    onClick={handleDownloadPDF}
                    disabled={load || minusList.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all border border-sky-100 disabled:opacity-50"
                >
                    <FileText size={16} /> PDF Report
                </button>
            </div>

            {/* Simplified Card Design */}
            <div className="max-w-7xl mx-auto space-y-4">
                {minusList.map((item) => (
                    <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        <div className="h-1 bg-orange-500 w-full"></div>
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black">
                                        {item.studentId?.ADNO || item.ad}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight uppercase tracking-tight">
                                            {item.studentId?.['SHORT NAME'] || item.studentId?.['FULL NAME'] || item.name}
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            Class {item.studentId?.CLASS || item.classNum}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfirmationModal({
                                        isOpen: true,
                                        title: 'Confirm Removal',
                                        message: 'Are you sure you want to remove this minus entry?',
                                        confirmText: 'Remove',
                                        isDangerous: true,
                                        action: () => removeMinus(item._id),
                                        isLoading: false
                                    })}
                                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4 items-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">
                                    <Calendar size={12} strokeWidth={3} /> {formatDate(item.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-sky-100">
                                    <FileSignature size={12} strokeWidth={3} /> {item.teacherId?.name || item.teacher || 'Unknown'}
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[11px] font-medium italic border border-slate-100 max-w-full truncate">
                                    {item.reason || 'No reason specified'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {confirmationModal.isOpen && (
                <ConfirmationModal 
                    isOpen={confirmationModal.isOpen}
                    onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmationModal.action}
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                    confirmText={confirmationModal.confirmText}
                    isDangerous={confirmationModal.isDangerous}
                    isLoading={confirmationModal.isLoading}
                />
            )}
        </div>
    )
}

export default MinusReportPage
