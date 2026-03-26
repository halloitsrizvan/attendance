"use client";

import React from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8 overflow-hidden animate-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="text-center">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg ${
                        isDangerous ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' : 'bg-sky-50 text-sky-500 shadow-sky-500/10'
                    }`}>
                        {isDangerous ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
                    </div>

                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Confirmation</h3>
                    <h2 className={`text-xl font-black uppercase tracking-tight mb-3 ${isDangerous ? 'text-rose-500' : 'text-slate-800'}`}>
                        {title}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8 px-2">
                        {message}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="py-4 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`py-4 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                                isDangerous ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600' : 'bg-sky-500 shadow-sky-500/20 hover:bg-sky-600'
                            }`}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
