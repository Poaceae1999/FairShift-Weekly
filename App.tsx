
import React, { useState, useEffect, useCallback } from 'react';
import { Role, Staff, ScheduleState, GenerationStatus } from './types';
import Configuration from './components/Configuration';
import ScheduleGrid from './components/ScheduleGrid';
import StatsPanel from './components/StatsPanel';
import { generateScheduleAlgorithmic } from './services/geminiService';
import { Sparkles, LayoutGrid, CalendarRange, Download, Printer, Undo2, Redo2, Save } from 'lucide-react';
import { cn, ROLE_COLORS } from './utils';

const App: React.FC = () => {
  // Initial Configuration Data
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Paper', requiredCount: 1, color: ROLE_COLORS[0] },
    { id: '2', name: 'Progress report', requiredCount: 2, color: ROLE_COLORS[1] },
  ]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [weeks, setWeeks] = useState(4);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [activeTab, setActiveTab] = useState<'config' | 'schedule'>('config');

  // History Management for Undo/Redo
  // We store the entire ScheduleState in history
  const [history, setHistory] = useState<ScheduleState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Helper to get current state
  const currentState = historyIndex >= 0 ? history[historyIndex] : null;

  // Function to push new state to history
  const pushState = useCallback((newState: ScheduleState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(prev => prev - 1);
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(prev => prev + 1);
  };

  const handleGenerate = async () => {
    setStatus(GenerationStatus.GENERATING);
    try {
      const { assignments, weekDates } = await generateScheduleAlgorithmic({ roles, staff, weeks, startDate });
      const newState: ScheduleState = {
        weeks,
        weekDates,
        roles,
        staff,
        assignments
      };
      
      // Reset history on new generation
      setHistory([newState]);
      setHistoryIndex(0);
      
      setStatus(GenerationStatus.SUCCESS);
      setActiveTab('schedule');
    } catch (err) {
      console.error(err);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // 1. Individual Slot Update (Dropdown/Selection)
  const handleUpdateAssignment = (assignmentId: string, newStaffId: string | null) => {
    if (!currentState) return;
    const updatedAssignments = currentState.assignments.map(a => 
      a.id === assignmentId ? { ...a, staffId: newStaffId } : a
    );
    pushState({ ...currentState, assignments: updatedAssignments });
  };

  // 2. Date Update
  const handleUpdateDate = (weekIdx: number, newDate: string) => {
    if (!currentState) return;
    const newDates = [...currentState.weekDates];
    newDates[weekIdx] = newDate;
    pushState({ ...currentState, weekDates: newDates });
  };

  // 3. Drag & Drop: Swap Two Assignments (Individual Shift Swap)
  const handleSwapAssignments = (assignmentId1: string, assignmentId2: string) => {
    if (!currentState) return;
    
    const assignments = [...currentState.assignments];
    const idx1 = assignments.findIndex(a => a.id === assignmentId1);
    const idx2 = assignments.findIndex(a => a.id === assignmentId2);

    if (idx1 === -1 || idx2 === -1) return;

    // Swap staffIds
    const tempStaff = assignments[idx1].staffId;
    assignments[idx1] = { ...assignments[idx1], staffId: assignments[idx2].staffId };
    assignments[idx2] = { ...assignments[idx2], staffId: tempStaff };

    pushState({ ...currentState, assignments });
  };

  // 4. Drag & Drop: Swap Two Staff Members (Global Swap)
  const handleSwapStaff = (staffId1: string, staffId2: string) => {
    if (!currentState) return;

    const newAssignments = currentState.assignments.map(assignment => {
      if (assignment.staffId === staffId1) {
        return { ...assignment, staffId: staffId2 };
      }
      if (assignment.staffId === staffId2) {
        return { ...assignment, staffId: staffId1 };
      }
      return assignment;
    });

    pushState({ ...currentState, assignments: newAssignments });
  };

  // Setup Key listeners for Ctrl+Z (Optional enhancement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 print:bg-white print:h-auto">
      {/* Navbar */}
      <header className="bg-white shadow-sm z-30 sticky top-0 border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              FairShift <span className="font-light text-slate-400">Weekly</span>
            </h1>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Undo/Redo Controls (Only visible in Schedule mode) */}
            {activeTab === 'schedule' && (
              <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                <button 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0}
                  className="p-1.5 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-700"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={18} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button 
                  onClick={handleRedo} 
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-700"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 size={18} />
                </button>
              </div>
            )}

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('config')}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === 'config' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutGrid size={16} /> Setup
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                disabled={!currentState}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === 'schedule' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700",
                  !currentState && "opacity-50 cursor-not-allowed"
                )}
              >
                <CalendarRange size={16} /> Schedule
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:w-full print:max-w-none print:block">
        
        {activeTab === 'config' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Weekly Rota Generator</h2>
              <p className="text-slate-500 max-w-lg mx-auto">
                Configure your weekly roles and staff pool. Our algorithm will instantly create a fair distribution of shifts.
              </p>
            </div>
            <Configuration 
              roles={roles} 
              setRoles={setRoles}
              staff={staff}
              setStaff={setStaff}
              weeks={weeks}
              setWeeks={setWeeks}
              startDate={startDate}
              setStartDate={setStartDate}
              onGenerate={handleGenerate}
              isGenerating={status === GenerationStatus.GENERATING}
            />
          </div>
        )}

        {activeTab === 'schedule' && currentState && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[calc(100vh-8rem)] animate-in fade-in duration-500 print:block print:h-auto">
            <div className="h-full overflow-hidden flex flex-col gap-4 print:h-auto print:overflow-visible print:block">
               <ScheduleGrid 
                 schedule={currentState} 
                 onUpdateAssignment={handleUpdateAssignment}
                 onUpdateDate={handleUpdateDate}
                 onSwapAssignments={handleSwapAssignments}
               />
            </div>
            <div className="h-full overflow-y-auto flex flex-col gap-4 print:hidden">
              <StatsPanel 
                schedule={currentState} 
                onSwapStaff={handleSwapStaff}
              />
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Print Schedule
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Print the schedule or save as PDF via your browser's print dialog.
                </p>
                <button 
                  onClick={() => window.print()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
