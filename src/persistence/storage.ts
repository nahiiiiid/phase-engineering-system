import { get, set, del } from "idb-keyval";
import type { AnyAppData, AppDataV2 } from "../types/schema";
import { APP_CONFIG } from "../config/appConfig";
import type { Assignment } from "../types/schema";

const DATA_KEY = "pe_task_system_data";
const SESSION_KEY = "pe_task_system_session";

type StoredEnvelope = {
  schemaVersion: number;
  savedAt: string;
  payload: any;
};

function nowIso() { return new Date().toISOString(); }

function migrateV1toV2(v1: any): AppDataV2 {
  const employees = APP_CONFIG.employees.map(e => ({ ...e }));
  const assignments: Assignment[] = (v1?.assignments ?? []).map((a: any) => {
    const emp = employees.find(e => e.id === a.employeeId);
    return {
      ...a,
      employeeName: emp?.name ?? a.employeeName ?? "Unknown",
      employeeHumanId: emp?.employeeId ?? a.employeeHumanId ?? "",
      designation: emp?.designation ?? a.designation ?? "",
      createdAt: a.createdAt ?? nowIso(),
      updatedAt: a.updatedAt ?? nowIso(),
    };
  });

  return {
    schemaVersion: 2,
    updatedAt: nowIso(),
    employees,
    assignments,
    masterData: {
      taskTypes: APP_CONFIG.taskTypes.slice(),
      projects: APP_CONFIG.projects.slice(),
      priorities: APP_CONFIG.priorities.slice() as any,
      statuses: APP_CONFIG.statuses.slice() as any,
    }
  };
}

export async function loadAppData(): Promise<AnyAppData | null> {
  const env = await get<StoredEnvelope>(DATA_KEY);
  if (!env) return null;

  if (env.schemaVersion === 2) return env.payload as AppDataV2;
  if (env.schemaVersion === 1) return migrateV1toV2(env.payload);

  console.warn("Unsupported schemaVersion", env.schemaVersion);
  return null;
}

export async function saveAppData(data: AnyAppData): Promise<void> {
  const env: StoredEnvelope = {
    schemaVersion: data.schemaVersion,
    savedAt: new Date().toISOString(),
    payload: data,
  };
  await set(DATA_KEY, env);
}

export async function clearAppData(): Promise<void> {
  await del(DATA_KEY);
}

// Session in localStorage (role entry)
export function loadRoleSession(): any | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function saveRoleSession(session: any): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearRoleSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
