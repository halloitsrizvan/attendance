import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { API_PORT } from '../../Constants'
import { Calendar, FileSignature } from 'lucide-react'
import ConfirmationModal from '../common/ConfirmationModal';

const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
};
const formatTime = (timeString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(`1970-01-01T${timeString}Z`).toLocaleTimeString([], options);
}

function MinusReportPage() {
    const [minusList, setMinusList] = useState([])
    const [load, setLoad] = useState(false) 
    useEffect(() => {
        setLoad(true)
        axios.get(`${API_PORT}/minus`).then((res) => {
            setMinusList(res.data)
            console.log(res.data);
            setLoad(false)
        }).catch((err) => {
            console.log(err);
            setLoad(false)
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
     const [confirmationModal, setConfirmationModal] = useState({
       isOpen: false,
       title: '',
       message: '',
       confirmText: 'Confirm',
       isDangerous: false,
       action: null,
       leaveData: null,
       isLoading: false
     });

const removeMinus = async (id) => {
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    try {
        await axios.delete(`${API_PORT}/minus/${id}`);
        setMinusList(prev => prev.filter(item => item._id !== id));
        setConfirmationModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err) {
        console.log(err);
        setConfirmationModal(prev => ({ ...prev, isLoading: false }));
        
    }
}
    return (
        <div className='mt-16 p-4 space-y-4'>
          <div className="flex justify-end mr-0">
                <button 
                    onClick={handleDownload}
                    disabled={load}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 text-white bg-emerald-600 hover:bg-emerald-700`}>
                   {load?"Loading...": "Download Excel"}
                </button>
         </div>
        
            {minusList.map((item) => (
                 <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">

            <div className={`h-1 bg-orange-500`}></div>

            <div className="p-3 sm:p-4">

              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0`}>
                    {item.ad}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500">Class {item.classNum}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmationModal({
                                isOpen: true,
                                title: 'Confirm Removal',
                                message: 'Are you sure you want to remove this minus entry?',
                                confirmText: 'Remove',
                                isDangerous: true,
                                action: () => removeMinus(item._id),
                                leaveData: null,
                                isLoading: false
                                })}
                      className="px-3 py-1.5 text-sm sm:text-sm font-medium bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        Remove
                    </button>
                  </div>
              </div>
            {confirmationModal.isOpen && <ConfirmationModal 
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmationModal.action}
                title={confirmationModal.title}
                message={confirmationModal.message}
                confirmText={confirmationModal.confirmText}
                isDangerous={confirmationModal.isDangerous}
                isLoading={confirmationModal.isLoading}
            />}
              {/* <div className="flex flex-wrap gap-1 mb-2">
                
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1">

                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100 whitespace-nowrap">
                        <Calendar size={10} className="text-blue-600" />
                        <span className="text-xs text-gray-900">{formatDate(item.createdAt)}</span>
                      
                      </div>
                    </div>

                  

                  </div>

              </div> */}

              {/* Teacher & Reason */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-100">
                
                 <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    <Calendar size={12} />
                    <span className="font-medium">{formatDate(item.createdAt)}</span>
                  </div>

                {item.teacher && (
                  <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    <FileSignature size={12} />
                    <span className="font-medium">{item.teacher}</span>
                  </div>
                )}

                {item.reason && (
                  <div className="items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <span className="truncate italic">{item.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
                // <div key={item._id} className="bg-white shadow-md rounded-xl overflow-hidden w-full">
                //     {/* --- Card Header (Green) --- */}
                //     {/* <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 flex justify-between items-center">
                //         <div className="flex items-center gap-3">
                //             <div className="text-left">
                //                 <div className="text-xs font-light bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                //                     Class {item.classNum}
                //                 </div>
                //                 <div className="text-xs font-light px-2">AD {item.ad}</div>
                //             </div>
                //             <h2 className="text-base font-semibold">{item.name}</h2>
                //         </div>
                //     </div> */}
                //      <div className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white p-4 flex justify-between items-center">
                //         <div className="flex items-center gap-3">
                //         <div className="text-left">
                //             <div className="text-xs font-light bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">Class {item.classNum}</div>
                //             <div className="text-xs font-light px-2 ">AD {item.ad}</div>
                //         </div>
                //         <h2 className="text-base font-semibold">{item.name}</h2>
                //         </div>
                //         <div 
                //         className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 bg-white text-emerald-800 `}
                //         >
                        
                //         {item.reason}
                //         </div>
                //     </div>




                //     {/* --- Card Body (Light Green) --- */}
                //     <div className="bg-emerald-100 p-4 grid grid-cols-12 gap-4 text-center">
                //     <div className="flex flex-col items-center justify-start col-span-2">
                //         <h3 className="text-xs font-medium mb-1 text-gray-500">
                //             Minus
                //         </h3>
                //         <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-red-100 text-red-700 border-red-200">
                //             {parseFloat(item.minusNum).toFixed(2)}
                //         </span>
                //     </div>
                    
                //     <div className="flex flex-col items-center justify-start col-span-4">
                //         <h3 className="text-xs font-medium mb-1 text-gray-500">
                //             Teacher
                //         </h3>
                //         <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-blue-100 text-blue-700 border-blue-200">
                //             {item.teacher}
                //         </span>
                //     </div>

                //     <div className="flex flex-col items-center justify-start col-span-6">
                //         <h3 className="text-xs font-medium mb-1 text-gray-500">
                //             Date & Time
                //         </h3>
                //         <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-xl border bg-blue-100 text-blue-700 border-blue-200">
                //               {new Date(item.createdAt).toLocaleDateString('en-GB')} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                //         </span>
                //     </div>
                // </div>
                // </div>
            ))}
        </div>
    )
}

export default MinusReportPage