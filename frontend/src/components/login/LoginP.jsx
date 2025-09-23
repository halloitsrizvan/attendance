import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'
import { EmailIcon, LockIcon } from '../../public/Icons';
import { API_PORT } from '../../Constants';



const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

function LoginP() {
  const navigate = useNavigate()
    const [loginErr,setLoginerr] = useState(null)
    const [load,setLoad]= useState(false)

    const [email,setEmail] =useState('')
    const [password,setPassword] =useState('')

    const handleSumbit = async(e)=>{
      e.preventDefault()
      setLoad(true)
      try{
        const res=await axios.post(`${API_PORT}/teachers/login`,{email,password})
        const { token, teacher } = res.data || {}
        if (token && teacher) {
          localStorage.setItem('token', token)
          localStorage.setItem('teacher', JSON.stringify(teacher))
          navigate('/')
        } else {
          setLoginerr('No token or teacher received from server')
        }
      }catch(err){ 
        const message = err?.response?.data?.error || 'Invalid email or password'
        setLoginerr(message)
      }finally {
        setLoad(false)
      }
    }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 font-sans p-4">
      
     
      <div className="relative mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div className="flex justify-center mb-3">
      <UserIcon className="h-20 w-20 text-blue-600 border-4 rounded-full p-2"/>
    </div>
        <div className="text-center">
          
          <h1 className="text-3xl font-bold text-gray-800">Staff Login</h1>
         
        </div>

        <form  className="mt-8 space-y-5" onSubmit={handleSumbit}>
          {loginErr && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
              {loginErr}
            </div>
          )}

          <div className="relative">
            <EmailIcon />
            <input 
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="name@gmail.com"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <LockIcon />
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-400 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          

          <div>
            <button
              type="submit"
              disabled={load}
              className="w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-transform duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              Login
            </button>
          </div>
        </form>

        {/* <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
              Sign up now
            </Link>
          </p>
        </div> */}
      </div>
    </div>
  )
}

export default LoginP