import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { API_PORT } from '../../Constants'

function MinusReportPage() {
    const [minusList, setMinusList] = useState([])

    useEffect(() => {
        axios.get(`${API_PORT}/minus`).then((res) => {
            setMinusList(res.data)
            console.log(res.data);
        }).catch((err) => {
            console.log(err);
        })
    }, [])

    const handleDownload = () => {
        // Convert data to CSV format
        const headers = ['AD No', 'Class', 'Name', 'Reason', 'Teacher', 'Minus Count', 'Date', 'Time'];
        
        const csvData = minusList.map(item => [
            item.ad,
            item.classNum,
            `"${item.name}"`, // Wrap in quotes to handle commas in names
            `"${item.reason}"`,
            `"${item.teacher}"`,
            parseFloat(item.minusNum).toFixed(2),
            new Date(item.createdAt).toLocaleDateString('en-GB'),
            new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `minus_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className='mt-16 p-4 space-y-4'>
          <div className="flex justify-end mr-0">
                <button 
                    onClick={handleDownload}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 text-white bg-emerald-600 hover:bg-emerald-700`}>
                    Download Excel
                </button>
         </div>
        
            {minusList.map((item) => (
                <div key={item._id} className="bg-white shadow-md rounded-xl overflow-hidden w-full">
                    {/* --- Card Header (Green) --- */}
                    {/* <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="text-left">
                                <div className="text-xs font-light bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                                    Class {item.classNum}
                                </div>
                                <div className="text-xs font-light px-2">AD {item.ad}</div>
                            </div>
                            <h2 className="text-base font-semibold">{item.name}</h2>
                        </div>
                    </div> */}
                     <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                        <div className="text-left">
                            <div className="text-xs font-light bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">Class {item.classNum}</div>
                            <div className="text-xs font-light px-2 ">AD {item.ad}</div>
                        </div>
                        <h2 className="text-base font-semibold">{item.name}</h2>
                        </div>
                        <div 
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 bg-white text-emerald-800 `}
                        >
                        
                        {item.reason}
                        </div>
                    </div>




                    {/* --- Card Body (Light Green) --- */}
                    <div className="bg-emerald-100 p-4 grid grid-cols-12 gap-4 text-center">
                    <div className="flex flex-col items-center justify-start col-span-2">
                        <h3 className="text-xs font-medium mb-1 text-gray-500">
                            Minus
                        </h3>
                        <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-red-100 text-red-700 border-red-200">
                            {parseFloat(item.minusNum).toFixed(2)}
                        </span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-start col-span-4">
                        <h3 className="text-xs font-medium mb-1 text-gray-500">
                            Teacher
                        </h3>
                        <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-blue-100 text-blue-700 border-blue-200">
                            {item.teacher}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-start col-span-6">
                        <h3 className="text-xs font-medium mb-1 text-gray-500">
                            Date & Time
                        </h3>
                        <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-blue-100 text-blue-700 border-blue-200">
                              {new Date(item.createdAt).toLocaleDateString('en-GB')} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
                </div>
            ))}
        </div>
    )
}

export default MinusReportPage