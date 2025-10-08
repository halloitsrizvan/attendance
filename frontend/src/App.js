import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home' 
import Login from './pages/Login';
import Signup from './pages/Signup'
import Attendance from './pages/Attendance'
import ClassWIsePriv from './pages/ClassWIsePriv';
import TestAtt from './components/attendance/TestAtt';
import EditClassPage from './pages/EditClassPage';
import Editattendance from './pages/EditAttedance'
import AllClassLoad from './components/load-UI/AllClassLoad';
import ReportMain from './pages/ReportMain';
import DailyReport from './components/report/DailyReport';
function App() {
   const [teacher, setTeacher] = useState(localStorage.getItem("teacher"));

  useEffect(() => {
    const handleStorageChange = () => {
      setTeacher(localStorage.getItem("teacher"));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={teacher?<Home/>:<Login/>}/>
          {/* <Route path='/signup' element={<Signup/>}/> */}
          <Route path='/login' element={<Login/>}/>
          <Route path='/attendance/:id' element={teacher?<Attendance/>:<Login/>}/>
         <Route path='/class-wise' element={teacher?<ClassWIsePriv/>:<Login/>}/>
          <Route path='/test' element={teacher?<AllClassLoad/>:<Login/>}/>
          <Route path='/edit-attendance-classes' element={teacher?<EditClassPage/>:<Login/>}/>
          <Route path='/edit-attendance/:id' element={teacher?<Editattendance/>:<Login/>}/>
          <Route path='/report' element={teacher?<ReportMain/>:<Login/>}/>
          <Route path='/monthly-daily-report' element={teacher?<DailyReport/>:<Login/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;