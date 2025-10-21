import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AllClassLoad from '../load-UI/AllClassLoad';
import { API_PORT } from '../../Constants';
function AllClass({edit,id}) {

    const navigate = useNavigate()
    const [classes,setClass] = useState([])
    const [load,setLoad] = useState(false)
    useEffect(()=>{
        setLoad(true)
        axios.get(`${API_PORT}/classes`)

        .then((res)=>{
            const filter=res.data.sort((a, b) => a.class - b.class);
            setClass(filter)
            console.log(res.data)
            setLoad(false)
        })
        .catch((err)=>{
            console.error(err);
            setLoad(false)
        })
    },[])
    
    const today = new Date().toISOString().split("T")[0];
    const [date, setDate] = useState(today);

  
    const [time,setTime] = useState('Night')
    const [period,setPeriod] = useState('')
    const [more,setMore] = useState('')

    useEffect(() => {
        if (id) {
          setTime(id);
        }
      }, [id]);
      

  return (
          <div className="container mx-auto px-4 py-8 mt-12">
           
           {!edit && (
  <div className="flex justify-center mb-6">
    <form className="bg-gray-100 p-4 rounded-lg shadow w-full max-w-xl">
      {/* Date + Time in one row (even on mobile) */}
      <div className="flex flex-row gap-4">
        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onFocus={(e) => e.target.showPicker && e.target.showPicker()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />

        {/* Time */}
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        >
          <option value="Night">Night</option>
          <option value="Period">Period</option>
          <option value="Morning">Morning</option>
          <option value="Noon">Noon</option>
          <option value="Jamath">Jamath</option>
          <option value="More">More</option>
        </select>
      </div>

      {/* Period or More under both (on mobile) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:gap-4">
        {time === "Period" && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none w-full sm:w-auto"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}

        {time === "More" && (
          <input
            value={more}
            onChange={(e) => setMore(e.target.value)}
            placeholder="Enter more info"
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none w-full sm:w-auto"
          />
        )}
      </div>
    </form>
  </div>
)}

            


            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">{edit?"Update Attendance":"Select a class"}</h2>
                {load && <AllClassLoad/>}
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                 {classes.map((cls, index) => (
                        <div key={index} className={` rounded-lg shadow-lg p-4 text-center cursor-pointer transition-transform transform hover:scale-105 hover:shadow-xl  bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 text-green-800`}
                        onClick={()=>{
                            if(edit){
                                navigate(`/edit-attendance/${cls.class}`)
                            }else{
                                navigate(`/attendance/${cls.class}?date=${date}&time=${time}&period=${period}&more=${more}`)
                            }
                            
                        }}
                        >
                            <div className="mb-3">
                                <p className="text-xs text-gray-500">Class</p>
                                <h3 className="text-4xl font-bold text-indigo-600">{cls.class}</h3>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500">Strength: <span className="font-bold text-gray-700">{cls.totalStudents}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
  )
}

export default AllClass