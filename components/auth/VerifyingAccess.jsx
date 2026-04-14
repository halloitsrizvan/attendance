"use client";

import React from 'react';
import Image from 'next/image';

const VerifyingAccess = () => {
    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Rotating Border */}
                <div className="absolute inset-0 border-4 border-slate-50 border-t-blue-600 rounded-full animate-spin"></div>
                
                {/* Logo in Circle */}
                <div className="w-24 h-24 bg-white rounded-full overflow-hidden flex items-center justify-center shadow-lg border border-slate-100 z-10 p-1">
                    <Image 
                        src="/cirlced-logo.png" 
                        alt="Logo" 
                        width={80} 
                        height={80} 
                        className="object-contain"
                        priority
                    />
                </div>
            </div>
            
            <div className="mt-8 text-center space-y-2 animate-pulse">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">Verifying Access</h2>
                <div className="flex justify-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full opacity-60"></div>
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full opacity-30"></div>
                </div>
            </div>
        </div>
    );
};

export default VerifyingAccess;
