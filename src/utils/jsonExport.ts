import { downloadText } from "./csv";

export function downloadJSON(filename: string, data: any) {
  downloadText(filename, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}

export async function readJsonFile(file: File): Promise<any> {
  const txt = await file.text();
  return JSON.parse(txt);
}
