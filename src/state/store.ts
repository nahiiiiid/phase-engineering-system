import { create } from "zustand";
import type { AppDataV2, Assignment, Employee, RoleSession, AnyAppData } from "../types/schema";
import { loadAppData, saveAppData, clearAppData, loadRoleSession, saveRoleSession, clearRoleSession } from "../persistence/storage";
import { makeSeedData } from "../seed/seedData";

function nowIso() { return new Date().toISOString(); }
function uuid() { return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16); }

type Store = {
  session: RoleSession | null;
  setSession: (s: RoleSession | null) => void;

  data: AppDataV2 | null;
  hydrated: boolean;

  init: () => Promise<void>;
  resetAll: () => Promise<void>;

  // assignments
  createAssignment: (a: Omit<Assignment, "id"|"createdAt"|"updatedAt"|"lastUpdateAt"|"doneDate"|"employeeName"|"employeeHumanId">) => void;
  updateAssignmentCore: (id: string, patch: Partial<Pick<Assignment,
    "sn"|"dateAssigned"|"employeeId"|"designation"|"taskType"|"project"|"taskDetails"|"deadline"|"priority"|"ceoComment"
  >>) => void;
  updateByEmployee: (id: string, patch: Partial<Pick<Assignment, "workStatus"|"employeeRemarks"|"doneDate">>) => void;

  // employees (CEO)
  addEmployee: (e: Omit<Employee, "id"> & { id?: string }) => void;
  updateEmployee: (id: string, patch: Partial<Omit<Employee, "id">>) => void;
  deleteEmployee: (id: string) => void;

  exportJSON: () => AnyAppData;
  importJSON: (payload: any) => void;
};

function ensureMasterValue(list: string[], v: string): string[] {
  const val = (v ?? "").trim();
  if (!val) return list;
  if (list.includes(val)) return list;
  return [val, ...list];
}

function hydrateSnapshots(a: Assignment, employees: Employee[]): Assignment {
  const emp = employees.find(e => e.id === a.employeeId);
  return {
    ...a,
    employeeName: emp?.name ?? a.employeeName ?? "Unknown",
    employeeHumanId: emp?.employeeId ?? a.employeeHumanId ?? "",
    designation: emp?.designation ?? a.designation ?? "",
  };
}

async function persist(data: AppDataV2) {
  await saveAppData({ ...data, updatedAt: nowIso() });
}

export const useAppStore = create<Store>((set, get) => ({
  session: loadRoleSession(),
  setSession: (s) => {
    if (!s) clearRoleSession();
    else saveRoleSession(s);
    set({ session: s });
  },

  data: null,
  hydrated: false,

  init: async () => {
    const existing = await loadAppData();
    const data = (existing ?? makeSeedData()) as AppDataV2;

    const normalized: AppDataV2 = {
      ...data,
      schemaVersion: 2,
      employees: data.employees ?? [],
      masterData: data.masterData ?? {
        taskTypes: [],
        projects: [],
        priorities: ["LOW","MEDIUM","HIGH","URGENT"] as any,
        statuses: ["NOT_STARTED","IN_PROGRESS","BLOCKED","DONE"] as any,
      },
      assignments: (data.assignments ?? []).map(a => hydrateSnapshots(a, data.employees ?? [])),
      updatedAt: nowIso(),
    };

    set({ data: normalized, hydrated: true });
    await persist(normalized);
  },

  resetAll: async () => {
    await clearAppData();
    clearRoleSession();
    const d = makeSeedData();
    set({ data: d, session: null, hydrated: true });
    await persist(d);
  },

  createAssignment: (a) => {
    const st = get();
    if (!st.data) return;

    const employees = st.data.employees;
    const emp = employees.find(e => e.id === a.employeeId);

    const row: Assignment = hydrateSnapshots({
      ...a,
      id: uuid(),
      employeeName: emp?.name ?? "Unknown",
      employeeHumanId: emp?.employeeId ?? "",
      workStatus: "NOT_STARTED",
      employeeRemarks: "",
      lastUpdateAt: null,
      doneDate: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }, employees);

    // auto-extend master lists when CEO types a new value
    const md = st.data.masterData;
    const masterData = {
      ...md,
      taskTypes: ensureMasterValue(md.taskTypes, row.taskType),
      projects: ensureMasterValue(md.projects, row.project),
    };

    const next: AppDataV2 = { ...st.data, assignments: [row, ...st.data.assignments], masterData, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  updateAssignmentCore: (id, patch) => {
    const st = get();
    if (!st.data) return;

    let md = st.data.masterData;
    if (patch.taskType) md = { ...md, taskTypes: ensureMasterValue(md.taskTypes, patch.taskType) };
    if (patch.project) md = { ...md, projects: ensureMasterValue(md.projects, patch.project) };

    const nextAssignments = st.data.assignments.map(a => {
      if (a.id !== id) return a;
      const merged = { ...a, ...patch, updatedAt: nowIso() } as Assignment;
      return hydrateSnapshots(merged, st.data!.employees);
    });

    const next = { ...st.data, assignments: nextAssignments, masterData: md, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  updateByEmployee: (id, patch) => {
    const st = get();
    if (!st.data) return;

    const nextAssignments = st.data.assignments.map(a => {
      if (a.id !== id) return a;
      const status = (patch.workStatus ?? a.workStatus) as any;
      const doneDate = status === "DONE"
        ? (patch.doneDate ?? a.doneDate ?? new Date().toISOString().slice(0,10))
        : null;

      return {
        ...a,
        workStatus: status,
        employeeRemarks: patch.employeeRemarks ?? a.employeeRemarks,
        doneDate,
        lastUpdateAt: nowIso(),
        updatedAt: nowIso(),
      };
    });

    const next = { ...st.data, assignments: nextAssignments, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  addEmployee: (e) => {
    const st = get();
    if (!st.data) return;
    const id = e.id?.trim() || ("emp-" + (e.name || "new").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(16));
    const emp: Employee = { id, name: e.name, employeeId: e.employeeId, designation: e.designation, accessCode: e.accessCode };
    const nextEmployees = [emp, ...st.data.employees];

    // refresh snapshots everywhere
    const nextAssignments = st.data.assignments.map(a => hydrateSnapshots(a, nextEmployees));
    const next = { ...st.data, employees: nextEmployees, assignments: nextAssignments, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  updateEmployee: (id, patch) => {
    const st = get();
    if (!st.data) return;
    const nextEmployees = st.data.employees.map(e => e.id === id ? { ...e, ...patch } : e);
    const nextAssignments = st.data.assignments.map(a => a.employeeId === id ? hydrateSnapshots(a, nextEmployees) : a);
    const next = { ...st.data, employees: nextEmployees, assignments: nextAssignments, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  deleteEmployee: (id) => {
    const st = get();
    if (!st.data) return;
    const nextEmployees = st.data.employees.filter(e => e.id !== id);

    // keep assignments but mark the snapshot
    const nextAssignments = st.data.assignments.map(a => {
      if (a.employeeId !== id) return a;
      return { ...a, employeeName: "Deleted Employee", employeeHumanId: "", designation: "" };
    });

    const next = { ...st.data, employees: nextEmployees, assignments: nextAssignments, updatedAt: nowIso() };
    set({ data: next });
    persist(next);
  },

  exportJSON: () => get().data ?? makeSeedData(),

  importJSON: (payload) => {
    if (!payload || payload.schemaVersion !== 2 || !Array.isArray(payload.employees) || !Array.isArray(payload.assignments)) {
      throw new Error("Invalid backup file. Expected schemaVersion=2 with employees[] and assignments[].");
    }
    const cleaned: AppDataV2 = {
      schemaVersion: 2,
      updatedAt: nowIso(),
      employees: payload.employees,
      masterData: payload.masterData,
      assignments: payload.assignments.map((a: Assignment) => ({
        ...a,
        id: a.id || uuid(),
        createdAt: a.createdAt || nowIso(),
        updatedAt: nowIso(),
      })).map((a: Assignment) => hydrateSnapshots(a, payload.employees)),
    };
    set({ data: cleaned });
    persist(cleaned);
  },
}));
