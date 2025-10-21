import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ClassWiseLoad from '../load-UI/ClassWiseLoad';
import { API_PORT } from '../../Constants';

function ClassWIse() {
    const navigate = useNavigate()
    const [classes,setClass] = useState([])
    const [load,setLoad] = useState(false)
    const [classesLoad,setClassesLoad] = useState(false)
    const [absenteesLoad,setAbsenteesLoad] = useState(false)
    const [AllStudents,setAllStudents] =useState('')
    const [abseties,setAbseties] = useState([])
    useEffect(()=>{
        // Set overall loading state
        setLoad(true)
        setClassesLoad(true)
        setAbsenteesLoad(true)
        
        // Fetch classes data
        axios.get(`${API_PORT}/classes`)
        .then((res)=>{
          const filter=res.data.sort((a, b) => a.class - b.class);
          setClass(filter)
          setAllStudents(res.data.reduce((sum,item)=>sum+item.presentStudents,0))
          console.log(res.data)
          setClassesLoad(false)
        })
        .catch((err)=>{
            console.error(err);
            setClassesLoad(false)
        })

        // Fetch absentees data
        axios.get(`${API_PORT}/set-attendance`)
        .then((res)=>{
          console.log("All attendance data:", res.data);
          
          // First, get the latest attendance record for each student
          const latestByStudent = {};
          res.data.forEach((s) => {
            const existing = latestByStudent[s.ad];
            if (!existing || new Date(s.attentenceDate) > new Date(existing.attentenceDate)) {
              latestByStudent[s.ad] = s;
            }
          });
          
          // Now filter only those whose latest status is "Absent"
          const latestAbsentStudents = Object.values(latestByStudent)
            .filter(s => s.status === "Absent")
            .sort((a, b) => a.SL - b.SL);
            
          console.log("Latest absent students:", latestAbsentStudents);
          latestAbsentStudents.sort((a, b) => a.class - b.class);
          setAbseties(latestAbsentStudents);
          setAbsenteesLoad(false);
        })
        .catch((err)=>{
          console.error(err);
          setAbsenteesLoad(false)
        })
    },[])

    // Update overall loading state when both individual loads are complete
    useEffect(() => {
        if (!classesLoad && !absenteesLoad) {
            setLoad(false)
        }
    }, [classesLoad, absenteesLoad])

  return (
    <div className="container mx-auto px-4 py-10">
  <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-6 tracking-tight mt-10">
      Attendance Status
  </h2>
  
    {load &&<ClassWiseLoad/>}


    <div className="mb-6 p-5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 rounded-2xl shadow-md text-center">
      <h3 className="text-2xl font-semibold text-indigo-700 mb-1">Total Students</h3>
      <p className="text-5xl font-extrabold text-indigo-600 tracking-wide drop-shadow-sm">
        {AllStudents}
      </p>
    </div>

    {/* Latest Absentees Section */}
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Latest Absentees</h2>
        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
          {abseties.length} Students
        </span>
      </div>
      
      {absenteesLoad ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Loading Absentees Data</h3>
          <p className="text-gray-500 animate-pulse">Please wait while we fetch the latest attendance records...</p>
        </div>
      ) : abseties.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                 
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abseties.map((std, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {std.ad || std.ADNO || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {std.class || std.className || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {std.nameOfStd  || 'Unknown Student'}
                    </td>
                   
                   
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {std.attentenceDate ? new Date(std.attentenceDate).toLocaleDateString() : 
                       std.date ? new Date(std.date).toLocaleDateString() : 
                       std.createdAt ? new Date(std.createdAt).toLocaleDateString() : 
                       'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        
        <div className="flex items-center justify-center mb-2">
            <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-800 mb-1">Great News!</h3>
          
          <p className="text-green-600">All students are present today. No absentees to display.</p> 
        
        </div>
      )}
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