"use client";

import React from 'react';
import LeaveDocumentation, { getMedicalDocsOnly, getProgramDocsOnly, getAllDocs } from '@/components/leave/LeaveDocumentation';

export { getMedicalDocsOnly, getProgramDocsOnly, getAllDocs };

const ProgramDocsPage = () => {
    return <LeaveDocumentation defaultTab="program" />;
};

export default ProgramDocsPage;
