import React from 'react'
import Header from '../components/Header/Header'
import AllClass from '../components/allClasses/AllClass'
import { useParams } from 'react-router-dom'
function ApiRecall() {
    const {id} = useParams()
  return (
    <div>
        <Header/>
        <AllClass edit={false} id={id} />
    </div>
  )
}

export default ApiRecall