import axios from 'axios';
import React, { useState } from 'react';
import { API_PORT } from '../../Constants';

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Icon for class/school
const SchoolIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="m4 19.5 8-7 8 7" />
    <path d="M6.5 10.5v7m11-7v7" />
    <path d="m2 13.5 10-9 10 9" />
  </svg>
);

// Icon for minus
const MinusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

export default function App({students}) {
  
    const [suggestions, setSuggestions] = useState([]);
    const [ad,setAd] = useState('')
    const [name, setName] = useState('');
    const [classNum, setClassNum] = useState('');
    const [minusCount,setMinusCout] = useState(1/3)
    const [reason,setReason] = useState('Skipping Jamath')
  const [load,setLoad] = useState(false)
   const teacher = localStorage.getItem("teacher") ? JSON.parse(localStorage.getItem("teacher")) : null;

        const handleSubmit = async (e) => {
          e.preventDefault();
          setLoad(true);

          try {
            // Ensure reason has a value, fallback to default if empty
            const finalReason = reason || 'Skipping Jamath';
            
            const payload = { 
              ad, 
              name, 
              classNum, 
              minusNum: minusCount, 
              reason: finalReason, 
              teacher: teacher.name 
            };
            
            console.log('Submitting payload:', payload);
            
            await axios.post(`${API_PORT}/minus`, payload);
            
            // Reset form but keep reason as default
            setAd('');
            setName('');
            setClassNum('');
            setReason('Skipping Jamath'); // Explicitly set default
            
          } catch (error) {
            console.log('Error:', error.response?.data);
            // alert(`Error: ${error.response?.data?.error || 'Something went wrong'}`);
          } finally {
            setLoad(false);
          }
        };

// const suggestionList = [
//   "Absent in class",
//   "Absent in program",
//   "other",
// ];
//     const [filtered, setFiltered] = useState([]);

//    const handleChange = (e) => {
//   const input = e.target.value;
//   setReason(input);

//   if (input.trim() === "") {
//     // Show ALL suggestions when no text entered
//     setFiltered(suggestionList);
//     return;
//   }

//   const results = suggestionList.filter(item =>
//     item.toLowerCase().includes(input.toLowerCase())
//   );
//   setFiltered(results);
// };
//     const selectSuggestion = (val) => {
//       setReason(val);
//       setFiltered([]);
//     };

  return (
    // This outer div centers the form on the page with a new gradient background
   <div className="flex items-center justify-center font-sans mt-16">
  <form 
    onSubmit={handleSubmit} 
    className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6 transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
  >
    {/* Form Title */}
    <h1 className="text-3xl font-bold text-center text-gray-800">
      Student Details
    </h1>
    
    {/* First Row: AD/Name and Class - Always side by side */}
    <div className="flex gap-4">
      
      {/* "Enter AD Or Name" Input Group */}
      <div className="flex-1">
        <label 
          htmlFor="adOrName" 
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Enter AD Or Name
        </label>
        {/* Relative container for icon */}
        <div className="relative">
          <input
            id="ad"
            type="text"
            value={ad}
            onChange={(e) => {
              const value = e.target.value.trim();
              setAd(value);

              if (value === "") {
                setSuggestions([]);
                return;
              }

              // detect if input is number or text
              const isNumber = /^\d+$/.test(value);

              let filtered;
              if (isNumber) {
                // 🔹 Search by AD number
                filtered = students.filter((std) =>
                  String(std.ADNO).startsWith(value)
                );
              } else {
                // 🔹 Search by name (case-insensitive, matches any part of name)
                filtered = students.filter((std) =>
                  std["SHORT NAME"].toLowerCase().includes(value.toLowerCase())
                );
              }

              setSuggestions(filtered.slice(0, 5)); // show top 5 matches
            }}
            placeholder='Enter AD or Name'
            className="w-full pl-10 p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
          {/* Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <UserIcon />
          </div>
          
          {suggestions.length > 0 && (
            <div className="absolute bg-white border border-gray-200 mt-1 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-full">
              {suggestions.map((s) => (
                <div
                  key={s.ADNO}
                  className="px-3 py-2 hover:bg-indigo-100 cursor-pointer text-sm"
                  onClick={() => {
                    setAd(s.ADNO);
                    setName(s["SHORT NAME"]);
                    setClassNum(s.CLASS);
                    setSuggestions([]);
                  }}
                >
                  <span className="font-medium">{s.ADNO}</span> – {s["SHORT NAME"]} – {s.CLASS}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* "Class" Input Group */}
      <div className="w-24"> {/* Fixed width for class input */}
        <label 
          htmlFor="classValue" 
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Class
        </label>
        <div className="relative">
          <input
            id="classNum"
            type="text"
            value={classNum}
            onChange={(e) => setClassNum(e.target.value)}
            disabled
            className="w-full pl-3 p-3 bg-gray-100 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 cursor-not-allowed"
            placeholder="00"
            required
          />
        </div>
      </div>
    </div>

    {/* Second Row: "Name" Input Group */}
    <div>
      <label 
        htmlFor="name" 
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Name
      </label>
      <div className="relative">
        <input
          id="name" 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!!students}
          className="w-full pl-3 p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Student Name"
          required
        />
      </div>
    </div>
     <div>
          <label htmlFor="reason" className="block mb-2 text-sm font-medium text-gray-700">
            Reason
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full pl-3 p-3 bg-gray-50 rounded-lg border border-gray-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-all duration-300"
          >
            <option value="Skipping Jamath">Skipping Jamath</option>
            <option value="Skipping Class">Skipping Class</option>
            <option value="Late coming without permission">Late coming without permission</option>
            <option value="Skipping program">Skipping program</option>
          </select>
        </div>

    {/* Third Row: "Number Of Minus" Input Group */}
    {/* <div>
      <label 
        htmlFor="minusCount" 
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Reason
      </label>
      <div className="relative">
        <input
        type="text"
        id="reason"
        value={reason}
        onChange={handleChange}
        onFocus={() => setFiltered(suggestionList)} 
        placeholder="Reason..."
        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
      />

        {filtered.length > 0 && (
        <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto z-50">
          {filtered.map((item, index) => (
            <li
              key={index}
              onClick={() => selectSuggestion(item)}
              className="p-2 cursor-pointer hover:bg-blue-100"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
        
      </div>
    </div> */}

    {/* Submit Button */}
    <div>
      <button
      type="submit"
      disabled={load}
      className={`w-full p-3 mt-4 text-white text-lg font-bold rounded-lg shadow-md cursor-pointer 
        bg-gradient-to-r from-blue-500 to-purple-600 
        hover:from-blue-600 hover:to-purple-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
        transform hover:scale-105 transition-all duration-300
        ${load && 'opacity-60 cursor-not-allowed hover:scale-100'}
      `}
    >
      {load ? "Submitting..." : "Submit"}
    </button>

    </div>
  </form>
</div>
  );
}

