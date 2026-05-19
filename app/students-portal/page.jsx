"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, CheckCircle, Clock, Calendar, CalendarClock, TrendingUp, LogOut, Info, AlertTriangle, FileText, User, ChevronRight, LayoutGrid, PlusCircle, MessageSquare, Upload, Loader2, Send, Trophy, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '@/Constants';
import StudentAuthGuard from '@/components/auth/StudentAuthGuard';
import VerifyingAccess from '@/components/auth/VerifyingAccess';
import StudentPortalSkeleton from '@/components/auth/StudentPortalSkeleton';

const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTimeTo12h = (timeStr) => {
    if (!timeStr) return '—';
    try {
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours);
        const m = minutes || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
};

const formatDate = (dateString, monthOnly = false) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (monthOnly) return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    return d.toLocaleDateString('en-GB');
};

const getDetailedStatus = (item) => {
    if (item.status === 'rejected') return 'Rejected';f
    if (item.approved === false) return 'Approval Pending';
    const now = new Date();
    const fromDateTime = new Date(`${item.fromDate}T${item.fromTime}`);
    const toDateTime = item.toDate && item.toTime ? new Date(`${item.toDate}T${item.toTime}`) : null;

    if (item.status === 'returned') {
        if (toDateTime && item.returnedAt && new Date(item.returnedAt) > toDateTime) {
            return 'Late Returned';
        }
        return 'Returned';
    }

    const dbStatus = (item.status || '').toLowerCase();
    if (dbStatus === 'active' || dbStatus === 'late' || dbStatus === 'on leave') {
        if (dbStatus === 'late' || (toDateTime && now > toDateTime)) return 'Late';
        return 'On Leave';
    }

    if (now < fromDateTime) return 'Scheduled';

    return 'Pending';
};

const calculateLeaveDays = (leave, offDays) => {
    const studentClass = leave.studentId?.CLASS || leave.classNum;
    const start = new Date(`${leave.fromDate}T${leave.fromTime}`);
    const end = new Date(leave.returnedAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let count = 0;
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (current <= endDay) {
        const dateStr = current.toISOString().split('T')[0];
        const isOffDay = offDays.some(d => {
            const inRange = d.toDate 
                ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                : (dateStr === d.fromDate);
            return inRange && (d.type === 'global' || (d.classes && d.classes.includes(String(studentClass))));
        });

        if (current.getDay() !== 5 && !isOffDay) { // Skip Fridays and Off Days
            const dayStart = new Date(current);
            dayStart.setHours(7, 30, 0, 0); // 7:30 AM
            const dayEnd = new Date(current);
            dayEnd.setHours(16, 0, 0, 0);  // 4:00 PM
            const overlapStart = start > dayStart ? start : dayStart;
            const overlapEnd = end < dayEnd ? end : dayEnd;
            if (overlapStart < overlapEnd) count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

const getRecoveryInfo = (leave, offDays) => {
    if ((leave.status !== 'returned' && !leave.returnedAt) || leave.recovery === true || leave.recoveryNeeded === false) return null;
    
    const leaveDays = calculateLeaveDays(leave, offDays);
    if (leaveDays === 0) return null;

    const graceDays = leaveDays * 2;
    
    // Helper to calculate deadline by adding working days
    const calculateDeadline = (startDate, workingDays) => {
        let current = new Date(startDate);
        let addedDays = 0;
        while (addedDays < workingDays) {
            current.setDate(current.getDate() + 1);
            const dateStr = current.toISOString().split('T')[0];
            const isOffDay = offDays.some(d => {
                const inRange = d.toDate 
                    ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                    : (dateStr === d.fromDate);
                return inRange && (d.type === 'global' || (d.classes && d.classes.includes(String(studentClass))));
            });
            if (current.getDay() !== 5 && !isOffDay) addedDays++;
        }
        return current;
    };

    const deadline = calculateDeadline(new Date(leave.returnedAt), graceDays);
    const today = new Date();
    
    if (today > deadline) return { status: 'Overdue', deadline };
    
    // Calculate remaining WORKING days for the badge
    let remaining = 0;
    let temp = new Date(today);
    while (temp < deadline) {
        temp.setDate(temp.getDate() + 1);
        const dateStr = temp.toISOString().split('T')[0];
        const isOffDay = offDays.some(d => {
            const inRange = d.toDate 
                ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                : (dateStr === d.fromDate);
            return inRange && (d.type === 'global' || (d.classes && d.classes.includes(String(studentClass))));
        });
        if (temp.getDay() !== 5 && !isOffDay) remaining++;
    }

    return { status: 'Ongoing', remaining: remaining + 1, deadline };
};

/**
 * Attendance Breakdown Modal
 */
const AttendanceModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    const breakdown = useMemo(() => {
        const categories = {
            'NIGHT': { present: 0, total: 0 },
            'PERIOD': { present: 0, total: 0 },
            'NOON': { present: 0, total: 0 },
            'MORNING': { present: 0, total: 0 },
            'JAMATH': { present: 0, total: 0 },
            'OTHERS': { present: 0, total: 0 }
        };

        data.forEach(log => {
            const timeStr = (log.time || '').toUpperCase();
            let cat = 'OTHERS';
            if (timeStr.includes('NIGHT')) cat = 'NIGHT';
            else if (timeStr.includes('PERIOD')) cat = 'PERIOD';
            else if (timeStr.includes('NOON')) cat = 'NOON';
            else if (timeStr.includes('MORNING')) cat = 'MORNING';
            else if (timeStr.includes('JAMATH')) cat = 'JAMATH';

            categories[cat].total++;
            if (log.status === 'Present') categories[cat].present++;
        });

        return categories;
    }, [data]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-600 text-white">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase italic italic">Attendance Health</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Category-wise breakdown</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-4">
                    {Object.entries(breakdown).filter(([_, val]) => val.total > 0).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <LayoutGrid size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-700 text-sm uppercase tracking-tight">{key}</h4>
                                    <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(val.present / val.total) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-slate-800">{val.present}<span className="text-slate-300 mx-1">/</span>{val.total}</div>
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Present Rate</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                   <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all">Close Analytics</button>
                </div>
            </div>
        </div>
    );
};

/**
 * Short History Modal for Metric Cards
 */
const HistoryModal = ({ isOpen, onClose, title, data, type, color, onZehnuthClick }) => {
    if (!isOpen) return null;

    const colorClasses = {
        blue: 'bg-blue-600',
        amber: 'bg-amber-500',
        sky: 'bg-sky-500',
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-600'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className={`p-8 border-b border-slate-50 flex items-center justify-between text-white ${colorClasses[color] || 'bg-slate-800'}`}>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase italic">{title}</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Recent Activity</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {data.length > 0 ? (
                        data.slice(0, 20).map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => type === 'zehnuth' && onZehnuthClick && onZehnuthClick(item)}
                                className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all
                                    ${type === 'zehnuth' ? 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-200' : ''}`}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {type === 'leave' 
                                                ? `${formatDate(item.fromDate)} ${formatTimeTo12h(item.fromTime)}`
                                                : formatDate(item.createdAt || item.date)
                                            }
                                        </span>
                                        {type === 'zehnuth' && item.imageUrl && (
                                            <span className="bg-indigo-100 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                <ImageIcon size={8} /> Proof
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-black text-slate-800 truncate max-w-[200px]">
                                        {type === 'leave' ? item.reason : type === 'cep' ? item.reason : type === 'minus' ? item.reason : type === 'zehnuth' ? item.activity : 'Session Log'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        type === 'minus' ? 'bg-rose-100 text-rose-600' : 
                                        type === 'leave' ? 'bg-amber-100 text-amber-600' :
                                        type === 'zehnuth' ? 'bg-indigo-100 text-indigo-600' :
                                        'bg-sky-100 text-sky-600'
                                    }`}>
                                        {type === 'minus' ? `-${item.minusNum}` : 
                                         type === 'leave' ? getDetailedStatus(item) : 
                                         type === 'zehnuth' ? (
                                            item.status === 'approved' ? `+${item.points}` :
                                            item.status === 'rejected' ? 'Rejected' :
                                            item.mentorApproved ? 'Awaiting Admin' : 'Awaiting Mentor'
                                         ) : 'Issued'}
                                    </span>
                                    {type === 'zehnuth' && !item.imageUrl && item.status === 'pending' && (
                                        <span className="text-[8px] font-black text-indigo-500 uppercase italic">Click to add proof</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center opacity-40">
                            <Info className="mx-auto mb-2" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest">No recent data</p>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all">Close History</button>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subText, color, icon: Icon, onClick }) => (
    <div
        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] shadow-sm transition-all duration-300 hover:shadow-xl cursor-pointer border border-transparent
      ${color === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' :
                color === 'red' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' :
                color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white' :
                color === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white' :
                'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-600 hover:text-white'}`}
        onClick={onClick}
    >
        <div className={`p-3 rounded-2xl mb-4 ${color === 'green' ? 'bg-emerald-100/50' : color === 'red' ? 'bg-rose-100/50' : color === 'amber' ? 'bg-amber-100/50' : color === 'indigo' ? 'bg-indigo-100/50' : 'bg-sky-100/50'} group-hover:bg-white/20`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">{title}</div>
        {subText && <div className="text-[9px] font-bold mt-1 opacity-60 uppercase">{subText}</div>}
    </div>
);

const SelectionButton = ({ label, isSelected, onClick, color = "blue" }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full px-2 py-3 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all border-2 
        ${isSelected 
            ? `bg-${color}-500 text-white border-${color}-500 shadow-lg shadow-${color}-200 scale-95` 
            : 'bg-white text-slate-400 border-slate-50 hover:border-slate-200'}`}
    >
        {label}
    </button>
);

const DatePicker = ({ label, selectedOption, setSelectedOption, customDate, setCustomDate, color = "blue" }) => {
    const options = ['Today', 'Tomorrow', 'Day After', 'Calendar'];
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Calendar size={12} className="text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label} Date</h3>
            </div>
            <div className="grid grid-cols-4 gap-1">
                {options.map(opt => (
                    <SelectionButton 
                        key={opt} 
                        label={opt} 
                        isSelected={selectedOption === opt} 
                        onClick={() => setSelectedOption(opt)} 
                        color={color}
                    />
                ))}
            </div>
            {selectedOption === 'Calendar' && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                        type="date" 
                        value={customDate} 
                        onChange={e => setCustomDate(e.target.value)}
                        className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-${color}-400 focus:bg-white outline-none transition-all`}
                        required
                    />
                </div>
            )}
        </div>
    );
};

const TimePicker = ({ label, selectedOption, setSelectedOption, customTime, setCustomTime, color = "blue", showNow = false }) => {
    const options = ['Morning', 'Evening', ...(showNow ? ['Now'] : []), 'Clock'];
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Clock size={12} className="text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label} Time</h3>
            </div>
            <div className="grid grid-cols-4 gap-1">
                {options.map(opt => (
                    <SelectionButton 
                        key={opt} 
                        label={opt} 
                        isSelected={selectedOption === opt} 
                        onClick={() => setSelectedOption(opt)} 
                        color={color}
                    />
                ))}
            </div>
            {selectedOption === 'Clock' && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <input 
                        type="time" 
                        value={customTime} 
                        onChange={e => setCustomTime(e.target.value)}
                        className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-${color}-400 focus:bg-white outline-none transition-all`}
                        required
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Apply Leave Modal
 */
const ApplyLeaveModal = ({ isOpen, onClose, student, onComplete }) => {
    const [loading, setLoading] = useState(false);
    
    // UI States
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedReason, setSelectedReason] = useState('Medical (Home)');
    const [customReason, setCustomReason] = useState('');
    const [disease, setDisease] = useState('');
    const [program, setProgram] = useState('');
    
    // Date & Time States
    const [fromDateOption, setFromDateOption] = useState('Today');
    const [fromTimeOption, setFromTimeOption] = useState('Evening');
    const [fromCustomDate, setFromCustomDate] = useState('');
    const [fromCustomTime, setFromCustomTime] = useState('');

    const [toDateOption, setToDateOption] = useState('Tomorrow');
    const [toTimeOption, setToTimeOption] = useState('Morning');
    const [toCustomDate, setToCustomDate] = useState('');
    const [toCustomTime, setToCustomTime] = useState('');

    const templates = [
        { id: 'today-tmw-morn', label: 'Today 🌇 → Tom 🌅' },
        { id: 'today-tmw-eve', label: 'Today 🌇 → Tom 🌇' },
        { id: 'tmrw-next-morn', label: 'Tom 🌇 → Next 🌅' },
        { id: 'tmrw-dayafter-eve', label: 'Tom 🌇 → Next 🌇' },
        { id: 'thu-fri-eve', label: 'Thurs 🌇 → Friday 🌇' },
    ];

    const reasons = ['Marriage','Function','Medical (Home)', 'Hospital', 'Hospital bi-stander', 'OGEA', 'Custom'];

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        const now = new Date();
        const day = now.getDay();

        switch (templateId) {
            case 'today-tmw-morn':
                setFromDateOption('Today'); setFromTimeOption('Evening');
                setToDateOption('Tomorrow'); setToTimeOption('Morning');
                break;
            case 'today-tmw-eve':
                setFromDateOption('Today'); setFromTimeOption('Evening');
                setToDateOption('Tomorrow'); setToTimeOption('Evening');
                break;
            case 'tmrw-next-morn':
                setFromDateOption('Tomorrow'); setFromTimeOption('Evening');
                setToDateOption('Day After'); setToTimeOption('Morning');
                break;
            case 'tmrw-dayafter-eve':
                setFromDateOption('Tomorrow'); setFromTimeOption('Evening');
                setToDateOption('Day After'); setToTimeOption('Evening');
                break;
            case 'thu-fri-eve': {
                let Thu = new Date(now);
                Thu.setDate(now.getDate() + (4 - day));
                let Fri = new Date(now);
                Fri.setDate(now.getDate() + (5 - day));
                if (day >= 5) {
                    Thu.setDate(Thu.getDate() + 7);
                    Fri.setDate(Fri.getDate() + 7);
                }
                setFromDateOption('Calendar'); setFromCustomDate(Thu.toISOString().split('T')[0]);
                setFromTimeOption('Evening');
                setToDateOption('Calendar'); setToCustomDate(Fri.toISOString().split('T')[0]);
                setToTimeOption('Evening');
                break;
            }
        }
    };

    if (!isOpen) return null;

    const resolveDate = (option, customDate) => {
        const today = new Date().toISOString().split('T')[0];
        const tmrw = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];
        
        if (option === 'Today') return today;
        if (option === 'Tomorrow') return tmrw;
        if (option === 'Day After') return dayAfter;
        return customDate;
    };

    const resolveTime = (option, customTime, isFrom = true) => {
        if (option === 'Morning') return isFrom ? '16:30' : '07:00';
        if (option === 'Evening') return isFrom ? '16:30' : '18:00';
        if (option === 'Now') return new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 5);
        return customTime;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let finalReason = selectedReason === 'Custom' ? customReason : selectedReason;
        if ((selectedReason?.includes('Medical') || selectedReason === 'Hospital' || selectedReason === 'Hospital bi-stander') && disease.trim() !== '') {
            finalReason = `${selectedReason} - ${disease.trim()}`;
        } else if (selectedReason === 'OGEA' && program.trim() !== '') {
            finalReason = `OGEA - ${program.trim()}`;
        }

        if (!finalReason) {
            alert("Please provide a reason.");
            return;
        }

        const finalFromDate = resolveDate(fromDateOption, fromCustomDate);
        const finalFromTime = resolveTime(fromTimeOption, fromCustomTime, true);
        const finalToDate = resolveDate(toDateOption, toCustomDate);
        const finalToTime = resolveTime(toTimeOption, toCustomTime, false);

        if (!finalFromDate || !finalToDate) {
            alert("Please select both from and to dates.");
            return;
        }

        setLoading(true);
        try {
            const teachersRes = await axios.get(`${API_PORT}/teachers`);
            const teachers = teachersRes.data;
            
            let responsibleTeacherId = null;
            const classNum = Number(student.CLASS);

            if (classNum >= 8 && classNum <= 10) {
                responsibleTeacherId = teachers.find(t => t.role?.includes("HOD"))?._id;
            } else if (classNum >= 5 && classNum <= 7) {
                responsibleTeacherId = teachers.find(t => t.role?.includes("HOS"))?._id;
            } else if (classNum >= 1 && classNum <= 4) {
                responsibleTeacherId = teachers.find(t => Number(t.classNum) === classNum)?._id;
            }

            if (!responsibleTeacherId) {
                alert("No responsible teacher found for your class. Please contact administration.");
                return;
            }

            await axios.post(`${API_PORT}/leave`, {
                studentId: student.id || student._id,
                fromDate: finalFromDate,
                fromTime: finalFromTime,
                toDate: finalToDate,
                toTime: finalToTime,
                reason: finalReason,
                status: 'pending',
                approved: false,
                teacherId: responsibleTeacherId
            });
            onComplete();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to submit leave request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 lg:items-start lg:pt-4 ">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                <div className="p-8 bg-amber-500 text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Calendar size={28} /> Apply Leave 
                        </h2>
                        <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1 ml-10">Request permission for leave</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/20 rounded-2xl transition-all relative z-10"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Reason Selection */} 
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Reason</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {reasons.map(r => (
                                <SelectionButton  
                                    key={r} 
                                    label={r} 
                                    isSelected={selectedReason === r} 
                                    onClick={() => setSelectedReason(r)}
                                    color="amber"
                                />
                            ))}
                        </div>
                        {selectedReason === 'Custom' && (
                            <input 
                                type="text" 
                                placeholder="Type your custom reason here..." 
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all animate-in slide-in-from-top-2"
                                required
                            />
                        )}
                        {(selectedReason?.includes('Medical') || selectedReason === 'Hospital' || selectedReason === 'Hospital bi-stander') && (
                            <input 
                                type="text" 
                                placeholder="Specify disease / condition..." 
                                value={disease}
                                onChange={e => setDisease(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all animate-in slide-in-from-top-2"
                            />
                        )}
                        {selectedReason === 'OGEA' && (
                            <input 
                                type="text" 
                                placeholder="Specify which program..." 
                                value={program}
                                onChange={e => setProgram(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all animate-in slide-in-from-top-2"
                            />
                        )}
                    </div>

                    {/* Quick Templates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Templates</h3>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {templates.map(t => (
                                <SelectionButton 
                                    key={t.id} 
                                    label={t.label} 
                                    isSelected={selectedTemplate === t.id} 
                                    onClick={() => handleTemplateSelect(t.id)}
                                    color="blue"
                                />
                            ))}
                        </div>
                    </div>

                    {/* From Date & Time */}
                    <div className="p-6 bg-sky-50/50 rounded-[2.5rem] border border-sky-100/50 space-y-6">
                        <div className="flex items-center gap-3 px-1 text-sky-600">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase italic tracking-wider">From Date & Time</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DatePicker 
                                label="From"
                                selectedOption={fromDateOption}
                                setSelectedOption={(opt) => { setFromDateOption(opt); setSelectedTemplate(null); }}
                                customDate={fromCustomDate}
                                setCustomDate={setFromCustomDate}
                                color="sky"
                            />
                            <TimePicker 
                                label="From"
                                selectedOption={fromTimeOption}
                                setSelectedOption={(opt) => { setFromTimeOption(opt); setSelectedTemplate(null); }}
                                customTime={fromCustomTime}
                                setCustomTime={setFromCustomTime}
                                color="sky"
                                showNow={true}
                            />
                        </div>
                    </div>

                    {/* To Date & Time */}
                    <div className="p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-100/50 space-y-6">
                        <div className="flex items-center gap-3 px-1 text-amber-600">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <CalendarClock size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase italic tracking-wider">To Date & Time</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DatePicker 
                                label="To"
                                selectedOption={toDateOption}
                                setSelectedOption={(opt) => { setToDateOption(opt); setSelectedTemplate(null); }}
                                customDate={toCustomDate}
                                setCustomDate={setToCustomDate}
                                color="amber"
                            />
                            <TimePicker 
                                label="To"
                                selectedOption={toTimeOption}
                                setSelectedOption={(opt) => { setToTimeOption(opt); setSelectedTemplate(null); }}
                                customTime={toCustomTime}
                                setCustomTime={setToCustomTime}
                                color="amber"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] hover:bg-amber-500 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            {loading ? 'Submitting...' : 'Send Request'}
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic">
                            Your leave request will be sent to your class teacher or HOD for approval
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * Complaint Modal
 */
const ComplaintModal = ({ isOpen, onClose, attendance, studentId, records = [], onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [actualStatus, setActualStatus] = useState('Present');
    const [message, setMessage] = useState('');
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (attendance) {
                setSelectedId(attendance._id);
            } else {
                setSelectedId('');
            }
            setMessage('');
            setActualStatus('Present');
        }
    }, [isOpen, attendance]);

    if (!isOpen) return null;

    const currentAttendance = attendance || records.find(r => r._id === selectedId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!currentAttendance) {
                alert("Please select a record to dispute.");
                return;
            }
            await axios.post(`${API_PORT}/complaints`, {
                studentId,
                attendanceId: currentAttendance._id,
                teacherId: currentAttendance.teacherId?._id || currentAttendance.teacherId,
                actualStatus,
                message
            });
            alert("Complaint submitted successfully.");
            if (onComplete) onComplete();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to submit complaint.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-rose-500 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase italic">Raise Complaint</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Dispute attendance record</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {!attendance ? (
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Record to Dispute</label>
                            <select 
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-rose-400 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Choose an absent session...</option>
                                {records.filter(r => r.status !== 'Present').map(r => (
                                    <option key={r._id} value={r._id}>
                                        {formatDate(r.createdAt, false)} - {r.attendanceTime || 'General'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(currentAttendance.createdAt)}</p>
                                <p className="text-sm font-black text-slate-800">{currentAttendance.attendanceTime || 'General'}</p>
                            </div>
                            <span className="text-rose-500 font-black text-xs uppercase px-2 py-1 bg-white rounded-lg border border-rose-100 italic">MARKED ABSENT</span>
                        </div>
                    )}

                    <div className="space-y-1 p-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">I was actually...</label>
                        <div className="flex gap-2 mt-2">
                            {['Present', 'Leave', 'CEP'].map(s => (
                                <button key={s} onClick={() => setActualStatus(s)} className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${actualStatus === s ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Remarks (Optional)</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Explain why the data might be wrong..." className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-rose-400 outline-none transition-all h-24 resize-none" />
                    </div>

                    <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-95 transition-all shadow-xl shadow-rose-200">
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                        Submit Dispute
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Document Modal
 */
const DocumentModal = ({ isOpen, onClose, leave, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen || !leave) return null;

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'leave_docs'); 

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dfetresky/image/upload',
                formData
            );
            setFileUrl(res.data.secure_url);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload file. Please ensure you have a valid internet connection.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Generate a unique 5-letter code
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        setLoading(true);
        try {
            await axios.patch(`${API_PORT}/leave/${leave._id}`, {
                documented: false, // Remains false until admin approves
                documentUrl: fileUrl || null,
                medicalCode: code,
                isMedicalSubmitted: true
            });
            onUpdate(code);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to submit documentation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase italic">Document Leave</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Attach medical documents (Optional)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Leave Reason</p>
                        <p className="text-sm font-black text-blue-800 italic">"{leave.reason}"</p>
                        <p className="text-[10px] font-bold text-blue-400 mt-2 uppercase">{leave.fromDate} → {leave.toDate || 'End of Day'}</p>
                    </div>

                    <div className="space-y-4">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleUpload} 
                            className="hidden" 
                            accept="image/*,.pdf"
                        />
                        
                        {!fileUrl || uploading ? (
                            <div 
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={`w-full h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group
                                    ${uploading ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'}`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Uploading document...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                            Click to select <br /> medical documents
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">(Optional)</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative group rounded-[2rem] overflow-hidden border-2 border-emerald-400 shadow-xl bg-slate-50 animate-in zoom-in duration-300">
                                {fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                    <img src={fileUrl} alt="Preview" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-48 flex flex-col items-center justify-center gap-3">
                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                            <FileText size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF Document Attachment</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-white rounded-2xl text-blue-600 hover:scale-110 transition-all shadow-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                                        <LayoutGrid size={18} /> View
                                    </a>
                                    <button onClick={() => setFileUrl('')} className="p-4 bg-white rounded-2xl text-rose-600 hover:scale-110 transition-all shadow-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                                        <X size={18} /> Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        {fileUrl && !uploading && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden animate-in slide-in-from-top-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                    <CheckCircle size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Ready to Save</p>
                                    <p className="text-[10px] font-bold text-slate-600 truncate">{fileUrl.split('/').pop()}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleSubmit} 
                        disabled={loading || uploading} 
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl
                            ${loading || uploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Confirm Submission
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Zehnuth Evidence Modal
 */
const ZehnuthEvidenceModal = ({ isOpen, onClose, request, onUpdate }) => {
    const [uploading, setUploading] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && request) {
            setFileUrl(request.imageUrl || '');
        }
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'leave_docs');

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dfetresky/image/upload',
                formData
            );
            const imageUrl = res.data.secure_url;
            
            // Update on server
            await axios.put('/api/zehnuth/points', { id: request._id, imageUrl });
            
            setFileUrl(imageUrl);
            if (onUpdate) onUpdate();
            alert("Proof uploaded successfully.");
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload proof. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                            <Trophy size={20} /> Achievement Proof
                        </h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{request.activity}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Activity</p>
                                <p className="text-sm font-black text-slate-800 uppercase italic">{request.activity}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${request.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {request.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleUpload} 
                            className="hidden" 
                            accept="image/*"
                        />
                        
                        {fileUrl ? (
                            <div className="relative group rounded-[2rem] overflow-hidden border-2 border-indigo-100 shadow-xl bg-slate-50">
                                <img src={fileUrl} alt="Proof" className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white rounded-2xl text-indigo-600 shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                                        <LayoutGrid size={16} /> View Full Size
                                    </a>
                                    {request.status === 'pending' && !request.mentorApproved && (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            <Upload size={16} /> Replace Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                className={`w-full h-64 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer group
                                    ${uploading ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'}`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-3" />
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Uploading proof...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <Upload size={28} />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] leading-relaxed">
                                            Click to upload <br /> achievement evidence
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-3 italic">Max size: 5MB • JPG, PNG</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 active:scale-95 transition-all shadow-xl"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ isOpen, onClose, code }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 text-center p-10">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight mb-2">Submitted!</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Medical documentation processed</p>
                
                <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Verification Code</p>
                    <div className="text-4xl font-black text-blue-600 tracking-widest font-mono group-hover:scale-110 transition-transform duration-300">
                        {code}
                    </div>
                </div>
                
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    Please write down this code on your medical document paper.
                </p>
                
                <button 
                    onClick={onClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                    Got it, Close
                </button>
            </div>
        </div>
    );
};

/**
 * Apply Zehnuth Modal
 */
const ApplyZehnuthModal = ({ isOpen, onClose, student, mentor, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Exam');
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [remarks, setRemarks] = useState('');

    const CATEGORIES = [
        { id: 'Exam', label: 'Exam', icon: '🎓' },
        { id: 'Writings', label: 'Writings', icon: '✍️' },
        { id: 'Presentation', label: 'Presentations', icon: '🎤' },
        { id: 'Achievements', label: 'Achievements', icon: '🏆' },
        { id: 'Competitions', label: 'Competitions', icon: '🏅' },
        { id: 'Mentor', label: 'Mentor', icon: '🤝' },
    ];

    const toggleAchievement = (item) => {
        setSelectedAchievement(prev => prev === item ? null : item);
    };

    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'leave_docs'); 

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dfetresky/image/upload',
                formData
            );
            setFileUrl(res.data.secure_url);
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAchievement) {
            alert("Please select an achievement.");
            return;
        }

        if (!mentor) {
            alert("No mentor assigned to you yet. Please contact your HOD or admin.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_PORT}/zehnuth/points`, {
                studentId: student.id || student._id,
                mentorId: mentor._id || mentor.id,
                activity: selectedAchievement,
                category: selectedCategory,
                points: 0,
                approved: false,
                mentorApproved: false,
                status: 'pending',
                imageUrl: fileUrl || null,
                remarks: remarks || null
            });
            onComplete();
            onClose();
            setSelectedAchievement(null);
            setFileUrl('');
            setRemarks('');
        } catch (err) {
            console.error(err);
            alert("Failed to submit achievement request.");
        } finally {
            setLoading(false);
        }
    };

    const Badge = ({ children, color }) => {
        const colors = {
            teal: 'bg-emerald-50 text-emerald-700',
            blue: 'bg-blue-50 text-blue-700',
            amber: 'bg-amber-50 text-amber-700',
            purple: 'bg-purple-50 text-purple-700',
            coral: 'bg-orange-50 text-orange-700'
        };
        return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[color] || colors.blue}`}>{children}</span>;
    };

    const Card = ({ label }) => (
        <button
            type="button"
            onClick={() => toggleAchievement(label)}
            className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group w-full
                ${selectedAchievement === label 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-100 text-slate-800 hover:border-indigo-200'}`}
        >
            <p className={`text-[10px] font-black uppercase tracking-widest ${selectedAchievement === label ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</p>
            {selectedAchievement === label && (
                <div className="absolute top-2 right-2 text-white">
                    <CheckCircle size={14} />
                </div>
            )}
        </button>
    );

    const Row = ({ label, condition, badgeColor }) => (
        <tr 
            onClick={() => toggleAchievement(label)}
            className={`group cursor-pointer transition-all ${selectedAchievement === label ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
        >
            <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all
                        ${selectedAchievement === label ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                        {selectedAchievement === label && <CheckCircle size={12} />}
                    </div>
                    <span className="font-bold text-slate-700">{label}</span>
                </div>
            </td>
            <td className="py-3 px-2"><Badge color={badgeColor}>{condition}</Badge></td>
        </tr>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100 flex flex-col h-[85vh]">
                <div className="p-6 bg-indigo-600 text-white flex items-center justify-between relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                            <Trophy size={24} /> Zehnuth Point
                        </h2>
                        <p className="text-[9px] font-bold opacity-90 uppercase tracking-widest mt-1">Select your achievement</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-2xl transition-all relative z-10"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 px-1">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setSelectedAchievement(null); // Reset selection on category change
                                    }}
                                    className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0
                                        ${selectedCategory === cat.id 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 min-h-[300px]">
                        {selectedCategory === 'Exam' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                    <Card label="1st Rank" />
                                    <Card label="2nd Rank" />
                                    <Card label="3rd Rank" />
                                </div>
                                <table className="w-full text-[13px]">
                                    <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Criteria</th><th className="pb-2 text-left px-2">Condition</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="High score bonus (90%)" condition="Above 90%" badgeColor="teal" />
                                        <Row label="High score bonus (95%)" condition="Above 95%" badgeColor="blue" />
                                        <Row label="Improvement bonus" condition="Performance increase" badgeColor="amber" />
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'Writings' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Full-length works</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Essay', 'Story', 'Poem', 'Translation', 'Feature'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Short works</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Short story', 'Short poem', 'Travelogue'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Brief writings</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Note', 'Response', 'Letter', 'Drawing', 'Cartoon'].map(item => (
                                            <Card key={item} label={item} />
                                        ))}
                                    </div>
                                </div>
                                <table className="w-full text-[13px] border-t border-slate-100 pt-4">
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="Class magazine" condition="Published in secondary class magazine" badgeColor="coral" />
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedCategory === 'Presentation' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Out of campus</p>
                                    <table className="w-full text-[13px]">
                                        <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Type</th><th className="pb-2 text-left px-2">Level</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="Paper presentation (State)" condition="State" badgeColor="teal" />
                                            <Row label="Paper presentation (National)" condition="National" badgeColor="blue" />
                                            <Row label="Paper presentation (International)" condition="International" badgeColor="purple" />
                                            <Row label="Keynote address" condition="Guest Speaker" badgeColor="blue" />
                                            <Row label="Khutba" condition="Public Address" badgeColor="teal" />
                                            <Row label="Other presentations (Out)" condition="External" badgeColor="amber" />
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Inside campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="Speech" condition="Campus Event" badgeColor="blue" />
                                            <Row label="Other presentations (In)" condition="Campus internal" badgeColor="teal" />
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Achievements' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <Card label="Courses" />
                                    <Card label="Innovations" />
                                    <Card label="Awards" />
                                    <Card label="Publications" />
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Competitions' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Out of campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="1st Place (Out)" condition="Out of Campus" badgeColor="amber" />
                                            <Row label="2nd Place (Out)" condition="Out of Campus" badgeColor="teal" />
                                            <Row label="3rd Place (Out)" condition="Out of Campus" badgeColor="blue" />
                                            <Row label="Participation (Out)" condition="Out of Campus" badgeColor="purple" />
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Inside campus</p>
                                    <table className="w-full text-[13px]">
                                        <tbody className="divide-y divide-slate-100">
                                            <Row label="1st Place (In)" condition="Inside Campus" badgeColor="amber" />
                                            <Row label="2nd Place (In)" condition="Inside Campus" badgeColor="teal" />
                                            <Row label="3rd Place (In)" condition="Inside Campus" badgeColor="blue" />
                                            <Row label="Participation (In)" condition="Inside Campus" badgeColor="purple" />
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedCategory === 'Mentor' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <table className="w-full text-[13px]">
                                    <thead><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="pb-2 text-left px-2">Activity</th><th className="pb-2 text-left px-2">Details</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <Row label="Language conversation" condition="Min. 20 minutes" badgeColor="teal" />
                                        <Row label="Personal creative work" condition="Poem / Story / Essay / Translation" badgeColor="purple" />
                                        <Row label="Active student bonus" condition="Lesson plans listed" badgeColor="amber" />
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence / Proof</h3>
                            </div>
                            <div className="px-1">
                                {fileUrl ? (
                                    <div className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                                        <img src={fileUrl} alt="Evidence" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = handleUpload;
                                                    input.click();
                                                }}
                                                className="p-2 bg-white text-indigo-600 rounded-xl shadow-lg"
                                            >
                                                <Upload size={18} />
                                            </button>
                                            <button onClick={() => setFileUrl('')} className="p-2 bg-white text-rose-500 rounded-xl shadow-lg">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50 flex flex-col items-center justify-center transition-all hover:bg-slate-50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            className="hidden"
                                            id="zehnuth-upload"
                                        />
                                        <label
                                            htmlFor="zehnuth-upload"
                                            className={`cursor-pointer px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2
                                                ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                                            {uploading ? 'Uploading...' : 'Attach Proof Image (Optional)'}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Achievement</h3>
                            </div>
                            <div className="px-2">
                                {selectedAchievement ? (
                                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl text-[11px] font-black uppercase flex items-center justify-between animate-in slide-in-from-left-2 duration-200">
                                        <span className="flex items-center gap-3"><Trophy size={14} /> {selectedAchievement}</span>
                                        <button onClick={() => setSelectedAchievement(null)} className="hover:text-indigo-900"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <p className="text-[10px] font-bold text-slate-400 italic">No achievement selected. Click an item above to pick one.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Optional)</h3>
                            </div>
                            <div className="px-1">
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any additional context or details here..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 focus:bg-white outline-none transition-all resize-none h-24"
                                />
                            </div>
                        </div>

                        {mentor && (
                            <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Your Mentor</p>
                                    <p className="text-[9px] font-bold text-slate-700 uppercase">Usthad {mentor.name || 'Assigned'}</p>
                                </div>
                            </div>
                        )}
                        
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedAchievement || uploading}
                            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3
                                ${(!selectedAchievement || uploading) ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-600 active:scale-95 shadow-slate-200'}`}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            {loading ? 'Submitting...' : 'Apply for Points'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentsPortal = () => {
    const navigate = useRouter();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveData, setLeaveData] = useState([]);
    const [minusData, setMinusData] = useState([]);
    const [complaintsData, setComplaintsData] = useState([]);
    const [cepData, setCepData] = useState([]);
    const [offDays, setOffDays] = useState([]);

    // Modal states
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showSuccessCode, setShowSuccessCode] = useState(null);
    const [zehnuthPoints, setZehnuthPoints] = useState([]);
    const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
    const [isApplyZehnuthOpen, setIsApplyZehnuthOpen] = useState(false);
    const [mentor, setMentor] = useState(null);
    const [isComplaintOpen, setIsComplaintOpen] = useState(false);
    const [isDocumentOpen, setIsDocumentOpen] = useState(false);
    const [showRecoveryWarning, setShowRecoveryWarning] = useState(false);
    const [isZehnuthEvidenceOpen, setIsZehnuthEvidenceOpen] = useState(false);
    const [selectedZehnuthRequest, setSelectedZehnuthRequest] = useState(null);
    const [historyModal, setHistoryModal] = useState({ isOpen: false, title: '', data: [], type: '', color: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            navigate.push('/students-login');
            return;
        }

        try {
            const res = await axios.get(`${API_PORT}/students/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profileData = res.data;
            setStudent(profileData);
            await fetchStudentAnalytics(profileData.ADNO, profileData);
            await fetchMentorInfo(profileData._id || profileData.id);
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                navigate.push('/students-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMentorInfo = async (sid) => {
        try {
            const res = await axios.get(`${API_PORT}/zehnuth/mentor-mentee?studentId=${sid}`);
            if (res.data && res.data.length > 0) {
                setMentor(res.data[0].mentorId);
            }
        } catch (err) {
            console.error("Error fetching mentor info:", err);
        }
    };

    const fetchStudentAnalytics = async (ad, studentObj) => {
        if (!ad) return;
        try {
            // Use Promise.allSettled to be more resilient
            const results = await Promise.allSettled([
                axios.get(`${API_PORT}/set-attendance?ad=${ad}`),
                axios.get(`${API_PORT}/leave?ad=${ad}`),
                axios.get(`${API_PORT}/minus?ad=${ad}`),
                axios.get(`${API_PORT}/class-excused-pass?ad=${ad}`),
                axios.get(`${API_PORT}/off-days`),
                axios.get(`${API_PORT}/zehnuth/points?studentId=${studentObj?._id || studentObj?.id || student?._id || student?.id}`)
            ]);

            if (results[0].status === 'fulfilled') setAttendanceData(results[0].value.data || []);
            if (results[1].status === 'fulfilled') setLeaveData(results[1].value.data || []);
            if (results[2].status === 'fulfilled') setMinusData(results[2].value.data || []);
            if (results[3].status === 'fulfilled') setCepData(results[3].value.data || []);
            if (results[4].status === 'fulfilled') setOffDays(results[4].value.data || []);
            if (results[5].status === 'fulfilled') setZehnuthPoints(results[5].value.data || []);

            // Then fetch complaints separately to prevent breaking the flow
            const sid = studentObj?._id || studentObj?.id || student?._id || student?.id;
            if (sid) {
                try {
                    const complaintsRes = await axios.get(`${API_PORT}/complaints?studentId=${sid}`);
                    setComplaintsData(complaintsRes.data);
                } catch (cErr) {
                    console.error("Error fetching complaints:", cErr);
                }
            }
        } catch (err) {
            console.error("Error fetching analytics:", err);
        }
    };

    const filteredAttendance = useMemo(() => {
        if (!selectedMonth) return attendanceData;
        return attendanceData.filter(log => {
            if (!log.createdAt) return false;
            return log.createdAt.startsWith(selectedMonth);
        });
    }, [attendanceData, selectedMonth]);

    const stats = useMemo(() => {
        const present = attendanceData.filter(a => a.status === 'Present').length;
        const total = attendanceData.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
        const totalMinus = minusData.reduce((acc, curr) => acc + (parseFloat(curr.minusNum) || 0), 0);

        return {
            present,
            absent: total - present,
            total,
            rate,
            leaves: (leaveData || []).length,
            ceps: (cepData || []).length,
            minusPoints: totalMinus.toFixed(1),
            zehnuth: (zehnuthPoints || []).reduce((acc, p) => acc + (p?.points || 0), 0)
        };
    }, [attendanceData, leaveData, minusData, cepData, zehnuthPoints]);

    const handleLogout = () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        window.dispatchEvent(new Event('storage'));
        navigate.push('/students-login');
    };

    if (loading) return (
        <StudentAuthGuard>
            <VerifyingAccess />
        </StudentAuthGuard>
    );

    if (!student) return null;

    return (
        <StudentAuthGuard>
            <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
                <AttendanceModal isOpen={showBreakdown} onClose={() => setShowBreakdown(false)} data={attendanceData} />
                <ApplyLeaveModal 
                    isOpen={isApplyLeaveOpen} 
                    onClose={() => setIsApplyLeaveOpen(false)} 
                    student={student}
                    onComplete={() => fetchStudentAnalytics(student.ADNO)}
                />
                <ApplyZehnuthModal
                    isOpen={isApplyZehnuthOpen}
                    onClose={() => setIsApplyZehnuthOpen(false)}
                    student={student}
                    mentor={mentor}
                    onComplete={() => fetchStudentAnalytics(student.ADNO, student)}
                />
                <ComplaintModal 
                    isOpen={isComplaintOpen} 
                    onClose={() => setIsComplaintOpen(false)} 
                    attendance={selectedAttendance}
                    studentId={student._id || student.id}
                    onComplete={() => fetchStudentAnalytics(student.ADNO, student)}
                />

                {/* Header */}
                <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsMenuOpen(true)} className="p-2 lg:hidden text-slate-500 rounded-xl"><Menu className="w-6 h-6" /></button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><TrendingUp size={20} /></div>
                                    <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block italic uppercase">PORTAL</h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end mr-2">
                                    <span className="text-sm font-black text-slate-800 tracking-tight uppercase truncate max-w-[120px] sm:max-w-none">
                                        {student["SHORT NAME"] || student.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">AD: {student.ADNO || student.ad}</span>
                                </div> 
                                <button onClick={handleLogout} className="w-11 h-11 bg-rose-50 border-2 border-white shadow-sm rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><LogOut size={20} /></button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto mt-24">
                    
                    {/* Header Section */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">My Analytics</h1>
                            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-500" /> Live Data Sync Active
                            </p>
                        </div>
                        <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 px-6">
                            <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Class Group</span>
                                <span className="text-sm font-black text-blue-600">{student.CLASS}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-100"></div>
                            <div>
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</span>
                                {(() => {
                                    const activeLeave = leaveData.find(l => {
                                        const status = getDetailedStatus(l);
                                        return status === 'On Leave' || status === 'Late';
                                    });
                                    if (activeLeave) return <span className="text-sm font-black text-rose-600">On Leave</span>;

                                    const pendingRecovery = leaveData.filter(l => getRecoveryInfo(l, offDays) !== null);
                                    if (pendingRecovery.length > 0) {
                                        const overdue = pendingRecovery.some(l => getRecoveryInfo(l, offDays)?.status === 'Overdue');
                                        if (overdue) return <span className="text-sm font-black text-rose-600 animate-pulse">Recovery Overdue</span>;
                                        return <span className="text-sm font-black text-amber-600">Recovery Pending</span>;
                                    }

                                    return <span className="text-sm font-black text-emerald-600">Active</span>;
                                })()}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsApplyZehnuthOpen(true)}
                                className="bg-indigo-600 text-white p-3 pr-6 rounded-[1.5rem] flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap"
                            >
                                <Trophy size={18} /> Apply Zehnuth
                            </button>
                            <button 
                            disabled={true}
                                onClick={() => {
                                    const hasOverdueRecovery = leaveData.some(l => {
                                        if (l.recovery || l.recoveryNeeded === false) return false;
                                        if (!l.returnedAt && l.status !== 'returned') return false;
                                        return getRecoveryInfo(l, offDays)?.status === 'Overdue';
                                    });
                                    if (hasOverdueRecovery) {
                                        setShowRecoveryWarning(true);
                                    } else {
                                        setIsApplyLeaveOpen(true);
                                    }
                                }}
                                className="bg-amber-500 text-white p-3 pr-6 rounded-[1.5rem] flex items-center gap-2 shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all text-xs font-black uppercase tracking-widest whitespace-nowrap"
                            >
                                <PlusCircle size={18} /> Apply Leave
                            </button> 
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
                        <MetricCard title="Attendance" value={`${stats.rate}%`} subText={`${stats.present}/${stats.total} SESSIONS`} color="blue" icon={TrendingUp} onClick={() => setShowBreakdown(true)} />
                        <MetricCard title="Leave Records" value={stats.leaves} subText="TOTAL ENTERED" color="amber" icon={FileText} onClick={() => setHistoryModal({ isOpen: true, title: 'Leave History', data: leaveData, type: 'leave', color: 'amber' })} />
                        <MetricCard title="CEP Passes" value={stats.ceps} subText="EXCUSED PASSES" color="sky" icon={Clock} onClick={() => setHistoryModal({ isOpen: true, title: 'CEP History', data: cepData, type: 'cep', color: 'sky' })} />
                        <MetricCard 
                            title="ZEHNUTH" 
                            value={stats.zehnuth} 
                            subText={
                                stats.zehnuth >= 750 ? "LEGENDARY BADGE" :
                                stats.zehnuth >= 500 ? "MASTER BADGE" :
                                stats.zehnuth >= 250 ? "STAR BADGE" :
                                stats.zehnuth >= 100 ? "CHAMPION BADGE" :
                                "TOTAL POINTS"
                            } 
                            color="indigo" 
                            icon={Trophy} 
                            onClick={() => setHistoryModal({ isOpen: true, title: 'Achievement History', data: zehnuthPoints, type: 'zehnuth', color: 'indigo' })} 
                        />
                    </section>

                    {/* Detailed Lists Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Left Column: Recent Items */}
                        <div className="space-y-8">
                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <Clock size={20} className="text-blue-500" /> Attendance Log
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-2xl border border-slate-100">
                                            <Calendar size={14} className="text-slate-400" />
                                            <input 
                                                type="month" 
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="bg-transparent text-[10px] font-black uppercase text-slate-600 focus:outline-none cursor-pointer"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => { 
                                                const target = filteredAttendance.find(r => r._id === selectedLogId);
                                                setSelectedAttendance(target); 
                                                setIsComplaintOpen(true); 
                                            }}
                                            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 
                                                ${selectedLogId ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-rose-50 text-rose-300 border-rose-100 cursor-not-allowed opacity-50'}`}
                                            title={selectedLogId ? "Dispute selected record" : "Select a record below first"}
                                        >
                                            <AlertTriangle size={12} /> Complaint
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {selectedLogId && (
                                        <div className="mb-4 px-4 py-2 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between animate-in slide-in-from-top-1 duration-200">
                                            <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest">Selected for dispute</p>
                                            <button onClick={() => setSelectedLogId(null)} className="text-sky-400 hover:text-sky-600"><X size={12} /></button>
                                        </div>
                                    )}
                                    {filteredAttendance.length > 0 ? (
                                        <div className="space-y-3">
                                            {filteredAttendance.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => item.status !== 'Present' && setSelectedLogId(item._id)}
                                                    className={`flex items-center justify-between p-5 rounded-[2rem] transition-all border-2 group cursor-pointer
                                                        ${selectedLogId === item._id 
                                                            ? 'bg-rose-50 border-rose-300 shadow-lg shadow-rose-100 scale-[1.02]' 
                                                            : 'bg-slate-50/50 border-transparent hover:bg-slate-50 hover:border-slate-200'
                                                        } ${item.status === 'Present' ? 'cursor-default opacity-80' : ''}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all group-hover:scale-110 ${item.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                            {item.status[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-sm font-black text-slate-800 uppercase italic leading-none">
                                                                    {item.attendanceTime || 'General Session'}
                                                                    {item.period && <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black not-italic">P{item.period}</span>}
                                                                </h4>
                                                                <span className="text-[10px] font-bold text-slate-300 mx-1">•</span>
                                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{formatTime(item.createdAt)}</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                {formatDate(item.createdAt)}
                                                                {item.status !== 'Present' && (
                                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm ${item.onLeave ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                        {item.onLeave ? 'On Leave' : 'Not on Leave'}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${item.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                            {item.status}
                                                        </div>
                                                        {item.teacherId && (
                                                            <div className="flex items-center gap-1.5 mt-1 bg-white/60 px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                                                                <User size={10} className="text-slate-500" />
                                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[140px]">
                                                                    Usthad {item.teacherId.name || 'Teacher'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                                <Calendar size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest max-w-[200px] leading-relaxed">No sessions found for {formatDate(selectedMonth + "-01", true)}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Complaints Data Section */}
                            {complaintsData.length > 0 && (
                                <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-rose-50/50">
                                        <h2 className="text-xl font-black text-rose-600 tracking-tight uppercase italic flex items-center gap-3">
                                            <MessageSquare size={20} /> My Complaints
                                        </h2>
                                        <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">{complaintsData.length} TOTAL</span>
                                    </div>
                                    <div className="p-4 sm:p-6 h-[300px] overflow-y-auto bg-slate-50/30">
                                        <div className="space-y-4">
                                            {complaintsData.map((item, idx) => (
                                                <div key={idx} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(item.createdAt)}</p>
                                                                <span className="text-slate-300 text-[10px]">•</span>
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.status === 'Pending' ? 'bg-amber-100 text-amber-600' : item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xs font-black text-slate-800 uppercase italic leading-tight">
                                                                Dispute: {item.attendanceId?.attendanceTime || 'General Session'}
                                                                {item.attendanceId?.period && <span className="ml-1 bg-rose-100 text-rose-600 px-1 py-0.2 rounded text-[7px] font-black not-italic">P{item.attendanceId.period}</span>}
                                                            </h4>
                                                        </div>
                                                        {item.teacherId && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase">Assigned To</span>
                                                                <span className="text-[10px] font-black text-blue-600 uppercase">{item.teacherId.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-600 italic bg-slate-50 p-3 rounded-2xl line-clamp-2">“{item.message}”</p>
                                                    {item.adminRemark && (
                                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Response</p>
                                                            <p className="text-[10px] font-bold text-blue-600 italic">“{item.adminRemark}”</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                            
                            {/* CEP Passes Section */}
                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-sky-50/50">
                                    <h2 className="text-xl font-black text-sky-600 tracking-tight uppercase italic flex items-center gap-3">
                                        <Clock size={20} /> CEP History
                                    </h2>
                                    <span className="px-4 py-1.5 bg-sky-100 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest">{cepData.length} TOTAL</span>
                                </div>
                                <div className="p-4 sm:p-6 h-[400px] overflow-y-auto">
                                    {cepData.length > 0 ? (
                                        <div className="space-y-4">
                                            {cepData.map((item, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:border-sky-100 transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center transition-colors group-hover:bg-sky-600 group-hover:text-white">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-800 tracking-tight italic uppercase">{item.date}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black bg-white text-sky-500 px-3 py-1 rounded-full border border-sky-100 uppercase tracking-widest shadow-sm italic">CEP PASS</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-4 mt-2">
                                                        <div className="flex flex-col">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                                                            <p className="text-xs font-black text-slate-700">{item.fromTime} - {item.toTime}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued By</p>
                                                            <p className="text-xs font-black text-sky-600 uppercase italic leading-none">{item.teacherId?.name || item.teacher || 'Admin'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 bg-white/60 p-4 rounded-2xl border border-white">
                                                        <p className="text-[10px] font-bold text-slate-600 italic">“ {item.reason} ”</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                                <Clock size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">No CEP passes issued</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Other Records */}
                        <div className="space-y-8">
                           

                            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <Calendar size={20} className="text-amber-500" /> Leave History
                                    </h2>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {leaveData.length > 0 ? (
                                        <div className="space-y-4">
                                            {leaveData.map((item, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:border-amber-100 transition-all group">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(() => {
                                                                const status = getDetailedStatus(item);
                                                                const statusConfig = {
                                                                    'Returned': 'bg-emerald-500 text-white',
                                                                    'Late Returned': 'bg-orange-500 text-white',
                                                                    'On Leave': 'bg-red-500 text-white',
                                                                    'Late': 'bg-rose-600 text-white',
                                                                    'Pending': 'bg-blue-500 text-white',
                                                                    'Scheduled': 'bg-sky-400 text-white',
                                                                    'Approval Pending': 'bg-amber-500 text-white',
                                                                    'Rejected': 'bg-slate-500 text-white'
                                                                };
                                                                return (
                                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${statusConfig[status] || 'bg-slate-400 text-white'}`}>
                                                                        {status}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{formatDate(item.createdAt)}</span>
                                                    </div>
                                                    <h4 className="text-base font-black text-slate-800 uppercase italic mb-4 leading-tight">“{item.reason}”</h4>
                                                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-200/50">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-slate-300 group-hover:text-amber-500">From</span>
                                                            <span className="text-slate-800">{formatDate(item.fromDate)} {formatTimeTo12h(item.fromTime)}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-slate-300 group-hover:text-amber-500">Return</span>
                                                            <span className="text-slate-800">
                                                                {item.returnedAt ? `${formatDate(item.returnedAt)} ${formatTime(item.returnedAt)}` : 
                                                                 (item.toDate ? `${formatDate(item.toDate)} ${formatTimeTo12h(item.toTime)}` : 'PENDING')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {!item.documented && !item.isMedicalSubmitted && !item.documentUrl && ['Room', 'Medical (Home)', 'Hospital'].some(r => item.reason?.includes(r)) && (
                                                        <button 
                                                            onClick={() => { setSelectedLeave(item); setIsDocumentOpen(true); }}
                                                            className="mt-6 w-full py-3 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Upload size={14} /> Upload Medical Documents
                                                        </button>
                                                    )}
                                                    {!item.documented && (item.isMedicalSubmitted || item.documentUrl) && (
                                                         <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                                             <div className="flex-1 p-3 bg-amber-50 rounded-2xl flex items-center justify-center gap-2 border border-amber-100">
                                                                 <Clock size={14} className="text-amber-500" />
                                                                 <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Waiting for Approval</span>
                                                             </div>
                                                             {item.documentUrl && (
                                                                <a 
                                                                    href={item.documentUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                                                >
                                                                    <FileText size={14} /> View Doc
                                                                </a>
                                                             )}
                                                         </div>
                                                     )}
                                                     {item.documented && (
                                                        <div className="mt-6 p-3 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 border border-emerald-100">
                                                            <CheckCircle size={14} className="text-emerald-500" />
                                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Documents Verified</span>
                                                         </div>
                                                     )}
                                                     {(item.status === "returned" || item.returnedAt) && (() => {
                                                        const isNotNeeded = item.recoveryNeeded === false || (item.recoveryNeeded === undefined && calculateLeaveDays(item, offDays) === 0);
                                                        const isCompleted = item.recovery && !isNotNeeded;
                                                        const isPending = !item.recovery && !isNotNeeded;
                                                        
                                                        return (
                                                            <div className={`mt-3 p-3 rounded-2xl flex items-center justify-between border transition-all ${isCompleted || isNotNeeded ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    {isCompleted || isNotNeeded ? (
                                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                                    ) : (
                                                                        <Clock size={14} className="text-amber-500 animate-pulse" />
                                                                    )}
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted || isNotNeeded ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                                        {isNotNeeded ? 'Recovery Not Needed' : (isCompleted ? 'Recovery Completed' : 'Recovery Pending')}
                                                                    </span>
                                                                </div>
                                                                {isPending && (() => {
                                                                    const recovery = getRecoveryInfo(item, offDays);
                                                                    if (!recovery) return null;
                                                                    if (recovery.status === 'Overdue') {
                                                                        return (
                                                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-2 py-0.5 bg-rose-50 rounded-lg shadow-sm border border-rose-100 animate-pulse">
                                                                                Overdue
                                                                            </span>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest px-2 py-0.5 bg-white rounded-lg shadow-sm">
                                                                            {recovery.remaining} Days Left
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                        );
                                                     })()}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                                <Info size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">No leave history found</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                             <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
                                        <AlertTriangle size={20} className="text-rose-500" /> Minus report
                                    </h2>
                                    <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">TOTAL: -{stats.minusPoints}</span>
                                </div>
                                <div className="p-4 sm:p-6 h-[500px] overflow-y-auto">
                                    {minusData.length > 0 ? (
                                        <div className="space-y-4">
                                            {minusData.map((item, idx) => (
                                                <div key={idx} className="p-5 bg-rose-50/30 rounded-[2rem] border border-rose-100/50 hover:bg-rose-50 hover:border-rose-200 transition-all group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-rose-600 transition-colors">{item.reason || 'Deduction'}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.createdAt)}</p>
                                                                <span className="text-slate-300 text-[10px]">•</span>
                                                                <span className="text-[10px] font-black text-rose-400">{formatTime(item.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xl font-black text-rose-600">-{parseFloat(item.minusNum).toFixed(1)}</span>
                                                            {/* <div className="flex items-center gap-1.5 mt-2 bg-white/40 px-2 py-0.5 rounded-full border border-rose-100/50">
                                                                <User size={10} className="text-rose-400" />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">BY: {item.teacher || 'ADMIN'}</span>
                                                            </div> */}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                                                <CheckCircle size={40} className="text-emerald-500" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">Perfect record! No point deductions found.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
                <ComplaintModal 
                    isOpen={isComplaintOpen} 
                    onClose={() => setIsComplaintOpen(false)} 
                    attendance={selectedAttendance}
                    studentId={student.id || student._id}
                    records={filteredAttendance}
                />
                
                <ApplyLeaveModal 
                    isOpen={isApplyLeaveOpen} 
                    onClose={() => setIsApplyLeaveOpen(false)} 
                    student={student}
                    onComplete={() => fetchStudentAnalytics(student.ADNO)}
                />

                <DocumentModal 
                    isOpen={isDocumentOpen} 
                    onClose={() => setIsDocumentOpen(false)} 
                    leave={selectedLeave}
                    onUpdate={(code) => {
                        fetchStudentAnalytics(student.ADNO, student);
                        setShowSuccessCode(code);
                    }}
                />

                <SuccessModal 
                    isOpen={!!showSuccessCode} 
                    onClose={() => setShowSuccessCode(null)} 
                    code={showSuccessCode} 
                />

                <AttendanceModal
                    isOpen={showBreakdown}
                    onClose={() => setShowBreakdown(false)}
                    data={attendanceData}
                />

                <HistoryModal 
                    isOpen={historyModal.isOpen}
                    onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
                    title={historyModal.title}
                    data={historyModal.data}
                    type={historyModal.type}
                    color={historyModal.color}
                    onZehnuthClick={(request) => {
                        setSelectedZehnuthRequest(request);
                        setIsZehnuthEvidenceOpen(true);
                    }}
                />

                <ZehnuthEvidenceModal 
                    isOpen={isZehnuthEvidenceOpen}
                    onClose={() => setIsZehnuthEvidenceOpen(false)}
                    request={selectedZehnuthRequest}
                    onUpdate={() => fetchStudentAnalytics(student.ADNO, student)}
                />

                {/* Recovery Warning Modal */}
                {showRecoveryWarning && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRecoveryWarning(false)}></div>
                        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border-4 border-rose-100">
                            <div className="p-8 bg-rose-500 text-white text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <AlertTriangle size={48} className="mx-auto mb-4 animate-bounce" />
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">Recovery Pending</h2>
                                <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1">Academic Requirement Notice</p>
                            </div>
                            <div className="p-8 text-center space-y-6">
                                <div className="p-5 bg-rose-50 rounded-[2rem] border border-rose-100">
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                        You have an <span className="text-rose-600 font-black">uncompleted recovery</span> from your previous leave. 
                                    </p>
                                    {/* <p className="text-[11px] text-slate-500 mt-2 font-medium">
                                        Please complete your pending recovery lessons or contact your HOD before applying for a new leave.
                                    </p> */}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={() => setShowRecoveryWarning(false)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                                    >
                                        I Understand
                                    </button>
                                    {/* <button 
                                        onClick={() => {
                                            setShowRecoveryWarning(false);
                                            setIsApplyLeaveOpen(true);
                                        }}
                                        className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                                    >
                                        Proceed Anyway (Urgent Only)
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StudentAuthGuard>
    );
};

export default StudentsPortal;
