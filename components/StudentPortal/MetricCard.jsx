import React from 'react';

export default function MetricCard({ title, value, subText, color, icon: Icon, imageSrc, onClick }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white',
        rose: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white',
        sky: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-700 hover:text-white' // default/grey mapping
    };

    const currentClass = colorClasses[color] || colorClasses.blue;

    return (
        <div
            className={`flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm transition-all duration-300 border 
            ${onClick ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'}
            ${currentClass} group`}
            onClick={onClick}
        >
            <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 bg-white shadow-sm group-hover:bg-white/20 transition-all shrink-0">
                {imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-16 h-16 sm:w-28 sm:h-28 object-contain drop-shadow-md" />
                ) : (
                    Icon && <Icon className="w-5 h-5 sm:w-10 sm:h-10 drop-shadow-md" />
                )}
            </div>
            <div className="text-2xl sm:text-4xl font-black tracking-tight">{value}</div>
            <div className="text-[9px] sm:text-[12px] font-black uppercase tracking-normal sm:tracking-widest mt-1 sm:mt-2 opacity-90 text-center leading-tight">{title}</div>
            {subText && <div className="text-[8px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 opacity-70 uppercase text-center">{subText}</div>}
        </div>
    );
}
