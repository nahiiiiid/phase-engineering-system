// import { APP_CONFIG } from "../config/appConfig";
// import type { AppDataV2, Assignment } from "../types/schema";

// function nowIso() { return new Date().toISOString(); }
// function today() { return new Date().toISOString().slice(0, 10); }

// function hydrateSnapshots(a: Assignment, employees: AppDataV2["employees"]): Assignment {
//   const emp = employees.find(e => e.id === a.employeeId);
//   return {
//     ...a,
//     employeeName: emp?.name ?? a.employeeName,
//     employeeHumanId: emp?.employeeId ?? a.employeeHumanId,
//     designation: emp?.designation ?? a.designation,
//   };
// }

// export function makeSeedData(): AppDataV2 {
//   const employees = APP_CONFIG.employees.map(e => ({ ...e }));

//   const assignments: Assignment[] = employees.slice(0, 5).flatMap((e, idx) => {
//     const base = idx * 3;
//     return [0, 1, 2].map(k => ({
//       id: `seed-${e.id}-${k}`,
//       sn: base + k + 1,
//       dateAssigned: today(),
//       employeeId: e.id,
//       employeeName: e.name,
//       employeeHumanId: e.employeeId,
//       designation: e.designation,
//       taskType: APP_CONFIG.taskTypes[(base + k) % APP_CONFIG.taskTypes.length],
//       project: APP_CONFIG.projects[(base + k) % APP_CONFIG.projects.length],
//       taskDetails: `Demo task ${base + k + 1} for ${e.name}. Update progress daily.`,
//       deadline: today(),
//       priority: APP_CONFIG.priorities[(base + k) % APP_CONFIG.priorities.length],
//       workStatus: "NOT_STARTED",
//       employeeRemarks: "",
//       lastUpdateAt: null,
//       ceoComment: "Please update progress daily.",
//       doneDate: null,
//       createdAt: nowIso(),
//       updatedAt: nowIso(),
//     }));
//   }).slice(0, 18).map(a => hydrateSnapshots(a as any, employees));

//   return {
//     schemaVersion: 2,
//     updatedAt: nowIso(),
//     employees,
//     assignments,
//     masterData: {
//       taskTypes: APP_CONFIG.taskTypes.slice(),
//       projects: APP_CONFIG.projects.slice(),
//       priorities: APP_CONFIG.priorities.slice() as any,
//       statuses: APP_CONFIG.statuses.slice() as any,
//     }
//   };
// }


import { APP_CONFIG } from "../config/appConfig";
import type { AppDataV2 } from "../types/schema";

function nowIso() { return new Date().toISOString(); }

export function makeSeedData(): AppDataV2 {
  return {
    schemaVersion: 2,
    updatedAt: nowIso(),
    employees: [], // start with no employees
    assignments: [], // start with no assignments
    masterData: {
      taskTypes: [],
      projects: [],
      priorities: APP_CONFIG.priorities.slice() as any,
      statuses: APP_CONFIG.statuses.slice() as any,
    },
  };
}

