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
            className={`flex flex-col items-center justify-center p-6 rounded-[2rem] shadow-sm transition-all duration-300 border 
            ${onClick ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'}
            ${currentClass} group`}
            onClick={onClick}
        >
            <div className={`p-2 rounded-2xl mb-4 bg-white shadow-sm group-hover:bg-white/20 transition-all`}>
                {imageSrc ? (
                    <img src={imageSrc} alt={title} className="w-28 h-28 object-contain drop-shadow-md" />
                ) : (
                    Icon && <Icon className="w-10 h-10 drop-shadow-md" />
                )}
            </div>
            <div className="text-4xl font-black tracking-tight">{value}</div>
            <div className="text-[12px] font-black uppercase tracking-widest mt-2 opacity-90 text-center">{title}</div>
            {subText && <div className="text-[10px] font-bold mt-1 opacity-70 uppercase">{subText}</div>}
        </div>
    );
}
