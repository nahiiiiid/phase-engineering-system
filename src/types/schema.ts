import type { Priority, WorkStatus } from "../config/appConfig";

export type Employee = {
  id: string;          // internal id (stable key)
  name: string;
  employeeId: string;  // human id
  designation: string;
  accessCode: number;  // login code
};

export type Assignment = {
  id: string;
  sn: number;
  dateAssigned: string; // yyyy-mm-dd

  employeeId: string;   // internal employee id
  employeeName: string; // snapshot for display
  employeeHumanId: string;
  designation: string;

  taskType: string;
  project: string;
  taskDetails: string;
  deadline: string;     // yyyy-mm-dd
  priority: Priority;

  workStatus: WorkStatus;
  employeeRemarks: string;
  lastUpdateAt: string | null; // ISO
  ceoComment: string;
  doneDate: string | null;     // yyyy-mm-dd

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type AppDataV2 = {
  schemaVersion: 2;
  updatedAt: string;
  employees: Employee[];
  assignments: Assignment[];
  masterData: {
    taskTypes: string[];
    projects: string[];
    priorities: Priority[];
    statuses: WorkStatus[];
  };
};

export type AnyAppData = AppDataV2;

export type RoleSession = {
  role: "CEO" | "EMPLOYEE";
  employeeId?: string; // internal employee id
  enteredAt: string;   // ISO
};
