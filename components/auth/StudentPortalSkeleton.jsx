"use client";

import React from 'react';

const SkeletonMetric = () => (
    <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center border border-slate-100 shadow-sm animate-pulse">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4"></div>
        <div className="w-20 h-10 bg-slate-100 rounded-xl mb-3"></div>
        <div className="w-16 h-3 bg-slate-50 rounded-full mb-2"></div>
        <div className="w-24 h-2 bg-slate-50/50 rounded-full"></div>
    </div>
);

const SkeletonListItem = () => (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
            <div className="space-y-2">
                <div className="w-20 h-3 bg-slate-100 rounded-full"></div>
                <div className="w-12 h-2 bg-slate-50 rounded-full"></div>
            </div>
        </div>
        <div className="w-16 h-5 bg-slate-100 rounded-full"></div>
    </div>
);

const StudentPortalSkeleton = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col overflow-hidden">
            {/* Header Skeleton */}
            <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                            <div className="w-24 h-6 bg-slate-100 rounded-lg"></div>
                        </div>
                        <div className="flex items-center gap-4 animate-pulse">
                            <div className="flex flex-col items-end gap-1">
                                <div className="w-20 h-4 bg-slate-100 rounded-full"></div>
                                <div className="w-12 h-2 bg-slate-50 rounded-full"></div>
                            </div>
                            <div className="w-11 h-11 bg-slate-100 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto mt-24">
                {/* Header Section Skeleton */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 animate-pulse">
                        <div className="w-64 h-12 bg-slate-200/50 rounded-2xl"></div>
                        <div className="w-40 h-4 bg-slate-100 rounded-full"></div>
                    </div>
                    <div className="bg-white p-3 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 px-6 w-64 h-16 animate-pulse">
                        <div className="w-1/2 h-8 bg-slate-100 rounded-xl"></div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="w-1/2 h-8 bg-slate-100 rounded-xl"></div>
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
                    <SkeletonMetric />
                    <SkeletonMetric />
                    <SkeletonMetric />
                    <SkeletonMetric />
                </div>

                {/* Data Grids Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-[500px] p-8 animate-pulse">
                        <div className="w-40 h-8 bg-slate-100 rounded-xl mb-8"></div>
                        <div className="space-y-4">
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 h-[500px] p-8 animate-pulse">
                        <div className="w-40 h-8 bg-slate-100 rounded-xl mb-8"></div>
                        <div className="space-y-4">
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                            <SkeletonListItem />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentPortalSkeleton;
