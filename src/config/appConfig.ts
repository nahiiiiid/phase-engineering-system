export type AppRole = "CEO" | "EMPLOYEE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type Employee = {
  id: string;            // stable id used in data
  name: string;          // display name
  employeeId: string;    // human id
  designation: string;
  accessCode: number;    // numeric code for role entry
};

export type AppConfig = {
  org: {
    name: string;
    tagline: string;
  };
  access: {
    ceoCode: number;
  };
  employees: Employee[];
  taskTypes: string[];
  projects: string[];
  priorities: Priority[];
  statuses: WorkStatus[];
};

export const APP_CONFIG: AppConfig = {
  org: {
    name: "Phase Engineering",
    tagline: "Assignment, Task & Daily Work Monitoring (Frontend-only)",
  },
  access: {
    ceoCode: 12345,
  },
  employees: [
    { id: "emp-nahid", name: "Nahid", employeeId: "20001", designation: "Engineer", accessCode: 20001 },
    { id: "emp-hasan", name: "Hasan", employeeId: "20002", designation: "Engineer", accessCode: 20002 },
    { id: "emp-saikot", name: "Saikot", employeeId: "20003", designation: "Engineer", accessCode: 20003 },
    { id: "emp-asma", name: "Asma Akter", employeeId: "20004", designation: "Engineer", accessCode: 20004 },
    { id: "emp-nayon", name: "Nayon Kumar", employeeId: "20005", designation: "Engineer", accessCode: 20005 },
  ],
  taskTypes: ["Design", "Development", "Testing", "Site Visit", "Documentation", "Client Support"],
  projects: ["Phase Tower", "Road Expansion", "Factory Automation", "Bridge Survey"],
  priorities: ["LOW", "MEDIUM", "HIGH", "URGENT"],
  statuses: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"],
};
