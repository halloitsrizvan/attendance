"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, 
  X, Check, AlertCircle, Filter, 
  MoreVertical, ChevronRight, ChevronLeft, 
  Hash, BookOpen, Key, Calendar, 
  ArrowUpDown, FileSpreadsheet, Upload, Download
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_PORT } from '../../Constants';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClass, setFilteredClass] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formType, setFormType] = useState('Add'); // 'Add' or 'Edit'
  const [formData, setFormData] = useState({
    ["FULL NAME"]: '',
    ["SHORT NAME"]: '',
    SL: '',
    ADNO: '',
    CLASS: '',
    Password: '',
    onLeave: false,
    active: true
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Import Preview states
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_PORT}/students?includeInactive=true`);
      setStudents(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormType('Add');
    setFormData({
      ["FULL NAME"]: '',
      ["SHORT NAME"]: '',
      SL: '',
      ADNO: '',
      CLASS: '',
      Password: '',
      onLeave: false,
      active: true
    });
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setFormType('Edit');
    setSelectedStudent(student);
    setFormData({
      ["FULL NAME"]: student["FULL NAME"] || '',
      ["SHORT NAME"]: student["SHORT NAME"] || '',
      SL: student.SL || '',
      ADNO: student.ADNO || '',
      CLASS: student.CLASS || '',
      Password: student.Password || '',
      onLeave: student.onLeave || false,
      active: student.active !== false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${API_PORT}/students/${id}`);
      setStudents(students.filter(s => s._id !== id));
      setIsDeleting(false);
    } catch (err) {
      alert('Failed to delete student.');
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formType === 'Add') {
        const response = await axios.post(`${API_PORT}/students`, formData);
        setStudents([...students, response.data]);
      } else {
        const response = await axios.patch(`${API_PORT}/students/${selectedStudent._id}`, formData);
        setStudents(students.map(s => s._id === selectedStudent._id ? response.data : s));
      }
      setIsModalOpen(false);
      setLoading(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed.');
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        (student["FULL NAME"] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.ADNO).includes(searchTerm);
      
      const matchesClass = filteredClass === 'All' || String(student.CLASS) === String(filteredClass);
      
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, filteredClass]);

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.CLASS))];
    return classes.sort((a, b) => a - b);
  }, [students]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const resetSearch = () => {
    setSearchTerm('');
    setFilteredClass('All');
    setCurrentPage(1);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        SL: 1,
        ADNO: 101,
        "FULL NAME": "John Doe",
        "SHORT NAME": "John",
        CLASS: 1,
        Password_PIN: 1234,
        onLeave: "false",
        active: "true"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const bstr = event.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel file is empty");
          setLoading(false);
          return;
        }

        // Map data to ensure field names match expected format
        const formattedData = data.map(item => ({
          SL: item.SL || '',
          ADNO: item.ADNO || '',
          "FULL NAME": item["FULL NAME"] || item.FullName || '',
          "SHORT NAME": item["SHORT NAME"] || item.ShortName || '',
          CLASS: item.CLASS || item.Class || '',
          Password_PIN: item.Password_PIN || item.Password || item.PIN || '1234',
          onLeave: item.onLeave === 'true' || item.onLeave === true,
          active: item.active === undefined ? true : (item.active === 'true' || item.active === true)
        }));

        setImportPreviewData(formattedData);
        setIsImportPreviewOpen(true);
        setLoading(false);
      } catch (err) {
        console.error("Import Error:", err);
        alert("Failed to read excel file.");
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input
  };

  const handleUpdatePreviewItem = (index, field, value) => {
    const newData = [...importPreviewData];
    newData[index][field] = value;
    setImportPreviewData(newData);
  };

  const handleConfirmImport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_PORT}/students/bulk-import`, { students: importPreviewData });
      alert(`Successfully synced ${response.data.upsertedCount + response.data.modifiedCount} students!`);
      setIsImportPreviewOpen(false);
      setImportPreviewData([]);
      fetchStudents();
    } catch (err) {
      alert("Sync failed. Check your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 p-4 sm:p-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 flex items-center justify-center rounded-2xl shadow-inner">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Manage your student records ({filteredStudents.length})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              onClick={handleDownloadTemplate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all border border-emerald-100"
            >
              <Download size={16} /> Template
            </button>
            <div className="relative flex-1 sm:flex-none">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <button className="w-full flex items-center justify-center gap-2 bg-sky-50 text-sky-600 hover:bg-sky-100 font-bold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all border border-sky-100">
                <Upload size={16} /> Import Excel
              </button>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-widest py-3 px-6 rounded-2xl shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 active:scale-95"
            >
              <UserPlus size={18} /> Add Student
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or Admission No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-44">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
              <select
                value={filteredClass}
                onChange={(e) => setFilteredClass(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:border-emerald-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Classes</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            { (searchTerm || filteredClass !== 'All') && (
              <button 
                onClick={resetSearch}
                className="p-4 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white shadow-sm border border-slate-100 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl shrink-0"></div>
                    <div className="h-12 bg-slate-50 rounded-xl flex-1"></div>
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-3xl mx-auto">
                  <Search size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found matching your criteria.</p>
              </div>
            ) : (
              <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    <th className="p-6 text-center w-20">SL</th>
                    <th className="p-6">ADNO</th>
                    <th className="p-6">Student Name</th>
                    <th className="p-6 text-center">Class</th>
                    <th className="p-6 text-center">Leave Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentStudents.map((student) => (
                    <tr key={student._id} className="group hover:bg-slate-50/30 transition-all duration-200">
                      <td className="p-6 text-center font-bold text-slate-400 text-xs">
                        {student.SL || '—'}
                      </td>
                      <td className="p-6">
                        <span className="inline-flex bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black">
                          {student.ADNO}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-sky-600 transition-colors">
                            {student["FULL NAME"]}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            {student["SHORT NAME"] || student["FULL NAME"]?.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className="inline-flex bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-xs font-black ring-1 ring-emerald-100">
                          Class {student.CLASS}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {student.active === false ? (
                            <span className="inline-flex bg-slate-100 text-slate-400 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                              Inactive
                            </span>
                          ) : student.onLeave ? (
                            <span className="inline-flex bg-rose-50 text-rose-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100">
                              On Leave
                            </span>
                          ) : (
                            <span className="inline-flex bg-emerald-50 text-emerald-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                              Present
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(student)}
                            className="p-2 text-sky-500 hover:text-white bg-sky-50 hover:bg-sky-500 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student._id)}
                            className="p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {currentStudents.map((student) => (
                <div key={student._id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 flex items-center justify-center rounded-xl font-black text-xs">
                        {student.ADNO}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 tracking-tight leading-tight">{student["FULL NAME"]}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Class {student.CLASS} • SL {student.SL}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(student)}
                        className="p-2.5 text-sky-500 bg-sky-50 rounded-xl"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student._id)}
                        className="p-2.5 text-rose-500 bg-rose-50 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status:</span>
                       {student.active === false ? (
                          <span className="inline-flex bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                            Inactive
                          </span>
                        ) : student.onLeave ? (
                          <span className="inline-flex bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex bg-emerald-50 text-emerald-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            Present
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredStudents.length)} of {filteredStudents.length}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${
                      currentPage === i + 1 
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' 
                        : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Import Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !loading && setIsImportPreviewOpen(false)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-500 p-8 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Review Import Data</h2>
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">
                      {importPreviewData.length} records found • Editable Preview
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsImportPreviewOpen(false)}
                  disabled={loading}
                  className="text-white/60 hover:text-white transition-all bg-white/10 p-2 rounded-xl"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
              <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-slate-100 shadow-sm z-10">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="p-4 w-16 text-center">SL</th>
                      <th className="p-4 w-28">ADNO</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Short Name</th>
                      <th className="p-4 w-24 text-center">Class</th>
                      <th className="p-4 w-32">PIN</th>
                      <th className="p-4 w-24 text-center">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {importPreviewData.map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-2">
                          <input 
                            type="number"
                            value={student.SL}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'SL', e.target.value)}
                            className="w-full bg-transparent p-2 text-xs font-bold text-slate-400 text-center focus:bg-white rounded-lg outline-none border-b border-transparent focus:border-emerald-300"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            value={student.ADNO}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'ADNO', e.target.value)}
                            className="w-full bg-slate-50/50 p-2 text-xs font-black text-sky-600 focus:bg-white rounded-lg outline-none border border-slate-100 focus:border-sky-300"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text"
                            value={student["FULL NAME"]}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'FULL NAME', e.target.value)}
                            className="w-full bg-transparent p-2 text-sm font-bold text-slate-700 focus:bg-white rounded-lg outline-none border-b border-transparent focus:border-emerald-300"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text"
                            value={student["SHORT NAME"]}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'SHORT NAME', e.target.value)}
                            className="w-full bg-transparent p-2 text-xs font-bold text-slate-500 focus:bg-white rounded-lg outline-none border-b border-transparent focus:border-emerald-300"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            value={student.CLASS}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'CLASS', e.target.value)}
                            className="w-full bg-emerald-50/50 p-2 text-xs font-black text-emerald-600 text-center focus:bg-white rounded-lg outline-none border border-emerald-100 focus:border-emerald-300"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number"
                            value={student.Password_PIN}
                            onChange={(e) => handleUpdatePreviewItem(idx, 'Password_PIN', e.target.value)}
                            className="w-full bg-transparent p-2 text-xs font-mono font-bold text-violet-500 focus:bg-white rounded-lg outline-none border-b border-transparent focus:border-violet-300"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleUpdatePreviewItem(idx, 'active', !student.active)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${student.active ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}
                          >
                            {student.active ? 'Yes' : 'No'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Please verify ADNO before syncing. Existing ADNOs will be updated.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsImportPreviewOpen(false)}
                  disabled={loading}
                  className="px-10 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Check size={20} />
                  )}
                  Confirm & Sync to Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-sky-500 p-8 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{formType} Student</h2>
                  <p className="text-sky-100 text-xs font-bold uppercase tracking-widest mt-1">Student identity details</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-all bg-white/10 p-2 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <Users size={14} className="text-sky-500" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData["FULL NAME"]}
                    onChange={e => setFormData({...formData, ["FULL NAME"]: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    Short Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData["SHORT NAME"]}
                    onChange={e => setFormData({...formData, ["SHORT NAME"]: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-sky-400 focus:bg-white outline-none transition-all"
                    placeholder="E.g. Shamil"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <Hash size={14} className="text-emerald-500" /> Admission No (ADNO)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.ADNO}
                    onChange={e => setFormData({...formData, ADNO: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-emerald-400 focus:bg-white outline-none transition-all"
                    placeholder="E.g. 450"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <BookOpen size={14} className="text-amber-500" /> Class
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.CLASS}
                    onChange={e => setFormData({...formData, CLASS: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-amber-400 focus:bg-white outline-none transition-all"
                    placeholder="E.g. 1"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    Serial No (SL)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.SL}
                    onChange={e => setFormData({...formData, SL: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-slate-400 focus:bg-white outline-none transition-all"
                    placeholder="E.g. 1"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                    <Key size={14} className="text-violet-500" /> Password (PIN)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.Password}
                    onChange={e => setFormData({...formData, Password: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-violet-400 focus:bg-white outline-none transition-all"
                    placeholder="4-digit PIN"
                  />
                </div>

                <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Active Status</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active students show in all lists</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, active: !formData.active})}
                      className={`w-14 h-8 rounded-full transition-all relative ${formData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.active ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-black text-slate-600 uppercase tracking-widest">On Leave</span>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, onLeave: !formData.onLeave})}
                      className={`w-14 h-8 rounded-full transition-all relative ${formData.onLeave ? 'bg-rose-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.onLeave ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
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
                  {loading ? 'Saving...' : `${formType} Student`}
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

export default StudentManagement;
