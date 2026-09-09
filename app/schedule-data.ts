export type ScheduleEntry = { id: string; day: number; period: number; classId: string; room: string; note: string; week?: number; completed?: boolean };
export function normalizeSchedule(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries.map(entry => ({ ...entry, week: Number.isInteger(entry.week) && entry.week! >= 1 && entry.week! <= 38 ? entry.week : 1, completed: entry.completed === true }));
}
export function scheduleForWeek(entries: ScheduleEntry[], week: number): ScheduleEntry[] {
  return entries.filter(entry => (entry.week ?? 1) === week);
}
