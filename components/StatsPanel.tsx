
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ScheduleState } from '../types';
import { ArrowLeftRight, GripVertical } from 'lucide-react';
import { cn } from '../utils';

interface StatsPanelProps {
  schedule: ScheduleState;
  onSwapStaff?: (staffId1: string, staffId2: string) => void;
}

// Map Tailwind colors to Hex for Recharts
const CHART_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#a855f7', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#f97316', // orange
];

const StatsPanel: React.FC<StatsPanelProps> = ({ schedule, onSwapStaff }) => {
  const [dragOverStaffId, setDragOverStaffId] = useState<string | null>(null);
  
  // Transform data for Stacked Bar Chart
  const data = schedule.staff.map(staff => {
    const entry: any = {
      name: staff.name,
      total: 0
    };

    schedule.roles.forEach(role => {
      const count = schedule.assignments.filter(
        a => a.staffId === staff.id && a.roleId === role.id
      ).length;
      entry[role.id] = count;
      entry.total += count;
    });

    return entry;
  });

  // --- Drag and Drop Logic for Staff Swapping ---
  
  const handleDragStart = (e: React.DragEvent, staffId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'STAFF', id: staffId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, staffId: string) => {
    e.preventDefault();
    if (dragOverStaffId !== staffId) {
      setDragOverStaffId(staffId);
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = () => {
    // setDragOverStaffId(null);
  };

  const handleDrop = (e: React.DragEvent, targetStaffId: string) => {
    e.preventDefault();
    setDragOverStaffId(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'STAFF' && data.id !== targetStaffId && onSwapStaff) {
        onSwapStaff(data.id, targetStaffId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = () => {
    setDragOverStaffId(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
      
      {/* Chart Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Workload Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {schedule.roles.map((role, index) => (
                <Bar 
                  key={role.id} 
                  dataKey={role.id} 
                  name={role.name} 
                  stackId="a" 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                  radius={index === schedule.roles.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  barSize={20}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Staff Swapper Section */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
          Swap All Shifts
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Drag one person onto another to swap their entire schedules.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {schedule.staff.map((s) => (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, s.id)}
              onDrop={(e) => handleDrop(e, s.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-grab active:cursor-grabbing transition-all text-sm hover:shadow-sm hover:border-slate-300",
                dragOverStaffId === s.id ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200" : ""
              )}
            >
              <GripVertical className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700 truncate">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
