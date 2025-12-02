import React from 'react';
import SelectionButton from './SelectionButton';

function DatePicker({ label, selectedDate, setSelectedDate, customDate, setCustomDate }) {
  const dateOptions = ['Today', 'Tomorrow', 'Day After', 'Calendar'];
  
  const handleDateSelect = (option) => {
    setSelectedDate(option);
    // Reset custom date when switching away from Calendar
    if (option !== 'Calendar') {
      setCustomDate('');
    }
  };

  return (
    <div className="mb-6 p-2 bg-white rounded-xl shadow-inner border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
        {dateOptions.map(option => (
          <SelectionButton
            key={option}
            label={option}
            isSelected={selectedDate === option}
            onClick={() => handleDateSelect(option)}
            type={label}
          />
        ))}
      </div>
      {selectedDate === 'Calendar' && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <label htmlFor={`${label}-date-input`} className="block text-sm font-medium text-indigo-600 mb-2">
            Select Custom Date:
          </label>
          <input
            id={`${label}-date-input`}
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full border border-indigo-300 rounded-lg p-3 text-base focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            required={selectedDate === 'Calendar'}
          />
        </div>
      )}
    </div>
  );
}

export default DatePicker;