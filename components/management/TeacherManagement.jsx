"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, UserPlus, Search, Edit2, Trash2, 
  X, Check, AlertCircle, Phone, 
  Mail, Key, BookOpen, User, 
  ChevronRight, ChevronLeft, Shield, 
  AtSign
} from 'lucide-react';
import axios from 'axios';
import { API_PORT } from '../../Constants';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formType, setFormType] = useState('Add'); // 'Add' or 'Edit'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    classNum: '',
    role: ['teacher'],
    active: true
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Automatically switch role to class_teacher if classNum is assigned
  useEffect(() => {
    // Check if classNum is set and role doesn't already include class_teacher
    if (formData.classNum && (formData.role.includes('teacher') || formData.role.includes('class_teacher'))) {
      if (!formData.role.includes('class_teacher')) {
        setFormData(prev => ({ 
          ...prev, 
          role: [...prev.role.filter(r => r !== 'teacher'), 'class_teacher'] 
        }));
      }
    } else if (!formData.classNum && formData.role.includes('class_teacher')) {
      // If classNum is cleared, replace class_teacher with teacher if it was the main role
      setFormData(prev => ({ 
        ...prev, 
        role: prev.role.map(r => r === 'class_teacher' ? 'teacher' : r) 
      }));
    }
  }, [formData.classNum]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_PORT}/teachers?includeInactive=true`);
      setTeachers(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load teachers. Please try again.');
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormType('Add');
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      classNum: '',
      role: ['teacher'],
      active: true
    });
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher) => {
    setFormType('Edit');
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '', // Keep password blank for security, only update if entered
      phone: teacher.phone || '',
      classNum: teacher.classNum || '',
      role: Array.isArray(teacher.role) ? teacher.role : [teacher.role || 'teacher'],
      active: teacher.active !== undefined ? teacher.active : true
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher account?')) return;
    
    try {
      await axios.delete(`${API_PORT}/teachers/${id}`);
      setTeachers(teachers.filter(t => t._id !== id));
    } catch (err) {
      alert('Failed to delete teacher.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formType === 'Add') {
        const response = await axios.post(`${API_PORT}/teachers`, formData);
        setTeachers([response.data, ...teachers]);
      } else {
        // Only include password if it's set
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        const response = await axios.patch(`${API_PORT}/teachers/${selectedTeacher._id}`, payload);
        setTeachers(teachers.map(t => t._id === selectedTeacher._id ? response.data : t));
      }
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed.');
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => 
      (teacher.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 flex items-center justify-center rounded-2xl shadow-inner uppercase font-black">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Teacher Management</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Admin control for faculty records ({filteredTeachers.length})
              </p>
            </div>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-widest py-3 px-6 rounded-2xl shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 active:scale-95"
          >
            <UserPlus size={18} /> Register Teacher
          </button>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Teachers List (Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && teachers.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-6 h-48 animate-pulse border border-slate-100">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl"></div>
                  <div className="flex-1 space-y-2 mt-2">
                    <div className="h-4 bg-slate-50 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-10 bg-slate-50 rounded-xl w-full"></div>
              </div>
            ))
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-[2rem] text-center space-y-4 border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl mx-auto">
                <Search size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No teachers found.</p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => (
              <div key={teacher._id} className="relative bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                {/* Accent line based on role */}
                <div className={`absolute top-0 left-0 w-1/4 h-1.5 ${
                  teacher.role?.includes('super_admin') ? 'bg-amber-400' : 'bg-sky-400'
                }`}></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${
                      teacher.role?.includes('super_admin') ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'
                    } flex items-center justify-center rounded-2xl shadow-inner font-black text-lg`}>
                      {teacher.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight">{teacher.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(teacher.role) ? teacher.role.map(r => (
                          <p key={r} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                            {r === 'super_admin' && <Shield size={8} className="text-amber-500" />}
                            {r.replace('_', ' ')}
                          </p>
                        )) : (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                             {teacher.role?.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleOpenEditModal(teacher)}
                      className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-2xl transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(teacher._id)}
                      className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-xl">
                      <AtSign size={14} className="text-slate-400" />
                    </div>
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-xl">
                      <BookOpen size={14} className="text-emerald-400" />
                    </div>
                    <span>{teacher.classNum ? `Class ${teacher.classNum}` : 'General Duty'}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-xl">
                        <Phone size={14} className="text-sky-400" />
                      </div>
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${
                    teacher.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {teacher.active ? 'Account Active' : 'Inactive'}
                  </span>
                  <div className="text-[10px] font-bold text-slate-300">
                    ID: {teacher.tId || teacher._id.slice(-6)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-sky-500 p-8 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{formType} Teacher Account</h2>
                  <p className="text-sky-100 text-xs font-bold uppercase tracking-widest mt-1">Credentials & assignment</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-all bg-white/10 p-2 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                  <User size={14} className="text-sky-500" /> Display Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                  <Mail size={14} className="text-emerald-500" /> Email Address
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-emerald-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <Key size={14} className="text-violet-500" /> {formType === 'Edit' ? 'Reset Password (Optional)' : 'Password'}
                  </label>
                  <input
                    required={formType === 'Add'}
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-violet-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    placeholder="Min 6 characters"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <Phone size={14} className="text-sky-500" /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <BookOpen size={14} className="text-amber-500" /> Class Assigned
                  </label>
                  <input
                    type="number"
                    value={formData.classNum}
                    onChange={e => setFormData({...formData, classNum: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    placeholder="Class No."
                  />
                </div>

                <div className="col-span-full">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest px-1 mb-3">
                    <Shield size={14} className="text-rose-500" /> Professional Roles (Multiple possible)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-3xl border-2 border-slate-50">
                    {[
                      { id: 'teacher', label: 'Teacher' },
                      { id: 'class_teacher', label: 'Class Teacher' },
                      { id: 'HOD', label: 'HOD' },
                      { id: 'HOS', label: 'HOS' },
                      { id: 'Principal', label: 'Principal' },
                      { id: 'super_admin', label: 'Super Admin' }
                    ].map((roleObj) => {
                      const isSelected = formData.role.includes(roleObj.id);
                      return (
                        <button
                          key={roleObj.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              // Don't allow removing all roles
                              if (formData.role.length > 1) {
                                setFormData({ ...formData, role: formData.role.filter(r => r !== roleObj.id) });
                              }
                            } else {
                              setFormData({ ...formData, role: [...formData.role, roleObj.id] });
                            }
                          }}
                          className={`flex items-center justify-center p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
                            isSelected 
                              ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-rose-100'
                          }`}
                        >
                          {isSelected && <Check size={12} className="mr-1.5" />}
                          {roleObj.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mt-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Account is active and permitted to login</span>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, active: !formData.active})}
                  className={`w-14 h-8 rounded-full transition-all relative ${formData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.active ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `${formType} Teacher`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TeacherManagement;
