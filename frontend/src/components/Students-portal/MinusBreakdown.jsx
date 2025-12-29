import React, { useEffect } from 'react'

function MinusBreakdown({show,minusData,onClose}) { 
    useEffect(() => {
         if (!show || !minusData) return; 
       
    }, [minusData]);

     if (!show) return null;
  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300'>
        <div className={`w-full max-w-lg bg-red-100 rounded-2xl shadow-2xl p-6 relative transform transition-transform duration-300 scale-100`}>
            <button
          onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Minus Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {minusData.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">{item.reason}</h4>
                        <p className="text-gray-600">Date: {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <p className="text-sm text-gray-500 mt-6 text-center">
         
        </p>
                {minusData.length===0 && <p className="text-sm text-gray-500 mt-6 text-center">
          No minus records found.
        </p>}
    </div>
     </div>
  )
}

export default MinusBreakdown