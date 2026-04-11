"use client";

import React from 'react';
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react';

const CustomAlert = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // "info", "error", "success"
  confirmText = "Okay",
  actions = null
}) => {
  if (!isOpen) return null;

  const themes = {
    info: {
      icon: <Info className="text-sky-500" size={24} />,
      btn: "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20",
      bg: "bg-sky-50"
    },
    error: {
      icon: <AlertCircle className="text-rose-500" size={24} />,
      btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
      bg: "bg-rose-50"
    },
    success: {
      icon: <CheckCircle className="text-emerald-500" size={24} />,
      btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
      bg: "bg-emerald-50"
    }
  };

  const theme = themes[type] || themes.info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-50"
      >
        <div className="p-8 text-center space-y-6">
          <div className={`w-16 h-16 ${theme.bg} rounded-3xl flex items-center justify-center mx-auto`}>
            {theme.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight">
              {title || (type === "error" ? "Something's Wrong" : "Notice")}
            </h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed px-2">
              {message}
            </p>
          </div>

          <div className="space-y-2">
            {actions && actions.length > 0 ? (
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    if (action.autoClose !== false) onClose();
                  }}
                  className={`w-full py-4 ${action.className || theme.btn} text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all active:scale-95`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <button
                onClick={onClose}
                className={`w-full py-4 ${theme.btn} text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all active:scale-95`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
