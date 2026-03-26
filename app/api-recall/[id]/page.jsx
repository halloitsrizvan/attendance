"use client";

import React from 'react'
import Header from '@/components/Header/Header'
import AllClass from '@/components/allClasses/AllClass'
import { useParams } from 'next/navigation'

function ApiRecall() {
    const params = useParams();
    const id = params?.id;

    return (
      <div>
          <Header/>
          <AllClass edit={false} id={id} />
      </div>
    )
}

export default ApiRecall