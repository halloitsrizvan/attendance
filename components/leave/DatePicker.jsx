"use client";

import React from 'react';
import SelectionButton from './SelectionButton';

function DatePicker({ label, selectedDate, setSelectedDate, customDate, setCustomDate, type }) {
  const dateOptions = ['Today', 'Tomorrow', 'Day After', 'Calendar'];

  const handleDateSelect = (option) => {
    setSelectedDate(option);
    if (option !== 'Calendar') {
      setCustomDate('');
    }
  };

  return (
    <div className="space-y-3">
      {label && <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</h3>}
      <div className="grid grid-cols-2 gap-2">
        {dateOptions.map(option => (
          <SelectionButton
            key={option}
            label={option}
            isSelected={selectedDate === option}
            onClick={() => handleDateSelect(option)}
            type={type || label}
          />
        ))}
      </div>
      {selectedDate === 'Calendar' && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <input
            id={`${label}-date-input`}
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
            required={selectedDate === 'Calendar'}
          />
        </div>
      )}
    </div>
  );
}

export default DatePicker;
