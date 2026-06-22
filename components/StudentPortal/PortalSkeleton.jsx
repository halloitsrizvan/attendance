import React from 'react';

export default function PortalSkeleton({ hasBanner = false }) {
    return (
        <div className="animate-pulse space-y-8 fade-in duration-500 w-full mt-2">
            {/* Banner Skeleton */}
            {hasBanner && (
                <div className="h-32 md:h-48 bg-slate-200/70 rounded-[2rem] w-full mb-8"></div>
            )}

            {/* Title Skeleton */}
            <div className="h-8 bg-slate-200/70 rounded-xl w-48 mb-6"></div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="h-40 md:h-48 bg-slate-200/70 rounded-[2rem]"></div>
                <div className="h-40 md:h-48 bg-slate-200/70 rounded-[2rem]"></div>
                <div className="h-40 md:h-48 bg-slate-200/70 rounded-[2rem] hidden lg:block"></div>
                <div className="h-40 md:h-48 bg-slate-200/70 rounded-[2rem] hidden lg:block"></div>
            </div>

            {/* List/Content Skeleton */}
            <div className="space-y-4 pt-4 mt-8">
                <div className="h-8 bg-slate-200/70 rounded-xl w-32 mb-4"></div>
                <div className="h-20 bg-slate-200/70 rounded-2xl w-full"></div>
                <div className="h-20 bg-slate-200/70 rounded-2xl w-full"></div>
                <div className="h-20 bg-slate-200/70 rounded-2xl w-full"></div>
            </div>
        </div>
    );
}
