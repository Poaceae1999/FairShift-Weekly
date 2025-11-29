
import { Role, Staff, ShiftAssignment } from "../types";
import { generateId } from "../utils";

interface GenerateScheduleParams {
  roles: Role[];
  staff: Staff[];
  weeks: number;
  startDate: string;
}

interface GenerateResult {
  assignments: ShiftAssignment[];
  weekDates: string[];
}

/**
 * Generates a schedule algorithmically using a greedy strategy for fairness.
 * UPDATED: Now prioritizes role-specific fairness, then global workload fairness.
 */
export const generateScheduleAlgorithmic = async ({
  roles,
  staff,
  weeks,
  startDate
}: GenerateScheduleParams): Promise<GenerateResult> => {
  
  // Simulate async to not block UI (though it's fast)
  await new Promise(resolve => setTimeout(resolve, 300));

  const assignments: ShiftAssignment[] = [];
  const weekDates: string[] = [];

  // Generate dates
  const start = new Date(startDate);
  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + (i * 7));
    weekDates.push(d.toISOString().split('T')[0]);
  }
  
  // Track workload: staffId -> count (Global)
  const globalWorkload = new Map<string, number>();
  
  // Track workload: staffId -> Map<roleId, count> (Specific)
  const roleWorkload = new Map<string, Map<string, number>>();

  // Initialize counters
  staff.forEach(s => {
    globalWorkload.set(s.id, 0);
    roleWorkload.set(s.id, new Map());
    roles.forEach(r => {
      roleWorkload.get(s.id)!.set(r.id, 0);
    });
  });

  for (let w = 0; w < weeks; w++) {
    // Track who is working this week to prevent double booking
    const assignedThisWeek = new Set<string>();

    for (const role of roles) {
      for (let slot = 0; slot < role.requiredCount; slot++) {
        
        // 1. Filter available staff (not working this week yet)
        let candidates = staff.filter(s => !assignedThisWeek.has(s.id));

        // Fallback: If everyone is working this week (not enough staff), allow double booking
        if (candidates.length === 0) {
          candidates = [...staff]; 
        }

        // 2. Sort candidates
        // Priority 1: Who has done THIS SPECIFIC ROLE the least?
        // Priority 2: Who has done the LEAST TOTAL WORK?
        // Priority 3: Random shuffle
        candidates.sort((a, b) => {
          // Check specific role counts
          const roleCountA = roleWorkload.get(a.id)?.get(role.id) || 0;
          const roleCountB = roleWorkload.get(b.id)?.get(role.id) || 0;
          
          if (roleCountA !== roleCountB) {
            return roleCountA - roleCountB;
          }

          // Check global counts
          const globalCountA = globalWorkload.get(a.id) || 0;
          const globalCountB = globalWorkload.get(b.id) || 0;

          if (globalCountA !== globalCountB) {
            return globalCountA - globalCountB;
          }

          // Random tie-breaker
          return Math.random() - 0.5;
        });

        // 3. Pick the best candidate
        const selectedStaff = candidates[0];

        if (selectedStaff) {
          // Update Global Count
          globalWorkload.set(selectedStaff.id, (globalWorkload.get(selectedStaff.id) || 0) + 1);
          
          // Update Specific Role Count
          const userRoleMap = roleWorkload.get(selectedStaff.id)!;
          userRoleMap.set(role.id, (userRoleMap.get(role.id) || 0) + 1);

          assignedThisWeek.add(selectedStaff.id);

          assignments.push({
            id: generateId(),
            weekIndex: w,
            roleId: role.id,
            slotIndex: slot,
            staffId: selectedStaff.id
          });
        } else {
          // Should not happen if staff array is not empty
          assignments.push({
            id: generateId(),
            weekIndex: w,
            roleId: role.id,
            slotIndex: slot,
            staffId: null
          });
        }
      }
    }
  }

  return { assignments, weekDates };
};
