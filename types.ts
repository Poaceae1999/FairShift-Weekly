
export interface Role {
  id: string;
  name: string;
  requiredCount: number; // n1, n2...
  color: string;
}

export interface Staff {
  id: string;
  name: string;
}

export interface ShiftAssignment {
  id: string;
  weekIndex: number; // Which week (0 to N-1)
  roleId: string;
  slotIndex: number; // Which slot within the role (0 to requiredCount-1)
  staffId: string | null;
}

export interface ScheduleState {
  weeks: number;
  weekDates: string[]; // Array of date strings (YYYY-MM-DD)
  roles: Role[];
  staff: Staff[];
  assignments: ShiftAssignment[];
}

export enum GenerationStatus {
  IDLE = 'idle',
  GENERATING = 'generating',
  SUCCESS = 'success',
  ERROR = 'error'
}
