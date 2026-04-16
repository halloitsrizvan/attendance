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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300 border border-emerald-50/50"
      >
        {/* Close Icon - Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-full z-10"
          title="Cancel Selection"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="p-8 text-center space-y-6">
          <div className={`w-16 h-16 ${theme.bg} rounded-3xl flex items-center justify-center mx-auto shadow-sm`}>
            {theme.icon}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-slate-800 font-black text-lg uppercase tracking-tight">
              {title || (type === "error" ? "Something's Wrong" : "Notice")}
            </h3>
            <div className="text-slate-400 text-sm font-bold leading-relaxed px-1">
              {typeof message === 'string' ? message : message}
            </div>
          </div>

          <div className={`${actions && actions.length > 2 ? 'grid grid-cols-2 gap-2.5' : 'flex flex-col gap-2'}`}>
            {actions && actions.length > 0 ? (
              actions.map((action, index) => {
                if (action.variant === 'link') {
                  return (
                    <div key={index} className="flex justify-end px-2 pt-1">
                      <button
                        onClick={() => {
                          action.onClick();
                          if (action.autoClose !== false) onClose();
                        }}
                        className="text-[9px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer"
                      >
                        {action.label}
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      if (action.autoClose !== false) onClose();
                    }}
                    className={`w-full py-4 ${action.className || theme.btn} text-white text-[9px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 group overflow-hidden`}
                  >
                    <span className="relative z-10">{action.label}</span>
                  </button>
                );
              })
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
