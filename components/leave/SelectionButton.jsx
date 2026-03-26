"use client";

import React from 'react'

function SelectionButton({ label, isSelected, onClick, type }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3 px-1 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 border-2
        ${isSelected
          ? type === "Reason"
            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]'
            : 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20 scale-[1.02]'
          : 'bg-white text-slate-400 border-slate-50 hover:border-sky-100'
        }
      `}
    >
      {label}
    </button>
  )
}

export default SelectionButton
