import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  RefreshCcw,
  Loader2,
  Table as TableIcon,
  AlertTriangle,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function SupabaseDashboard() {
  const { theme } = useTheme();
  const [tables, setTables] = useState<string[]>(['students', 'teachers', 'projects', 'skillRequests', 'schools']);
  const [newTableName, setNewTableName] = useState('');
  const [activeTable, setActiveTable] = useState<string>('students');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getAll(activeTable, {
        limit: pageSize,
        offset: page * pageSize,
        sort: { column: 'created_at', ascending: false }
      });
      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data. Check your Supabase configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTable, page]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await supabaseService.updateRecord(activeTable, editingItem.id, formData);
      } else {
        await supabaseService.createRecord(activeTable, formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await supabaseService.deleteRecord(activeTable, id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2 italic uppercase">
            <Database className="text-purple-500" />
            Supabase Engine
          </h1>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
            CRUD Data Explorer | Real-time Integration
          </p>
        </div>

        <div className="flex gap-2">
           <button 
            onClick={fetchData}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
           >
             <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
           </button>
           <button 
            onClick={openCreateModal}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Record
          </button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar items-center">
        {tables.map(table => (
          <div key={table} className="relative group">
            <button
              onClick={() => {
                setActiveTable(table);
                setPage(0);
              }}
              className={cn(
                "px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTable === table 
                  ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20" 
                  : "bg-white/5 border-white/10 opacity-40 hover:opacity-100"
              )}
            >
              <TableIcon size={12} className="inline mr-2" />
              {table}
            </button>
            {tables.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setTables(tables.filter(t => t !== table));
                  if (activeTable === table) setActiveTable(tables[0]);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
              >
                <X size={8} />
              </button>
            )}
          </div>
        ))}
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newTableName && !tables.includes(newTableName)) {
              setTables([...tables, newTableName]);
              setActiveTable(newTableName);
              setNewTableName('');
            }
          }}
          className="flex items-center gap-2 ml-4"
        >
          <input 
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
            placeholder="Add table name..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] focus:outline-none w-32"
          />
          <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
            <Plus size={14} />
          </button>
        </form>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 items-start">
           <AlertTriangle className="text-red-500 shrink-0" />
           <div>
             <p className="text-sm font-bold text-red-500 mb-1">Configuration Error</p>
             <p className="text-xs opacity-60 leading-relaxed max-w-lg">{error}</p>
             <div className="mt-4 flex gap-4">
               <code className="text-[10px] bg-black/40 px-2 py-1 rounded">VITE_SUPABASE_URL</code>
               <code className="text-[10px] bg-black/40 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code>
             </div>
           </div>
        </div>
      )}

      {/* Dynamic Data Table */}
      <div className={cn(
        "glass-card border overflow-hidden",
        theme === 'dark' ? "border-white/10 bg-white/[0.02]" : "bg-white border-slate-200"
      )}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-64">
              <Search className="w-4 h-4 text-white/40" />
              <input 
                placeholder={`Search ${activeTable}...`}
                className="bg-transparent border-none text-xs focus:outline-none w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white/5 disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Page {page + 1}</span>
              <button 
                onClick={() => setPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white/5 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                {data.length > 0 && Object.keys(data[0]).map(key => (
                  <th key={key} className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={10} className="p-20 text-center">
                      <Loader2 className="animate-spin inline-block text-purple-500 mb-4" size={32} />
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Loading Galactic Records...</p>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-20 text-center opacity-40 italic">
                    No records found in {activeTable}.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={row.id || i} className="border-b border-white/5 group hover:bg-white/[0.01] transition-colors">
                    {Object.keys(row).map(key => (
                      <td key={key} className="p-6 text-xs font-medium whitespace-nowrap">
                        {typeof row[key] === 'object' ? JSON.stringify(row[key]).slice(0, 20) + '...' : String(row[key])}
                      </td>
                    ))}
                    <td className="p-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => openEditModal(row)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                         >
                           <Edit2 size={14} />
                         </button>
                         <button 
                          onClick={() => handleDelete(row.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreateOrUpdate}
              className={cn(
                "relative w-full max-w-lg glass-card p-8 border",
                theme === 'dark' ? "border-white/10 bg-black" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  {editingItem ? 'UPDATE' : 'CREATE'} {activeTable.slice(0, -1)}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Dynamically build form based on first item if editing, or standard fields if new */}
                {(editingItem ? Object.keys(editingItem) : ['name', 'description']).map(key => {
                  if (key === 'id' || key === 'created_at' || key === 'updated_at') return null;
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">{key.replace(/_/g, ' ')}</label>
                      <input 
                        required 
                        type="text"
                        value={formData[key] || ''}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50 text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              <button className="w-full mt-8 py-4 rounded-xl bg-purple-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                {editingItem ? 'Update Record' : 'Create Record'}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
