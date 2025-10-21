import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ClassWiseLoad from '../load-UI/ClassWiseLoad';
import { API_PORT } from '../../Constants';

function ClassWIse() {
    const navigate = useNavigate()
    const [classes,setClass] = useState([])
    const [load,setLoad] = useState(false)
    const [AllStudents,setAllStudents] =useState('')
    useEffect(()=>{
        setLoad(true)
        axios.get(`${API_PORT}/classes`)
        .then((res)=>{
          const filter=res.data.sort((a, b) => a.class - b.class);
          setClass(filter)
          setAllStudents(res.data.reduce((sum,item)=>sum+item.presentStudents,0))
            console.log(res.data)
            setLoad(false)
        })
        .catch((err)=>{
            console.error(err);
            setLoad(false)
        })
    },[])

  return (
    <div className="container mx-auto px-4 py-10">
  <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-6 tracking-tight mt-10">
     Class Wise Latest Attendance
  </h2>
  
    {load &&<ClassWiseLoad/>}


    <div className="mb-6 p-5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 rounded-2xl shadow-md text-center">
      <h3 className="text-2xl font-semibold text-indigo-700 mb-1">Total Students</h3>
      <p className="text-5xl font-extrabold text-indigo-600 tracking-wide drop-shadow-sm">
        {AllStudents}
      </p>
    </div>

      

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6">

    {classes.map((cls, index) => (
      <div
      key={index}
      className=" bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 rounded-2xl shadow-md p-6 text-center cursor-pointer 
                 transition-transform transform hover:scale-10 hover:shadow-xl"
    >
      {/* Class Number */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Class</p>
        <h3 className="text-5xl font-extrabold text-indigo-600">
          {cls.class}
        </h3>
      </div>
    
      {/* Stats */}
      <div className="space-y-3 text-sm">
        <p className="text-gray-700">
          👥 Strength:{" "}
          <span className="font-bold text-gray-900">{cls.totalStudents}</span>
        </p>
        <p className="text-gray-700">
          ✅ Present:{" "}
          <span className="font-bold text-green-600">{cls.presentStudents}</span>
        </p>
        <p className="text-gray-700">
          ❌ Absent:{" "}
          <span className="font-bold text-red-600">{cls.absentStudents}</span>
        </p>
        <p className="text-gray-700">
          📊 Percent:{" "}
          <span
            className={`font-bold ${
              cls.percentage >= 75 ? "text-green-600" : "text-yellow-600"
            }`}
          >
            {cls.percentage}%
          </span>
        </p>
        <p className="text-gray-600">
          {cls.updatedAt
            ? new Date(cls.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                
              })
            : "N/A"}
            </p>
      </div>
    </div>
    
    ))}
  </div>
</div>

  )
}

export default ClassWIse