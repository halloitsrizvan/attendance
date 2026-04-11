"use client";

import React from 'react';
import { 
  Calendar, 
  CalendarDays, 
  Sun, 
  Moon, 
  Zap, 
  Clock, 
  Stethoscope, 
  Bed, 
  Building2, 
  Heart, 
  PartyPopper, 
  Edit3,
  CalendarCheck,
  ArrowRight,
  SkipForward
} from 'lucide-react';

const iconMap = {
  // Date
  'Today': Calendar,
  'Tomorrow': ArrowRight,
  'Day After': SkipForward,
  'Calendar': CalendarDays,
  
  // Time
  'Morning': Sun,
  'Evening': Moon,
  'Now': Zap,
  'Clock': Clock,
  
  // Reason
  'Medical': Stethoscope,
  'Medical (Home)': Stethoscope,
  'Room': Bed,
  'Hospital': Building2,
  'Marriage': Heart,
  'Function': PartyPopper,
  'Custom': Edit3,
};

function SelectionButton({ label, isSelected, onClick, type }) {
  const Icon = iconMap[label];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 px-2 text-[9px] font-medium uppercase tracking-widest rounded-2xl transition-all duration-300 border-2 flex flex-col items-center justify-center gap-1
        ${isSelected 
          ? type === "Reason"
            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]'
            : type === "From"
              ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20 scale-[1.02]'
              : type === "To"
                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]'
                : type === "Template"
                  ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20 scale-[1.02]'
                  : 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20 scale-[1.02]'
          : 'bg-white text-slate-400 border-slate-50 hover:border-sky-100 hover:bg-sky-50/30'
        }
      `}
    >
      {Icon && <Icon size={18} className={`${isSelected ? 'text-white' : 'text-slate-300'}`} />}
      <span>{label}</span>
    </button>
  )
}

export default SelectionButton
