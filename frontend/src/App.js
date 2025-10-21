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
import ApiRecall from './pages/ApiRecall';
function App() {
   const [teacher, setTeacher] = useState(() => {
     const storedTeacher = localStorage.getItem("teacher");
     return storedTeacher ? JSON.parse(storedTeacher) : null;
   });
   
  useEffect(() => {
    const handleStorageChange = () => {
      const storedTeacher = localStorage.getItem("teacher");
      setTeacher(storedTeacher ? JSON.parse(storedTeacher) : null);
    };

    // Check for changes in localStorage on focus (for same-tab updates)
    const handleFocus = () => {
      const storedTeacher = localStorage.getItem("teacher");
      setTeacher(storedTeacher ? JSON.parse(storedTeacher) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
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
          <Route path='/api-recall/:id' element={teacher?<ApiRecall/>:<Login/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;