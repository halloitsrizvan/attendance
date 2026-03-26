import React from 'react'
import Header from '../components/Header/Header'
import AllClass from '../components/allClasses/AllClass'

function EditClassPage() {
  return (
    <div>
        <Header/>
        <AllClass edit={true}/>
    </div>
  )
}

export default EditClassPage