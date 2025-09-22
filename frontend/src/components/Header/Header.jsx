import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const navigate = useNavigate()
    const token = localStorage.getItem("token")
    const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : 'Teacher Panel';
    const username=teacher.name
    const userInitial = username 
    ? username.slice(0, 2).toUpperCase() 
    : '?';

    const handleLogout = ()=>{
      localStorage.removeItem('token')
      localStorage.removeItem('teacher')
      navigate('/login')
    }
  return (
    <>
      <header className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left side: Hamburger (Mobile) & Logo (Desktop) */}
            <div className="flex items-center">
              {/* Hamburger Menu Button (visible on mobile) */}
              <div className="md:hidden mr-4">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-indigo-600 focus:outline-none focus:text-indigo-600"
                  aria-label="Toggle menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Logo (hidden on mobile) */}
              <div className="flex-shrink-0 hidden md:block">
                <a href="#" className="text-2xl font-bold text-indigo-600">
                Attendance
                </a>
              </div>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden md:flex md:items-center md:space-x-8">
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200" onClick={()=>{navigate('/')}}>Home</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"  onClick={()=>{navigate('/class-wise')}}>Latest</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"  onClick={()=>{navigate('/edit-attendance-classes')}}>Edit</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"  onClick={()=>{navigate('/report')}}>Report</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"  onClick={()=>handleLogout()}>Logout</a>
            </nav>

            {/* Right side: User Info */}
            <div className="flex items-center space-x-3">
              <h5 className="text-gray-700 font-medium  sm:block">{username}</h5>
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                {userInitial}
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu (sliding from left) */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5">
            <h2 className="text-xl font-bold text-indigo-600 mb-4"
            onClick={()=>setIsMenuOpen(false)}
            >Menu</h2>
            <nav className="flex flex-col space-y-2">
                <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500 transition-colors duration-200" onClick={()=>{navigate('/')}}>Home</a>
                <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500 transition-colors duration-200"  onClick={()=>{navigate('/class-wise')}}>Latest</a>
                <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500 transition-colors duration-200"  onClick={()=>{navigate('/edit-attendance-classes')}}>Edit</a>
                <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500 transition-colors duration-200"  onClick={()=>{navigate('/report')}}>Report</a>
                {teacher &&<a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500 transition-colors duration-200"  onClick={()=>{handleLogout()}}>Logout</a>}
                
            </nav>
        </div>
      </div>
    </>
  )
}

export default Header