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
function App() {
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/signup' element={<Signup/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/attendance/:id' element={<Attendance/>}/>
          <Route path='/class-wise' element={<ClassWIsePriv/>}/>
          <Route path='/test' element={<AllClassLoad/>}/>
          <Route path='/edit-attendance-classes' element={<EditClassPage/>}/>
          <Route path='/edit-attendance/:id' element={<Editattendance/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;