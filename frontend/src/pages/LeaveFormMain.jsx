import React,{useEffect} from 'react'
import Header from '../components/Header/Header'
import LeaveForm from '../components/leave/LeaveForm'
import FormTest from '../components/leave/FormTest'
import { useNavigate } from 'react-router-dom';
import { API_PORT } from '../Constants';
import axios from 'axios';

function LeaveFormMain() {
 

  return (
    <div>
        <Header/>
        <LeaveForm/>
    </div>
  )
}

export default LeaveFormMain