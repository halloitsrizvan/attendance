import React from 'react';

export default function PortalSkeleton({ hasBanner = false }) {
    return (
        <div className="w-full space-y-5" role="status" aria-label="Loading page">
            <span className="sr-only">Loading page content...</span>
            <div className="space-y-3 animate-pulse motion-reduce:animate-none" aria-hidden="true">
                <div className="h-7 w-44 rounded-lg bg-slate-200/70" />
                <div className="h-4 w-60 max-w-full rounded bg-slate-200/50" />
                {hasBanner && <div className="h-32 w-full rounded-3xl bg-purple-100/70" />}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(item => <div key={item} className="h-24 rounded-2xl bg-slate-200/50" />)}
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 space-y-4">
                    <div className="h-5 w-32 rounded bg-slate-200/60" />
                    {[1, 2, 3, 4].map(item => <div key={item} className="h-12 rounded-xl bg-slate-100" />)}
                </div>
            </div>
        </div>
    );
}
