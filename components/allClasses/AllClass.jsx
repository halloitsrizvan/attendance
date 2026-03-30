"use client";

import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useRouter } from "next/navigation";
import AllClassLoad from '../load-UI/AllClassLoad';
import { API_PORT } from '../../Constants';
import App from './App';
function AllClass({edit,id}) {

    const navigate = useRouter()
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
    <form className="bg-white p-6 rounded-2xl shadow-sm border border-sky-100 w-full max-w-2xl">
      <div className="flex flex-row gap-3">
        {/* Date */}
        <input
          type="date"
          value={date}
          disabled
          onChange={(e) => setDate(e.target.value)}
          onFocus={(e) => e.target.showPicker && e.target.showPicker()}
          className="flex-1 border border-sky-100 bg-sky-50/30 rounded-xl px-3 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all outline-none"
        />

        {/* Time */}
        <select
          value={time}
          onChange={(e) => {
            setTime(e.target.value)
            if(e.target.value!=="Period"){
              setPeriod('')
            }

          }}
          className="flex-1 border border-sky-100 bg-sky-50/30 rounded-xl px-3 py-3 text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 focus:outline-none transition-all"
        >
          <option value="Period">Period</option>
          <option value="Night">Night</option>
          <option value="Jamath">Jamath</option>
          <option value="Minus">Minus</option>
        </select>
      </div>

      {/* Period or More under both (on mobile) */}
      <div className="mt-4 flex flex-col sm:flex-row sm:gap-4">
        {time === "Period" && (
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Period</label>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 pb-2">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPeriod(i + 1);
                    setErr('');
                  }}
                  className={`h-11 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-200 ${
                    String(period) === String(i + 1)
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-105'
                      : 'bg-white border-2 border-slate-50 text-slate-400 hover:border-sky-100 hover:bg-sky-50/50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {time === "More" && (
          <div className="flex items-center gap-3 flex-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Info</label>
            <input
              value={more}
              onChange={(e) => setMore(e.target.value)}
              placeholder="Enter more info"
              className="flex-1 border border-sky-100 bg-sky-50/30 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-400 focus:outline-none transition-all"
            />
          </div>
        )}
        {time === "Jamath" && (
          <div className="flex flex-col gap-2 w-full">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Time</label>
             <div className="flex flex-wrap gap-2 pb-2">
               {['Fajr', 'Zuhr', 'Asr', 'Maghrib', 'Isha'].map((jamath) => (
                 <button
                   key={jamath}
                   type="button"
                   onClick={() => setMore(jamath)}
                   className={`flex-1 min-w-[30%] px-2 h-11 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                     more === jamath
                       ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 scale-105'
                       : 'bg-white border-2 border-slate-50 text-slate-400 hover:border-sky-100 hover:bg-sky-50/50'
                   }`}
                 >
                   {jamath}
                 </button>
               ))}
             </div>
          </div>
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
            {edit && (
              <div className="flex justify-center mb-6">
                <span className="px-4 py-1.5 bg-sky-50 text-sky-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-100 shadow-sm">
                  Update Attendance
                </span>
              </div>
            )}
                {load && <AllClassLoad/>}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-6">
  {classes.map((cls, index) => {
    // Check if attendance already taken
    const alreadyTaken = preAttendance.some((record) => {
      const recordDate = record.attendanceDate 
        ? (typeof record.attendanceDate === 'string' 
            ? record.attendanceDate.split('T')[0] 
            : new Date(record.attendanceDate).toISOString().split('T')[0])
        : null;
      
      // Use classNumber from our new relational model
      const isSameClassAndDate =
        (record.classNumber === cls.class || record.class === cls.class) && recordDate === date;

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
                onClick={() => {
                  if (alreadyTaken) return;
                  if (edit) {
                    navigate.push(`/edit-attendance/${cls.class}`);
                  } else {
                    if (time === "Period" && !period) {
                      setErr("Select a period");
                    } else {
                      navigate.push(
                        `/attendance/${cls.class}?date=${date}&time=${time}&period=${period}&more=${more}`
                      );
                    }
                  }
                }}
                className={`relative group cursor-pointer transition-all duration-300 ${alreadyTaken ? 'opacity-60 grayscale-[0.5]' : 'hover:-translate-y-1'}`}
              >
                <div className={`relative h-full p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center ${
                  alreadyTaken 
                    ? 'bg-slate-50/80 border-slate-200 cursor-not-allowed shadow-none' 
                    : 'bg-white border-sky-50 shadow-sm hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black mb-2 transition-all ${
                    alreadyTaken ? 'bg-slate-200 text-slate-400' : 'bg-sky-500 text-white shadow-md shadow-sky-500/20 group-hover:scale-110'
                  }`}>
                    {cls.class}
                    {alreadyTaken && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <h3 className={`font-extrabold text-sm ${alreadyTaken ? 'text-slate-400' : 'text-slate-900'}`}>
                      Class {cls.class}
                    </h3>
                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${alreadyTaken ? 'text-slate-300' : 'text-slate-400'}`}>
                      {cls.totalStudents || cls.students_count || 0} Studs
                    </p>
                  </div>

                  {!alreadyTaken && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  )}

                  {alreadyTaken && (
                    <div className="mt-2 w-full">
                      <div className="bg-emerald-50 py-0.5 rounded-full border border-emerald-100 flex items-center justify-center gap-1">
                        <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Completed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
        })}

                </div></>}
            </div>
  )
}

export default AllClass
