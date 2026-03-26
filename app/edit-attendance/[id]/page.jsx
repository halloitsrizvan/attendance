"use client";

import React, { Suspense } from 'react'
import Header from '@/components/Header/Header'
import EditAtt from '@/components/editAttendance/EditAtt'

function EditAttetence() {
  return (
    <div>
        <Header/>
        <Suspense fallback={<div>Loading edit attendance...</div>}>
            <EditAtt/>
        </Suspense>
    </div>
  )
}

export default EditAttetence