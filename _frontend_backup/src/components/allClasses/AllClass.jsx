import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AllClassLoad from '../load-UI/AllClassLoad';
import { API_PORT } from '../../Constants';
import App from './App';
function AllClass({edit,id}) {

    const navigate = useNavigate()
    const [classes,setClass] = useState([])
    const [load,setLoad] = useState(false)
    const [preAttendance,setPreAttendance]  = useState([])
    const [preAttendanceLoad,setPreAttendanceLoad]  = useState(true)
    const [students,setStudents] = useState([])
    useEffect(()=>{
        setLoad(true)
        axios.get(`${API_PORT}/classes`)

        .then((res)=>{
            const filter=res.data.sort((a, b) => a.class - b.class);
            setClass(filter)

            setLoad(false)
        })
        .catch((err)=>{
            console.error(err);
            setLoad(false)
        })

       axios.get(`${API_PORT}/set-attendance`)
        .then((res) => {
          console.log("All attendance data:", res.data);

          // //  Group by student AD, keeping only the latest record
          // const latestByStudent = {};

          // res.data.forEach((record) => {
          //   const existing = latestByStudent[record.ad];
          //   const currentDate = new Date(record.attendanceDate);
          //   if (!existing || currentDate > new Date(existing.attendanceDate)) {
          //     latestByStudent[record.ad] = record;
          //   }
          // });

          // //  Convert object to array
          // const latestRecords = Object.values(latestByStudent);

          setPreAttendance(res.data);
          setPreAttendanceLoad(false);
        })
        .catch((err) => {
          console.error(err);
          setPreAttendanceLoad(false);
        });
        axios.get(`${API_PORT}/students`).then((res)=>{
          setStudents(res.data)
        }).catch((err)=>{
          console.log(err);
          
        })


    },[])
    
    const today = new Date().toISOString().split("T")[0];
    const [date, setDate] = useState(today);

    const [err,setErr] = useState('')
    const [period,setPeriod] = useState('')
    const [more,setMore] = useState('')

    const [time, setTime] = useState('Period');

    useEffect(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Convert to total minutes for easy comparison
      const totalMinutes = hours * 60 + minutes;

// Time Table 
  const period1Start = 450; // 7:30 AM
  const period1End = 490;   // 8:10 AM

  const period2Start = 490; // 8:10 AM
  const period2End = 530;   // 8:50 AM

  const period3Start = 530; // 8:50 AM
  const period3End = 600;   // 10:00 AM

  const period4Start = 600; // 10:00 AM
  const period4End = 640;   // 10:40 AM

  const period5Start = 640; // 10:40 AM
  const period5End = 680;   // 11:20 AM

  const period6Start = 690; // 11:30 AM
  const period6End = 730;   // 12:10 PM

  const period7Start = 730; // 12:10 PM
  const period7End = 770;   // 12:50 PM

  const period8Start = 840; // 2:00 PM
  const period8End = 880;   // 2:40 PM

  const period9Start = 880; // 2:40 PM
  const period9End = 920;   // 3:20 PM

  const period10Start = 920; // 3:20 PM
  const period10End = 970;   // 4:10 PM
// Period-10: 03:20 - 04:10

      
      // Define ranges
      const periodStart = 7 * 60;       // 7:00 AM → 420
      const periodEnd = 16 * 60 + 10;   // 4:10 PM → 970
      const nightStart = 18 * 60;       // 6:00 PM → 1080
      const nightEnd = 20.5 * 60;  //8:30PM
      const zuhrStart = 12.85 * 60       // 12:50PM 600 + 120 (12) +50 = 770
      const zuhrEnd = 14 * 60   
      const FajrStart = 5*60    // 5:00AM 60*5 = 300
      if (totalMinutes >= periodStart && totalMinutes <= periodEnd) {
        if(totalMinutes>=zuhrStart && totalMinutes <=zuhrEnd){
          setTime('Jamath')
          setMore('Zuhr')
        }else{
          setTime('Period');
            if (totalMinutes >= period1Start && totalMinutes < period1End) {
            setPeriod(1);
          } else if (totalMinutes >= period2Start && totalMinutes < period2End) {
            setPeriod(2);
          } else if (totalMinutes >= period3Start && totalMinutes < period3End) {
            setPeriod(3);
          } else if (totalMinutes >= period4Start && totalMinutes < period4End) {
            setPeriod(4);
          } else if (totalMinutes >= period5Start && totalMinutes < period5End) {
            setPeriod(5);
          } else if (totalMinutes >= period6Start && totalMinutes < period6End) {
            setPeriod(6);
          } else if (totalMinutes >= period7Start && totalMinutes < period7End) {
            setPeriod(7);
          } else if (totalMinutes >= period8Start && totalMinutes < period8End) {
            setPeriod(8);
          } else if (totalMinutes >= period9Start && totalMinutes < period9End) {
            setPeriod(9);
          } else if (totalMinutes >= period10Start && totalMinutes < period10End) {
            setPeriod(10);
          } else {
            setPeriod(0); // Outside period times
          }
        }
      } else if (totalMinutes >= nightStart && totalMinutes <= nightEnd) {
        setTime('Night');
      } else {
        if(totalMinutes>=periodEnd && totalMinutes<=nightStart){
          setTime('Jamath')
          setMore('Asr')
        }else if(totalMinutes>=nightEnd && totalMinutes <= FajrStart){
          setTime('Jamath')
          setMore('Isha')
        }else{
          setTime('Jamath');
          setMore('Fajr')
        }
        
      }
    }, []);


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
          disabled
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
          <option value="Period">Period</option>
          {/* <option value="Morning">Morning</option>
          <option value="Noon">After Noon</option> */}
          <option value="Night">Night</option>
          <option value="Jamath">Jamath</option>
          <option value="Minus">Minus</option>
        </select>
      </div>

      {/* Period or More under both (on mobile) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:gap-4">
        {time === "Period" && (
          <select
            value={period}
            onChange={(e) =>{ 
              setPeriod(e.target.value)
              setErr('')
            }}
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
        {time === "Jamath" && (
         <select
         value={more}
         onChange={(e)=>{setMore(e.target.value)}}
         className='border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:outline-none w-full sm:w-auto'
         >
          <option value="Fajr">Fajr</option>
          <option value="Zuhr">Zuhr</option>
          <option value="Asr">Asr</option>
          <option value="Maghrib">Maghrib</option>
          <option value="Isha">Isha</option>
         </select>
        )}
      
      </div>
      {err && (
        <div className="mt-4 flex items-center justify-center">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-md w-full max-w-md animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{err}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  </div>
)}

    

            { time==="Minus" ? <App students={students}/> :
            <>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">{edit?"Update Attendance":""}</h2>
                {load && <AllClassLoad/>}
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
  {classes.map((cls, index) => {
    // Check if attendance already taken
    const alreadyTaken = preAttendance.some((record) => {
      const recordDate = record.attendanceDate 
        ? (typeof record.attendanceDate === 'string' 
            ? record.attendanceDate.split('T')[0] 
            : new Date(record.attendanceDate).toISOString().split('T')[0])
        : null;
      const isSameClassAndDate =
        record.class === cls.class && recordDate === date;

      if (time === "Period") {
        return (
          isSameClassAndDate &&
          record.attendanceTime === "Period" &&
          String(record.period) === String(period)
        );
      } else if (time === "Jamath") {
        return (
          isSameClassAndDate &&
          record.attendanceTime === "Jamath" &&
          record.custom === more
        );
      } else {
        return (
          isSameClassAndDate &&
          record.attendanceTime === time
        );
      }
    });

            return (
      <div
        key={index}
        className={`button-container ${alreadyTaken ? 'opacity-70' : ''}`}
        onClick={() => {
          if (alreadyTaken) return;

          if (edit) {
            navigate(`/edit-attendance/${cls.class}`);
          } else {
            if (time === "Period" && !period) {
              setErr("Select a period");
            } else {
              navigate(
                `/attendance/${cls.class}?date=${date}&time=${time}&period=${period}&more=${more}`
              );
            }
          }
        }}
      >
        <button
          className={`brutalist-button openai button-1 ${alreadyTaken ? 'cursor-not-allowed' : ''}`}
          disabled={alreadyTaken}
        >
          <div className="openai-logo">
            <div className="class-icon">
              {/* Class number in a circle */}
              <div className={`class-number ${alreadyTaken ? 'bg-gray-400 text-gray-600' : 'bg-indigo-600 text-white'}`}>
                {cls.class}
              </div>
            </div>
          </div>
          
          <div className="button-text">
            <span>Class</span>
            <span>{cls.class}</span>
          </div>
          
          {/* Strength info */}
          <div className="strength-info">
            <span className="strength-text">Strength:</span>
            <span className={`strength-count ${alreadyTaken ? 'text-gray-500' : 'text-gray-100'}`}>
              {cls.totalStudents}
            </span>
          </div>
          
          {alreadyTaken && (
            <div className="already-taken">
              <span className="already-text">Already Taken</span>
            </div>
          )}
        </button>
      </div>
    );
        })}

                </div></>}
            </div>
  )
}

export default AllClass