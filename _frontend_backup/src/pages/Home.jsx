import React from 'react'
import Header from '../components/Header/Header'
import AllClass from '../components/allClasses/AllClass'

function Home() {
  const WebURL="https://clg-project-nu.vercel.app/"
  return (
    <div>
        <Header/>
        <AllClass edit={false}/>
    </div>
  )
}

export default Home