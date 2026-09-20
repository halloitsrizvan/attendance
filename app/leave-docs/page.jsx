"use client";

import React from 'react';
import LeaveDocumentation, { getMedicalDocsOnly, getProgramDocsOnly, getAllDocs } from '@/components/leave/LeaveDocumentation';

export { getMedicalDocsOnly, getProgramDocsOnly, getAllDocs };

const LeaveDocsPage = () => {
    return <LeaveDocumentation defaultTab="all" />;
};

export default LeaveDocsPage;
