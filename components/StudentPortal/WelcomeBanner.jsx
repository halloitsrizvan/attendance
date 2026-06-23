import React from 'react';

export default function WelcomeBanner({ studentName, dateStr }) {
    return (
        <div className="relative bg-[#0A84C6] rounded-[1rem] p-8 md:p-12 text-white overflow-hidden shadow-lg mb-8">
            <div className="relative z-10">
                <div className="text-sm font-semibold opacity-90 mb-4">{dateStr}</div> 
                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                    Welcome back, {studentName}!
                </h1>
                <p className="text-sm font-medium opacity-90">
                    Always stay updated in your student portal
                </p>
            </div>
            
            {/* 3D Image on the right */}
            <div className="absolute right-0 bottom-0 h-[120%] md:h-[120%] flex items-end pointer-events-none -mb-4 md:-mb-8 pr-4 md:pr-2 opacity-20 sm:opacity-100 transition-opacity">
                <img 
                    src="/stud_portal_redesign/image-removebg-preview (11) 1.png" 
                    alt="Welcome Banner Image"  
                    className="h-full w-auto object-contain object-bottom drop-shadow-2xl"
                />
            </div>
        </div>
    );
}
