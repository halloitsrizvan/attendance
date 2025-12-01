import React from 'react'

function SelectionButton({ label, isSelected, onClick ,type}) {
  return (
    <button
    onClick={onClick}
    className={`w-full py-2 px-1 text-sm font-medium border rounded-lg transition-all duration-200
      ${isSelected
        ? type === "From Date" || type === "From Time" ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]':'bg-green-600 text-white border-indigo-600 shadow-md transform scale-[1.02]'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    {label}
      
  </button>
  )
}

export default SelectionButton