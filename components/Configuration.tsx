
import React, { useState } from 'react';
import { Plus, Trash2, Users, Briefcase, Calendar, Play } from 'lucide-react';
import { Role, Staff } from '../types';
import { generateId, ROLE_COLORS, cn } from '../utils';

interface ConfigurationProps {
  roles: Role[];
  setRoles: (roles: Role[]) => void;
  staff: Staff[];
  setStaff: (staff: Staff[]) => void;
  weeks: number;
  setWeeks: (w: number) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const Configuration: React.FC<ConfigurationProps> = ({
  roles, setRoles, staff, setStaff, weeks, setWeeks, startDate, setStartDate, onGenerate, isGenerating
}) => {
  const [newStaffName, setNewStaffName] = useState('');

  const addRole = () => {
    const color = ROLE_COLORS[roles.length % ROLE_COLORS.length];
    setRoles([...roles, { id: generateId(), name: `Position ${roles.length + 1}`, requiredCount: 1, color }]);
  };

  const updateRole = (id: string, field: keyof Role, value: any) => {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
  };

  const addStaff = () => {
    if (!newStaffName.trim()) return;
    
    const names = newStaffName.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) return;

    const newStaffMembers = names.map(name => ({
      id: generateId(),
      name
    }));

    setStaff([...staff, ...newStaffMembers]);
    setNewStaffName('');
  };

  const removeStaff = (id: string) => {
    setStaff(staff.filter(s => s.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addStaff();
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setWeeks(val);
    } else if (e.target.value === '') {
      // Allow empty temporarily while typing
      setWeeks(0);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Settings Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Time Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Start Date (Week 1)</label>
            <input 
              type="date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Number of Weeks</label>
            <input 
              type="number" 
              min="1" 
              max="52" 
              value={weeks || ''} 
              onChange={handleWeekChange}
              onBlur={() => weeks === 0 && setWeeks(1)}
              className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
            />
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Positions (N)</h2>
          </div>
          <button 
            onClick={addRole}
            className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Position
          </button>
        </div>
        
        <div className="space-y-3">
          {roles.map((role, idx) => (
            <div key={role.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group border border-slate-100">
              <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", role.color.split(' ')[0])} />
              <input 
                type="text" 
                value={role.name} 
                onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium placeholder-slate-400"
                placeholder="Role Name"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase tracking-wide">Count (n{idx + 1}):</span>
                <input 
                  type="number" 
                  min="1" 
                  value={role.requiredCount} 
                  onChange={(e) => updateRole(role.id, 'requiredCount', parseInt(e.target.value) || 1)}
                  className="w-16 p-1 text-center bg-white border border-slate-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button 
                onClick={() => removeRole(role.id)} 
                className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {roles.length === 0 && <p className="text-sm text-slate-400 italic">No roles defined.</p>}
        </div>
      </section>

      {/* Staff Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Staff Pool</h2>
        </div>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter staff names (comma separated)..."
            className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
          />
          <button 
            onClick={addStaff}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {staff.map((person) => (
            <span key={person.id} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm border border-indigo-100">
              {person.name}
              <button onClick={() => removeStaff(person.id)} className="hover:text-red-500 ml-1">
                <times className="w-4 h-4 leading-none">&times;</times>
              </button>
            </span>
          ))}
          {staff.length === 0 && <p className="text-sm text-slate-400 italic">No staff added.</p>}
        </div>
      </section>

      {/* Action */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || roles.length === 0 || staff.length === 0}
        className={cn(
          "w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2",
          isGenerating ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        )}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating Schedule...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
             Generate Schedule
          </>
        )}
      </button>

    </div>
  );
};

export default Configuration;
