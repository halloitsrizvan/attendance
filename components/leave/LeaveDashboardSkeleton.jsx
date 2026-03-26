"use client";

import React from 'react';

const CardSkeleton = () => (
    <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex flex-col gap-2 flex-1">
                    <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                    <div className="w-1/3 h-3 bg-gray-100 rounded"></div>
                </div>
            </div>
            <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
        </div>
        <div className="flex gap-2 border-t border-slate-50 pt-3">
            <div className="w-20 h-4 bg-gray-100 rounded"></div>
            <div className="w-20 h-4 bg-gray-100 rounded"></div>
        </div>
    </div>
);

const LeaveDashboardSkeleton = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Tabs Skeleton */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-24 h-10 bg-gray-200 rounded-xl shrink-0 animate-pulse"></div>
                ))}
            </div>

            {/* Statistics Row (OnLeave view) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
                <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-gray-50 rounded-lg border border-gray-100"></div>
                    ))}
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

export default LeaveDashboardSkeleton;
