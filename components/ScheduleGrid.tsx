
import React, { useState, useMemo } from 'react';
import { ScheduleState } from '../types';
import { cn, formatDateWithDay } from '../utils';
import { UserMinus, Calendar as CalendarIcon, ArrowLeftRight, Sparkles } from 'lucide-react';

interface ScheduleGridProps {
  schedule: ScheduleState;
  onUpdateAssignment: (assignmentId: string, newStaffId: string | null) => void;
  onUpdateDate: (weekIdx: number, newDate: string) => void;
  onSwapAssignments: (id1: string, id2: string) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, onUpdateAssignment, onUpdateDate, onSwapAssignments }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [dragOverAssignmentId, setDragOverAssignmentId] = useState<string | null>(null);

  const handleSlotClick = (assignmentId: string) => {
    setSelectedAssignment(assignmentId === selectedAssignment ? null : assignmentId);
  };

  const handleStaffSelect = (staffId: string | null) => {
    if (selectedAssignment) {
      onUpdateAssignment(selectedAssignment, staffId);
      setSelectedAssignment(null);
    }
  };

  const getStaffName = (id: string | null) => {
    if (!id) return <span className="text-red-400 italic print:text-black print:not-italic">Empty</span>;
    return schedule.staff.find(s => s.id === id)?.name || "Unknown";
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, assignmentId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'SHIFT', id: assignmentId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, assignmentId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverAssignmentId !== assignmentId) {
      setDragOverAssignmentId(assignmentId);
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we are actually leaving the cell (prevent flicker)
    // setDragOverAssignmentId(null); 
    // Simplified: We rely on DragOver updating the ID.
  };

  const handleDrop = (e: React.DragEvent, targetAssignmentId: string) => {
    e.preventDefault();
    setDragOverAssignmentId(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'SHIFT' && data.id !== targetAssignmentId) {
        onSwapAssignments(data.id, targetAssignmentId);
      }
    } catch (err) {
      console.error("Invalid drag data", err);
    }
  };

  const handleDragEnd = () => {
    setDragOverAssignmentId(null);
  };

  // -----------------------------

  // Generate flat list of columns based on roles and their counts
  const columns = useMemo(() => {
    const cols: { roleId: string; roleName: string; slotIdx: number; color: string }[] = [];
    schedule.roles.forEach(role => {
      for (let i = 0; i < role.requiredCount; i++) {
        cols.push({
          roleId: role.id,
          roleName: role.name,
          slotIdx: i,
          color: role.color
        });
      }
    });
    return cols;
  }, [schedule.roles]);

  // Get date range for print header
  const dateRange = useMemo(() => {
    const dates = schedule.weekDates.filter(d => d);
    if (dates.length === 0) return '';
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    return `${firstDate} ~ ${lastDate}`;
  }, [schedule.weekDates]);

  // Get today's date for footer
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full print:border-none print:shadow-none print:h-auto print:overflow-visible print-container">
      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print-header mb-4">
        <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white print-logo">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">FairShift Weekly Schedule</h1>
              <p className="text-sm text-slate-500">Automated Fair Shift Distribution</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-600">Schedule Period</p>
            <p className="text-lg font-bold text-emerald-600">{dateRange}</p>
          </div>
        </div>
        {/* Role Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roles:</span>
          {schedule.roles.map(role => (
            <span key={role.id} className={cn("px-2 py-0.5 rounded text-xs font-medium", role.color)}>
              {role.name} ({role.requiredCount})
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-auto flex-1 print:overflow-visible print:h-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm print:min-w-0 print:table-fixed print-table">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm print:shadow-none print:static">
            <tr>
              <th className="p-4 text-center font-bold text-slate-600 border-b border-r border-slate-200 w-32 bg-slate-50 sticky left-0 z-20 print:static print:w-auto">
                <span className="print:hidden">Week / Date</span>
                <span className="hidden print:inline">Date</span>
              </th>
              {columns.map((col, idx) => (
                <th key={`${col.roleId}-${col.slotIdx}`} className="p-3 text-center font-bold text-slate-700 border-b border-slate-200 min-w-[140px] print:min-w-0">
                  <div className="flex flex-col items-center gap-1">
                     <span className="uppercase tracking-wide text-xs text-slate-400 print:text-slate-700">{col.roleName}</span>
                     <div className={cn("w-2 h-2 rounded-full mb-1 print:hidden", col.color.split(' ')[0])} />
                     <span className="text-xs font-normal border px-1.5 rounded bg-white print:bg-transparent print:border-slate-300">#{col.slotIdx + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: schedule.weeks }).map((_, weekIdx) => {
               const dateStr = schedule.weekDates[weekIdx] || '';
               const displayDate = formatDateWithDay(dateStr);
               
               return (
                <tr key={weekIdx} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent print:break-inside-avoid">
                  <td className="p-4 border-b border-r border-slate-200 font-medium text-slate-700 bg-white sticky left-0 z-10 text-center print:static print:p-2">
                    <div className="flex flex-col items-center group relative cursor-pointer">
                      <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 print:hidden">Week {weekIdx + 1}</span>

                      {/* Date Display */}
                      <div className="flex flex-col items-center">
                        <span className="text-indigo-600 font-bold print:text-slate-800 text-sm whitespace-nowrap">
                          {dateStr}
                        </span>
                        <span className="text-xs text-slate-500 print:text-slate-600 print:font-medium">
                          {displayDate.split('(')[1]?.replace(')', '') || ''}
                        </span>
                      </div>

                      {/* Invisible Date Input Trigger */}
                      <input
                        type="date"
                        value={dateStr}
                        onChange={(e) => onUpdateDate(weekIdx, e.target.value)}
                        onClick={(e) => {
                          if ('showPicker' in e.currentTarget) {
                            try { (e.currentTarget as any).showPicker(); } catch(err) {}
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer print:hidden"
                        title="Click to change date"
                      />
                      <CalendarIcon className="w-3 h-3 text-indigo-400 absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden pointer-events-none" />
                    </div>
                  </td>
                  {columns.map((col) => {
                    const assignment = schedule.assignments.find(
                      a => a.weekIndex === weekIdx && a.roleId === col.roleId && a.slotIndex === col.slotIdx
                    );
                    const isSelected = selectedAssignment === assignment?.id;
                    const isDragOver = dragOverAssignmentId === assignment?.id;

                    return (
                      <td
                        key={`${weekIdx}-${col.roleId}-${col.slotIdx}`}
                        className={cn(
                          "p-2 border-b border-slate-100 transition-colors print:p-1",
                          isDragOver ? "bg-indigo-50" : ""
                        )}
                        onDragOver={(e) => assignment && handleDragOver(e, assignment.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => assignment && handleDrop(e, assignment.id)}
                      >
                        {assignment ? (
                          <div className="relative flex justify-center">
                            <button
                              draggable
                              onDragStart={(e) => handleDragStart(e, assignment.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleSlotClick(assignment.id)}
                              className={cn(
                                "w-full max-w-[180px] text-center px-3 py-2 rounded-lg transition-all border font-medium cursor-grab active:cursor-grabbing",
                                col.color,
                                isSelected ? "ring-2 ring-indigo-500 ring-offset-1 z-10" : "border-transparent hover:border-slate-300 hover:shadow-sm",
                                isDragOver ? "scale-105 shadow-md ring-2 ring-indigo-400 border-indigo-300 opacity-80" : "",
                                "print:border-none print:shadow-none print:p-1 print:text-xs print:rounded print:max-w-none"
                              )}
                            >
                              <span className="print:font-medium">{getStaffName(assignment.staffId)}</span>
                            </button>

                            {/* Popover Menu - Hidden on Print */}
                            {isSelected && (
                              <>
                                <div className="fixed inset-0 z-30 print:hidden" onClick={() => setSelectedAssignment(null)} />
                                <div className="absolute top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-40 p-1 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 print:hidden">
                                  <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assign to:</div>
                                  <button
                                    onClick={() => handleStaffSelect(null)}
                                    className="flex items-center gap-2 text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <UserMinus className="w-3 h-3" /> Clear Slot
                                  </button>
                                  {schedule.staff.map(s => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleStaffSelect(s.id)}
                                      className={cn(
                                        "text-left px-2 py-1.5 text-sm rounded transition-colors",
                                        s.id === assignment.staffId 
                                          ? "bg-indigo-50 text-indigo-700 font-medium" 
                                          : "text-slate-700 hover:bg-slate-100"
                                      )}
                                    >
                                      {s.name}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="h-9 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 print:hidden" />
                        )}
                      </td>
                    );
                  })}
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50 text-xs text-center text-slate-400 border-t border-slate-200 flex justify-center gap-4 print:hidden">
        <span className="flex items-center gap-1"><ArrowLeftRight className="w-3 h-3" /> Drag & Drop names to swap shifts.</span>
        <span>•</span>
        <span>Click any name to reassign manually.</span>
      </div>

      {/* Print Footer - Only visible when printing */}
      <div className="hidden print:block print-footer mt-4 pt-3 border-t border-slate-300">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium">FairShift Weekly</span>
            <span>•</span>
            <span>Fair & Automated Scheduling</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Staff: {schedule.staff.length}</span>
            <span>•</span>
            <span>Weeks: {schedule.weeks}</span>
            <span>•</span>
            <span>Generated: {printDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;
