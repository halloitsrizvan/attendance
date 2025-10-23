import React from 'react'
import { Menu, User, X, CheckCircle, XCircle, Clock, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
function MetricCard({ title, value, subText, color, icon: Icon, onClick }) {
  return (
    <div
    className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer
      ${color === 'green' ? 'bg-green-500/90 hover:bg-green-600/95' :
        color === 'red' ? 'bg-red-500/90 hover:bg-red-600/95' :
        'bg-blue-500/90 hover:bg-blue-600/95'}
      text-white`}
    onClick={onClick}
  >
    <Icon className="w-8 h-8 mb-2" />
    <div className="text-4xl font-extrabold">{value}</div>
    <div className="text-sm font-semibold mt-1 opacity-90">{title}</div>
    {subText && <div className="text-xs mt-1 opacity-80">{subText}</div>}
  </div>
  )
}

export default MetricCard