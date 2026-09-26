"use client";

import { normalizeSchedule, scheduleForWeek, type ScheduleEntry } from "./schedule-data";
import { evaluateStudentTT22, type TT22Rank } from "@/lib/tt22-evaluation";
import {
  generateSandwichFeedback, generateZaloMessage, generateWithGeminiOrFallback,
  type ZaloScenario
} from "@/lib/ai-assistant";
import {
  LuckyWheelModal, ClassroomTimerModal, HonorBoardModal
} from "@/components/interactive/classroom-tools";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, BarChart3, BookOpenCheck, Bot, CalendarDays, Check, ChevronLeft,
  ChevronRight, ClipboardCheck, Clock3, Copy, DatabaseBackup, Download, FileClock,
  FileSpreadsheet, Hand, LayoutDashboard, ListChecks, Medal, Megaphone, Pencil,
  Plus, RotateCcw, Save, Search, Settings2, ShieldCheck, Smartphone, Sparkles,
  Star, Table2, ThumbsUp, Upload, UserCheck, UserRound, UserRoundPlus, UsersRound,
  UserX, WandSparkles, X, Trophy, MessageCircle, Send, KeyRound
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";

type PageKey = "dashboard" | "schedule" | "lesson" | "grades" | "classes" | "profiles" | "report" | "assistant" | "settings";
type AttendanceStatus = "present" | "absent" | "late" | "excused";
type Classroom = { id: string; name: string; grade: number; room: string; studentIds: string[] };
type Student = {
  id: string; classId: string; name: string; gender: "Nam" | "Nữ" | "Khác";
  parentName: string; parentPhone: string; note: string; hand: number;
  correct: number; praise: number; activity: number;
  attendance: AttendanceStatus;
  scores: Record<string, number | null>;
};

type AuditEntry = { id: string; at: string; action: string };
type AppData = {
  title: string; teacherName: string; schoolName: string;
  schoolYear: string; semester: string; subject: string;
  classes: Classroom[]; students: Student[]; schedule: ScheduleEntry[];
  scoreWeights: Record<string, number>;
  auditLog: AuditEntry[];
  geminiApiKey?: string;
};
type DataSetter = (value: AppData, action?: string) => void;

const scoreColumns = [
  { key: "tx1", label: "Thường xuyên 1" }, { key: "tx2", label: "Thường xuyên 2" },
  { key: "tx3", label: "Thường xuyên 3" }, { key: "mid", label: "Giữa kỳ" },
  { key: "practice", label: "Thực hành/TN" }, { key: "final", label: "Cuối kỳ" },
] as const;

const students: Student[] = [
  ["s01","c8a2","Nguyễn Minh Anh","Nữ","Nguyễn Văn Hòa","0901 245 688","",4,3,2,8,[8,8.5,9,8,9,null]],
  ["s02","c8a2","Trần Quốc Bảo","Nam","Trần Thị Mai","0903 622 901","",2,2,1,4,[7,8,null,7.5,8,null]],
  ["s03","c8a2","Lê Hoài Nam","Nam","Lê Thanh Sơn","0912 555 113","Cần ngồi gần bảng",1,1,0,2,[6.5,7,null,7,7.5,null]],
  ["s04","c8a2","Võ Khánh Linh","Nữ","Võ Đức Long","0935 181 222","",5,4,3,10,[9,9,9.5,9,9.5,null]],
  ["s05","c11b6","Phạm Quỳnh Anh","Nữ","Phạm Đức Minh","0988 621 340","Tích cực trong hoạt động nhóm",6,4,3,12,[8,9,8.5,8.5,9,null]],
  ["s06","c11b6","Đỗ Gia Huy","Nam","Đỗ Văn Hải","0905 442 860","",2,1,1,3,[7,7.5,8,7,8,null]],
  ["s07","c11b6","Bùi Ngọc Hà","Nữ","Bùi Thị Lan","0977 320 664","",3,3,2,7,[8.5,8,null,8.5,9,null]],
  ["s08","c11b6","Hoàng Tuấn Kiệt","Nam","Hoàng Anh Tuấn","0918 240 119","",1,1,0,1,[6,6.5,7,6.5,7.5,null]],
  ["s09","c11b6","Nguyễn Phương Thảo","Nữ","Nguyễn Quốc Trung","0938 112 907","",4,3,2,9,[9,8.5,9,8,9,null]],
  ["s10","c12a14","Đặng Hải Đăng","Nam","Đặng Hồng Sơn","0902 482 613","",2,2,1,4,[7.5,8,8,7.5,8,null]],
  ["s11","c12a14","Trương Mỹ Duyên","Nữ","Trương Thị Yến","0962 114 500","",5,4,4,11,[9,9.5,9,9,9.5,null]],
  ["s12","c11b1","Ngô Thanh Tùng","Nam","Ngô Văn Nam","0941 800 356","",1,1,0,2,[7,null,null,7,7.5,null]],
].map((row) => {
  const [id,classId,name,gender,parentName,parentPhone,note,hand,correct,praise,activity,values] = row as [string,string,string,Student["gender"],string,string,string,number,number,number,number,(number|null)[]];
  return { id,classId,name,gender,parentName,parentPhone,note,hand,correct,praise,activity,attendance: "present",
    scores: Object.fromEntries(scoreColumns.map((column, index) => [column.key, values[index]])) };
});

const initialData: AppData = {
  title: "SỔ TAY BỘ MÔN", teacherName: "Mai Hoa", schoolName: "THCS Chu Văn An",
  schoolYear: "2025–2026", semester: "Học kỳ I", subject: "Địa lý",
  classes: [
    { id: "c8a2", name: "Lớp 8A2", grade: 8, room: "Phòng Chồi 8", studentIds: ["s01","s02","s03","s04"] },
    { id: "c11b6", name: "Lớp 11B6", grade: 11, room: "Phòng Chồi 11", studentIds: ["s05","s06","s07","s08","s09"] },
    { id: "c12a14", name: "Lớp 12A14", grade: 12, room: "Phòng 12A", studentIds: ["s10","s11"] },
    { id: "c11b1", name: "Lớp 11B1", grade: 11, room: "Phòng 11B", studentIds: ["s12"] },
  ], students,
  schedule: [
    { id: "e1", day: 2, period: 1, classId: "c8a2", room: "Phòng Chồi 8", note: "Bài 4 · Khí hậu Việt Nam" },
    { id: "e2", day: 2, period: 3, classId: "c11b6", room: "Phòng Chồi 11", note: "Bài 8 · Liên minh châu Âu" },
    { id: "e3", day: 4, period: 2, classId: "c12a14", room: "Phòng 12A", note: "Bài 6 · Đô thị hóa" },
    { id: "e4", day: 6, period: 5, classId: "c11b1", room: "Phòng 11B", note: "Ôn tập giữa kỳ" },
  ], scoreWeights: { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 }, auditLog: [],
};

const navItems = [
  ["dashboard","Tổng quan",LayoutDashboard], ["schedule","Thời khóa biểu",CalendarDays],
  ["lesson","Theo dõi tiết học",Clock3], ["grades","Sổ điểm",Table2], ["classes","Lớp học",UsersRound],
  ["profiles","Hồ sơ HS",UserRound], ["report","Báo cáo",BarChart3],
  ["assistant","Trợ lý AI",WandSparkles], ["settings","Thiết lập",Settings2],
] as const;
const cloneInitial = () => JSON.parse(JSON.stringify(initialData)) as AppData;
const days = [2,3,4,5,6,7];
const periods = [1,2,3,4,5];
const storageKey = "so-tay-bo-mon-dia-ly-v1";

function normalizeData(value: Partial<AppData>): AppData {
  const fallback = cloneInitial();
  const sourceStudents = Array.isArray(value.students) ? value.students : fallback.students;
  const sourceClasses = Array.isArray(value.classes) ? value.classes : fallback.classes;
  return {
    ...fallback,
    ...value,
    title: "SỔ TAY BỘ MÔN",
    teacherName: typeof value.teacherName === "string" && value.teacherName.trim() ? value.teacherName.trim() : fallback.teacherName,
    schoolName: typeof value.schoolName === "string" ? value.schoolName.trim() : fallback.schoolName,
    subject: typeof value.subject === "string" && value.subject.trim() ? value.subject.trim() : fallback.subject,
    classes: sourceClasses.map((classroom) => ({
      ...classroom,
      studentIds: Array.isArray(classroom.studentIds)
        ? classroom.studentIds
        : sourceStudents.filter((student) => student.classId === classroom.id).map((student) => student.id),
    })),
    students: sourceStudents.map((student) => ({ ...student, attendance: student.attendance ?? "present", scores: { tx1: null, tx2: null, tx3: null, mid: null, practice: null, final: null, ...student.scores } })) as Student[],
    schedule: normalizeSchedule(Array.isArray(value.schedule) ? value.schedule : fallback.schedule),
    scoreWeights: { ...fallback.scoreWeights, ...(value.scoreWeights ?? {}) },
    auditLog: Array.isArray(value.auditLog) ? value.auditLog : [],
    geminiApiKey: typeof value.geminiApiKey === "string" ? value.geminiApiKey.trim() : "",
  };
}

function describeChange(previous: AppData, next: AppData) {
  if (previous.teacherName !== next.teacherName || previous.schoolName !== next.schoolName || previous.subject !== next.subject) return "Cập nhật thông tin giáo viên & môn học";
  if (previous.students.length !== next.students.length) return next.students.length > previous.students.length ? "Thêm học sinh vào lớp" : "Cập nhật danh sách học sinh";
  if (JSON.stringify(previous.schedule) !== JSON.stringify(next.schedule)) return "Cập nhật thời khóa biểu";
  if (previous.classes.length !== next.classes.length) return "Cập nhật danh sách lớp";
  const attendanceChanged = previous.students.some((student) => student.attendance !== next.students.find((item) => item.id === student.id)?.attendance);
  if (attendanceChanged) return "Cập nhật điểm danh tiết học";
  const scoreChanged = previous.students.some((student) => JSON.stringify(student.scores) !== JSON.stringify(next.students.find((item) => item.id === student.id)?.scores));
  if (scoreChanged) return "Cập nhật sổ điểm";
  const activityChanged = previous.students.some((student) => {
    const updated = next.students.find((item) => item.id === student.id);
    return updated && (student.hand !== updated.hand || student.correct !== updated.correct || student.praise !== updated.praise || student.activity !== updated.activity);
  });
  if (activityChanged) return "Ghi nhận hoạt động tiết học";
  const noteChanged = previous.students.some((student) => student.note !== next.students.find((item) => item.id === student.id)?.note);
  if (noteChanged) return "Lưu nhận xét học sinh";
  return "Cập nhật thiết lập sổ tay";
}

function scoreTrend(student: Student) {
  const recorded = scoreColumns.map(({ key }) => student.scores[key]).filter((value): value is number => typeof value === "number");
  return recorded.length > 1 ? recorded.at(-1)! - recorded[0] : 0;
}

const attendanceLabel: Record<AttendanceStatus, string> = { present: "Có mặt", absent: "Vắng", late: "Đi muộn", excused: "Có phép" };

function average(student: Student, weights: Record<string, number>) {
  const values = scoreColumns.map(({ key }) => ({ value: student.scores[key], weight: weights[key] ?? 1 }))
    .filter((item): item is { value: number; weight: number } => typeof item.value === "number");
  if (!values.length) return null;
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  return values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function parseDelimitedRow(line: string) {
  const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function AttendanceButtons({ student, onMark }: { student: Student; onMark: (student: Student, status: AttendanceStatus) => void }) {
  return <div className="attendance-actions" aria-label={`Điểm danh ${student.name}`}>
    {(Object.keys(attendanceLabel) as AttendanceStatus[]).map((status) => <button key={status} title={attendanceLabel[status]} aria-label={`${attendanceLabel[status]}: ${student.name}`} aria-pressed={student.attendance === status} className={`${status} ${student.attendance === status ? "active" : ""}`} onClick={() => onMark(student, status)}>{status === "present" ? <UserCheck /> : status === "absent" ? <UserX /> : status === "late" ? <Clock3 /> : <ShieldCheck />}<span>{attendanceLabel[status]}</span></button>)}
  </div>;
}

export default function TeacherApp() {
  const [data, setStore] = useState<AppData>(initialData);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState<PageKey>("dashboard");
  const [activeClassId, setActiveClassId] = useState("c8a2");
  const [activeStudentId, setActiveStudentId] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setStore(normalizeData(JSON.parse(saved) as Partial<AppData>));
      } catch {
        toast.error("Không thể đọc dữ liệu đã lưu trên trình duyệt.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      toast.error("Bộ nhớ trình duyệt đã đầy. Hãy tải bản sao lưu trong Thiết lập.");
    }
  }, [data, hydrated]);
  const setData: DataSetter = (next, action) => setStore((previous) => ({
    ...next,
    auditLog: [{ id: `log${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), action: action ?? describeChange(previous, next) }, ...(next.auditLog ?? previous.auditLog ?? [])].slice(0, 80),
  }));
  const activeClass = data.classes.find((item) => item.id === activeClassId) ?? data.classes[0];
  const activeStudents = data.students.filter((item) => item.classId === activeClass?.id);
  const currentStudentId = activeStudents.some((item) => item.id === activeStudentId) ? activeStudentId : activeStudents[0]?.id ?? "";
  const navigate = (key: string) => {
    setPage(key as PageKey); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openStudentProfile = (studentId: string) => { setActiveStudentId(studentId); navigate("profiles"); };
  if (!activeClass) return null;
  const currentNavItem = navItems.find(([key]) => key === page) ?? navItems[0];
  const CurrentPageIcon = currentNavItem[2];
  return <div className="app-shell">
    <aside className={mobileNav ? "side-panel is-open" : "side-panel"}>
      <div className="side-panel-head">
        <button className="brand" onClick={() => navigate("dashboard")} aria-label="Về trang tổng quan">
          <span className="brand-mark"><BookOpenCheck /></span>
          <span className="brand-copy"><strong>SỔ TAY BỘ MÔN</strong><small>Kết nối tri thức · Ươm mầm tương lai</small></span>
        </button>
        <Button className="side-close" size="icon" variant="ghost" onClick={() => setMobileNav(false)} aria-label="Đóng điều hướng"><X /></Button>
      </div>
      <div className="teacher-card">
        <span className="teacher-avatar">{(data.teacherName || "M").trim().split(" ").at(-1)?.[0]}</span>
        <div><strong>{data.teacherName || "Mai Hoa"}</strong><small>{data.subject || "Địa lý"}{data.schoolName ? ` · ${data.schoolName}` : ""}</small></div>
        <span className="edition">4.2</span>
      </div>
      <nav className="main-nav" aria-label="Điều hướng chính">
        {navItems.map(([key,label,Icon]) => <button key={key} className={page === key ? "active" : ""} aria-current={page === key ? "page" : undefined} onClick={() => navigate(key)}><Icon /><span>{label}</span></button>)}
      </nav>
      <div className="mobile-context-panel">
        <span>Ngữ cảnh làm việc</span>
        <ContextControls data={data} setData={setData} activeClassId={activeClass.id} setActiveClassId={setActiveClassId} />
      </div>
      <div className="side-panel-meta"><ShieldCheck /><div><strong>Dữ liệu riêng tư</strong><small>{hydrated ? "Đã lưu trên thiết bị này" : "Đang tải dữ liệu..."}</small></div></div>
    </aside>
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Đóng điều hướng" />}
    <div className="workspace-shell">
      <header className="topbar">
        <Button className="mobile-menu" size="icon" variant="ghost" onClick={() => setMobileNav((current) => !current)} aria-label="Mở điều hướng" aria-expanded={mobileNav}><ListChecks /></Button>
        <div className="workspace-heading"><span><CurrentPageIcon /> {currentNavItem[1]}</span><small>{activeClass.name} · {data.semester}</small></div>
        <div className="context-bar">
          <ContextControls data={data} setData={setData} activeClassId={activeClass.id} setActiveClassId={setActiveClassId} />
          <Button className="purple-action" onClick={() => navigate("assistant")}><Sparkles /> Trợ lý AI</Button>
          <Button className="start-action" onClick={() => navigate("lesson")}><Clock3 /> Bắt đầu tiết học</Button>
        </div>
      </header>
      <main className="page-wrap">
        {page === "dashboard" && <Dashboard data={data} setData={setData} activeClass={activeClass} setActiveClassId={setActiveClassId} navigate={navigate} openProfile={openStudentProfile} />}
        {page === "schedule" && <SchedulePage data={data} setData={setData} activeClassId={activeClass.id} />}
        {page === "lesson" && <LessonPage key={activeClass.id} data={data} setData={setData} classroom={activeClass} students={activeStudents} />}
        {page === "grades" && <GradesPage data={data} setData={setData} classroom={activeClass} students={activeStudents} />}
        {page === "classes" && <ClassesPage data={data} setData={setData} setActiveClassId={setActiveClassId} navigate={navigate} />}
        {page === "profiles" && <ProfilesPage data={data} students={activeStudents} classroom={activeClass} navigate={navigate} selectedId={currentStudentId} setSelectedId={setActiveStudentId} />}
        {page === "report" && <ReportsPage data={data} classroom={activeClass} students={activeStudents} navigate={navigate} openProfile={openStudentProfile} />}
        {page === "assistant" && <AssistantPage key={activeClass.id} data={data} setData={setData} classroom={activeClass} students={activeStudents} selectedId={currentStudentId} setSelectedId={setActiveStudentId} />}
        {page === "settings" && <SettingsPage data={data} setData={setData} />}
      </main>
    </div>
    <Toaster position="bottom-right" richColors />
  </div>;
}

function ContextControls({ data, setData, activeClassId, setActiveClassId }: {
  data: AppData; setData: DataSetter; activeClassId: string; setActiveClassId: (id: string) => void;
}) {
  return <div className="context-controls">
    <Select value={data.schoolYear} onValueChange={(value) => setData({ ...data, schoolYear: value })}>
      <SelectTrigger className="context-select school-year" aria-label="Năm học"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2025–2026">Năm 2025–2026</SelectItem><SelectItem value="2026–2027">Năm 2026–2027</SelectItem></SelectContent>
    </Select>
    <Select value={data.semester} onValueChange={(value) => setData({ ...data, semester: value })}>
      <SelectTrigger className="context-select semester" aria-label="Học kỳ"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Học kỳ I">Học kỳ I</SelectItem><SelectItem value="Học kỳ II">Học kỳ II</SelectItem></SelectContent>
    </Select>
    <Select value={activeClassId} onValueChange={setActiveClassId}>
      <SelectTrigger className="context-select class-picker" aria-label="Lớp đang chọn"><span className="select-prefix">Lớp</span><SelectValue /></SelectTrigger><SelectContent>{data.classes.map((item) => <SelectItem value={item.id} key={item.id}>{item.name} · Khối {item.grade}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

function Dashboard({ data, setData, activeClass, setActiveClassId, navigate, openProfile }: {
  data: AppData; setData: (value: AppData) => void; activeClass: Classroom;
  setActiveClassId: (id: string) => void; navigate: (key: string) => void; openProfile: (studentId: string) => void;
}) {
  const [grade, setGrade] = useState<number | "all">("all");
  const [classOpen, setClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({ grade: "8", name: "" });
  const [studentQuery, setStudentQuery] = useState("");
  const [dashboardWeek, setDashboardWeek] = useState(1);
  const filtered = grade === "all" ? data.classes : data.classes.filter((item) => item.grade === grade);
  const availableGrades = [...new Set(data.classes.map((item) => item.grade))].sort((a, b) => a - b);
  const classStudents = data.students.filter((item) => item.classId === activeClass.id);
  const currentSchedule = scheduleForWeek(data.schedule, dashboardWeek);
  const classSchedule = currentSchedule.filter((item) => item.classId === activeClass.id);
  const weeklySchedule = [...currentSchedule].sort((a, b) => a.day - b.day || a.period - b.period).slice(0, 5);
  const studentRows = classStudents.map((student) => ({ student, avg: average(student, data.scoreWeights) }));
  const gradedRows = studentRows.filter((item): item is typeof item & { avg: number } => typeof item.avg === "number");
  const classAverage = gradedRows.length ? gradedRows.reduce((sum, item) => sum + item.avg, 0) / gradedRows.length : null;
  const meetingTarget = gradedRows.filter((item) => item.avg >= 6.5).length;
  const needsAttention = studentRows.filter(({ student, avg }) => student.attendance === "absent" || student.attendance === "late" || (avg !== null && avg < 6.5) || student.activity < 3);
  const visibleStudentRows = studentRows.filter(({ student }) => student.name.toLocaleLowerCase("vi").includes(studentQuery.trim().toLocaleLowerCase("vi")));
  const createClass = () => {
    if (!newClass.name.trim()) return toast.error("Vui lòng nhập tên lớp.");
    const cleanName = newClass.name.trim().replace(/\s+/g, " ");
    const displayName = /^lớp\s/i.test(cleanName) ? cleanName : `Lớp ${cleanName}`;
    if (data.classes.some((item) => item.name.toLocaleLowerCase("vi") === displayName.toLocaleLowerCase("vi"))) return toast.error("Lớp học này đã tồn tại.");
    const classroom: Classroom = { id: `c${Date.now()}`, name: displayName, grade: Number(newClass.grade), room: `Phòng ${cleanName}`, studentIds: [] };
    setData({ ...data, classes: [...data.classes, classroom] }); setNewClass({ grade: "8", name: "" }); setClassOpen(false); toast.success("Đã thêm lớp học mới.");
  };
  return <div className="stack-xl">
    <section className="hero-panel">
      <div className="hero-copy"><span className="eyebrow"><CalendarDays /> {data.semester} · Năm học {data.schoolYear}</span><h1>Xin chào {data.teacherName || "thầy/cô"}!</h1><p>Mỗi bài học là một hành trình nhỏ, mở ra những chân trời lớn. Cùng học sinh viết tiếp những ngày học thật đẹp.</p><div className="hero-note"><BookOpenCheck /><span><strong>Sẵn sàng cho tiết dạy tiếp theo</strong>Dữ liệu được tự động lưu trên thiết bị này.</span></div></div>
      <div className="hero-current"><small>Lớp đang chọn</small><strong>{activeClass.name} <span>(Khối {activeClass.grade})</span></strong><p>{data.subject} · {activeClass.room}</p><Button onClick={() => navigate("lesson")}><Clock3 /> Bắt đầu tiết học ngay</Button></div>
    </section>
    <section className="metric-grid">
      <Metric icon={<UsersRound />} tone="green" value={`${classStudents.length} học sinh`} label={`Sĩ số ${activeClass.name}`} action="Mở hồ sơ học sinh" onClick={() => classStudents[0] ? openProfile(classStudents[0].id) : navigate("profiles")} />
      <Metric icon={<Check />} tone="blue" value={`${meetingTarget}/${gradedRows.length || classStudents.length}`} label="Học sinh đạt từ 6,5" action="Mở sổ điểm" onClick={() => navigate("grades")} />
      <Metric icon={<AlertTriangle />} tone="amber" value={`${needsAttention.length} học sinh`} label="Cần giáo viên chú ý" action="Xem báo cáo chi tiết" onClick={() => navigate("report")} />
      <Metric icon={<Medal />} tone="purple" value={classAverage?.toFixed(1) ?? "—"} label="Điểm trung bình lớp" action="Xem tiến bộ học tập" onClick={() => navigate("report")} />
    </section>
    <section className="command-center-grid">
      <article className="surface active-class-panel">
        <div className="card-heading"><div><h2><BookOpenCheck /> Lớp đang chọn</h2><p>Ngữ cảnh thao tác hiện tại</p></div><span className="live-badge">ĐANG DẠY</span></div>
        <div className="active-class-identity"><strong>{activeClass.name.replace("Lớp ", "")}</strong><span>Khối {activeClass.grade}</span></div>
        <dl className="active-class-facts"><div><dt>Học sinh</dt><dd>{classStudents.length}</dd></div><div><dt>Môn phụ trách</dt><dd>{data.subject}</dd></div><div><dt>Phòng học</dt><dd>{activeClass.room}</dd></div><div><dt>Tiết trong tuần</dt><dd>{classSchedule.length}</dd></div></dl>
        <div className="active-class-actions"><Button onClick={() => navigate("lesson")}><UserCheck /> Điểm danh</Button><Button variant="outline" onClick={() => navigate("grades")}><Table2 /> Nhập điểm</Button></div>
      </article>
      <article className="surface schedule-preview">
        <div className="card-heading"><div><h2><CalendarDays /> Lịch dạy trong tuần</h2><p>{currentSchedule.length} tiết · {currentSchedule.filter(item => item.completed).length} đã hoàn thành</p><label>Tuần <select aria-label="Tuần trên tổng quan" value={dashboardWeek} onChange={event => setDashboardWeek(Number(event.target.value))}>{Array.from({length:38}, (_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></label></div><Button variant="ghost" onClick={() => navigate("schedule")}>Xem thời khóa biểu <ChevronRight /></Button></div>
        <div className="schedule-preview-list">{weeklySchedule.map((entry) => { const classroom = data.classes.find((item) => item.id === entry.classId); return <button key={entry.id} className={entry.classId === activeClass.id ? "active" : ""} onClick={() => { setActiveClassId(entry.classId); navigate("lesson"); }}><span className="schedule-day">T{entry.day}<small>Tiết {entry.period}</small></span><span><strong>{classroom?.name ?? "Lớp học"}</strong><small>{entry.note}{entry.completed ? " · Đã hoàn thành" : ""}</small></span><span className="schedule-room">{entry.room}<ChevronRight /></span></button>; })}{!weeklySchedule.length && <div className="compact-empty"><CalendarDays /> Chưa có tiết dạy. Hãy mở Thời khóa biểu để thiết lập.</div>}</div>
      </article>
      <article className="surface dashboard-attention-panel">
        <div className="card-heading"><div><h2><AlertTriangle /> Học sinh cần chú ý</h2><p>Cảnh báo từ dữ liệu hiện có</p></div><Button variant="ghost" onClick={() => navigate("report")}>Xem tất cả <ChevronRight /></Button></div>
        <div className="dashboard-attention-list">{needsAttention.slice(0, 5).map(({ student, avg }) => <button key={student.id} onClick={() => openProfile(student.id)}><span>{student.name.split(" ").at(-1)?.[0]}</span><span><strong>{student.name}</strong><small>{student.attendance !== "present" ? attendanceLabel[student.attendance] : avg !== null && avg < 6.5 ? `ĐTB ${avg.toFixed(1)}` : "Ít tương tác trong lớp"}</small></span><ChevronRight /></button>)}{!needsAttention.length && <div className="compact-empty"><Check /> Chưa có cảnh báo cần xử lý.</div>}</div>
      </article>
    </section>
    <section className="surface dashboard-student-card">
      <div className="card-heading"><div><h2><UsersRound /> Danh sách học sinh {activeClass.name}</h2><p>Dữ liệu điểm danh, điểm số và hoạt động mới nhất</p></div><label className="dashboard-student-search"><Search /><input aria-label="Tìm học sinh trong lớp đang chọn" value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Tìm học sinh..." /></label></div>
      <div className="dashboard-table-wrap"><table className="dashboard-student-table"><thead><tr><th>STT</th><th>Họ và tên</th><th>Điểm danh</th><th>ĐTB</th><th>Hoạt động</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{visibleStudentRows.map(({ student, avg }, index) => { const attention = needsAttention.some((item) => item.student.id === student.id); return <tr key={student.id}><td>{index + 1}</td><td><strong>{student.name}</strong><small>{student.gender} · {activeClass.name}</small></td><td><span className={`attendance-badge ${student.attendance}`}>{attendanceLabel[student.attendance]}</span></td><td><b>{avg?.toFixed(1) ?? "—"}</b></td><td>{student.activity > 0 ? "+" : ""}{student.activity}đ</td><td><span className={`student-status ${attention ? "attention" : "steady"}`}>{attention ? "Cần chú ý" : "Ổn định"}</span></td><td><Button size="icon-sm" variant="ghost" aria-label={`Mở hồ sơ ${student.name}`} onClick={() => openProfile(student.id)}><ChevronRight /></Button></td></tr>; })}</tbody></table>{!visibleStudentRows.length && <div className="compact-empty"><Search /> Không tìm thấy học sinh phù hợp.</div>}</div>
    </section>
    <section className="surface class-section">
      <div className="section-toolbar"><div><h2><UsersRound /> Các lớp đang giảng dạy</h2><p>Chọn lớp để theo dõi lịch học, học sinh và sổ điểm.</p></div><div className="toolbar-actions"><div className="chip-row"><button aria-pressed={grade === "all"} className={grade === "all" ? "chip active" : "chip"} onClick={() => setGrade("all")}>Tất cả</button>{availableGrades.map((item) => <button aria-pressed={grade === item} key={item} className={grade === item ? "chip active" : "chip"} onClick={() => setGrade(item)}>Khối {item}</button>)}</div><Button onClick={() => setClassOpen(true)}><Plus /> Thêm lớp</Button></div></div>
      <div className="class-grid">{filtered.map((item) => <ClassCard key={item.id} item={item} data={data} selected={activeClass.id === item.id} teach={() => { setActiveClassId(item.id); navigate("lesson"); }} manage={() => { setActiveClassId(item.id); navigate("classes"); }} />)}</div>
    </section>
    <Dialog open={classOpen} onOpenChange={setClassOpen}><DialogContent><DialogHeader><DialogTitle className="dialog-title"><UsersRound /> Thêm lớp học mới</DialogTitle><DialogDescription>Năm học {data.schoolYear}</DialogDescription></DialogHeader><div className="form-stack"><label>Chọn khối<Select value={newClass.grade} onValueChange={(value) => setNewClass({ ...newClass, grade: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{[6,7,8,9,10,11,12].map((item) => <SelectItem value={String(item)} key={item}>Khối {item}</SelectItem>)}</SelectContent></Select></label><label>Tên lớp<input value={newClass.name} onChange={(event) => setNewClass({ ...newClass, name: event.target.value })} placeholder="Ví dụ: 8A2, 11B6..." /></label></div><DialogFooter><Button variant="ghost" onClick={() => setClassOpen(false)}>Hủy</Button><Button onClick={createClass}><Plus /> Tạo lớp</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Metric({ icon, tone, value, label, action, onClick }: { icon: ReactNode; tone: string; value: string; label: string; action: string; onClick: () => void }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><strong>{value}</strong><p>{label}</p><button onClick={onClick}>{action}<ChevronRight /></button></article>;
}

function ClassCard({ item, data, selected, teach, manage }: { item: Classroom; data: AppData; selected?: boolean; teach: () => void; manage: () => void }) {
  const count = data.students.filter((student) => student.classId === item.id).length;
  return <article className={`class-card ${selected ? "selected" : ""}`}><div className="class-card-head"><span>KHỐI {item.grade}</span><small>{count} HS</small></div><h3>{item.name}</h3><p>{data.subject} · {item.room}</p><div className="class-meta"><span><UsersRound /> {count} học sinh</span><span>{data.schoolYear}</span></div><Button className="wide" onClick={teach}><Clock3 /> Dạy tiết này</Button><Button className="wide secondary-soft" variant="secondary" onClick={manage}><UserRoundPlus /> Thêm / Nhập học sinh</Button></article>;
}

function SchedulePage({ data, setData, activeClassId }: { data: AppData; setData: (value: AppData) => void; activeClassId: string }) {
  const [week, setWeek] = useState(1);
  const [editing, setEditing] = useState<Partial<ScheduleEntry> | null>(null);
  const weekSchedule = scheduleForWeek(data.schedule, week);
  const openSlot = (day: number, period: number) => { const existing = weekSchedule.find((item) => item.day === day && item.period === period); setEditing(existing ? { ...existing } : { day, period, week, completed: false, classId: activeClassId, room: "", note: "" }); };
  const save = () => {
    if (!editing?.classId || !editing.day || !editing.period) return;
    const selectedClass = data.classes.find((item) => item.id === editing.classId);
    const item: ScheduleEntry = { id: editing.id ?? `e${Date.now()}`, week, completed: editing.completed === true, day: editing.day, period: editing.period, classId: editing.classId, room: editing.room?.trim() || selectedClass?.room || "Chưa xếp phòng", note: editing.note?.trim() || `Tiết học ${data.subject}` };
    setData({ ...data, schedule: editing.id ? data.schedule.map((entry) => entry.id === editing.id ? item : entry) : [...data.schedule, item] }); setEditing(null); toast.success(`Đã lưu Thứ ${item.day} · Tiết ${item.period}.`);
  };
  const remove = () => { if (!editing?.id) return; setData({ ...data, schedule: data.schedule.filter((item) => item.id !== editing.id) }); setEditing(null); toast.success("Đã xóa tiết khỏi thời khóa biểu."); };
  return <div className="stack-xl">
    <section className="week-panel"><div className="week-head"><div><small>NĂM HỌC {data.schoolYear}</small><h1>TUẦN {week} / 38</h1></div><div className="week-nav"><Button size="icon" variant="ghost" aria-label="Tuần trước" onClick={() => setWeek(Math.max(1, week - 1))}><ChevronLeft /></Button><span>Đang xem tuần {week}</span><Button size="icon" variant="ghost" aria-label="Tuần sau" onClick={() => setWeek(Math.min(38, week + 1))}><ChevronRight /></Button></div></div><div className="week-chips" aria-label="Chọn tuần">{Array.from({ length: 38 }, (_, index) => index + 1).map((item) => <button aria-pressed={week === item} className={week === item ? "active" : ""} onClick={() => setWeek(item)} key={item}>T{item}</button>)}</div></section>
    <p className="schedule-guidance">Lịch cũ được giữ ở tuần 1. Mỗi tuần lưu riêng; sửa hoặc xóa một tiết chỉ áp dụng cho tuần đang xem. Tuần {week}: {weekSchedule.filter(item => item.completed).length}/{weekSchedule.length} tiết đã hoàn thành.</p>
    <section className="surface schedule-surface"><div className="schedule-grid"><div className="schedule-header corner">BUỔI / TIẾT</div>{days.map((day) => <div key={day} className="schedule-header">THỨ {day}</div>)}{periods.map((period) => <div className="schedule-row" key={period}><div className="period-label"><span>{period <= 3 ? "BUỔI SÁNG" : "BUỔI CHIỀU"}</span>TIẾT {period}</div>{days.map((day) => { const entry = weekSchedule.find((item) => item.day === day && item.period === period); const classroom = data.classes.find((item) => item.id === entry?.classId); const actionLabel = entry ? `Sửa Thứ ${day}, Tiết ${period}: ${classroom?.name ?? "Lớp học"}` : `Thêm tiết Thứ ${day}, Tiết ${period}`; return <button key={day} aria-label={actionLabel} className={entry ? "schedule-cell filled" : "schedule-cell"} onClick={() => openSlot(day, period)}>{entry ? <><span className="schedule-class">{classroom?.name}</span><strong>{data.subject}</strong><small>{entry.room}</small><small>{entry.note}</small><span className={entry.completed ? "lesson-status done" : "lesson-status"}>{entry.completed ? "✓ Đã hoàn thành" : "Chưa hoàn thành"}</span><Pencil /></> : <Plus />}</button>; })}</div>)}</div></section>
    <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle className="dialog-title"><CalendarDays /> Tuần {week} · Thứ {editing?.day}</DialogTitle><DialogDescription>{(editing?.period ?? 1) <= 3 ? "Buổi sáng" : "Buổi chiều"} · Tiết {editing?.period}</DialogDescription></DialogHeader><div className="form-stack"><label>Chọn lớp học<Select value={editing?.classId} onValueChange={(value) => setEditing({ ...editing, classId: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{data.classes.map((item) => <SelectItem value={item.id} key={item.id}>{item.name} · Khối {item.grade}</SelectItem>)}</SelectContent></Select></label><label>Môn giảng dạy<input value={data.subject} readOnly /></label><label>Phòng học<input value={editing?.room ?? ""} onChange={(event) => setEditing({ ...editing, room: event.target.value })} placeholder="Nhập phòng học" /></label><label>Ghi chú tiết học<input value={editing?.note ?? ""} onChange={(event) => setEditing({ ...editing, note: event.target.value })} placeholder="Nội dung bài học, dặn dò..." /></label><label className="completion-field"><input type="checkbox" checked={editing?.completed === true} onChange={event => setEditing({ ...editing, completed: event.target.checked })} /> Đánh dấu tiết đã hoàn thành</label></div><DialogFooter>{editing?.id && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Xóa tiết</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa tiết khỏi thời khóa biểu?</AlertDialogTitle><AlertDialogDescription>Thứ {editing.day} · Tiết {editing.period} sẽ bị xóa khỏi lịch dạy trên thiết bị này.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="danger-confirm" onClick={remove}>Xác nhận xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}<Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button><Button className="purple-action" onClick={save}><Save /> Lưu tiết dạy</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function LessonPage({ data, setData, classroom, students }: { data: AppData; setData: (value: AppData) => void; classroom: Classroom; students: Student[] }) {
  const [query, setQuery] = useState("");
  const [sound, setSound] = useState(true);
  const [quickMode, setQuickMode] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [honorOpen, setHonorOpen] = useState(false);
  const [lessonName, setLessonName] = useState("Tiết 14 · Ôn tập và luyện tập bản đồ");
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState<{ studentId: string; previous: Student }[]>([]);
  const [noteDraft, setNoteDraft] = useState<{ studentId: string; value: string } | null>(null);
  const shown = students.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const playChime = (points: number) => {
    if (!sound || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (points > 0) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        osc.frequency.setValueAtTime(329.63, now);
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch {}
  };
  const reward = (student: Student, field: "hand" | "correct" | "praise" | "activity", points: number, message: string) => {
    playChime(points);
    setHistory((current) => [...current, { studentId: student.id, previous: { ...student, scores: { ...student.scores } } }]);
    setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, [field]: Math.max(0, item[field] + 1), activity: Math.max(0, item.activity + points) } : item) });
    toast.success(`${student.name}: ${message} (${points > 0 ? "+" : ""}${points}đ)`);
  };
  const undo = () => {
    const last = history.at(-1);
    if (!last) return toast.info("Chưa có thao tác để hoàn tác.");
    setData({ ...data, students: data.students.map((item) => item.id === last.studentId ? last.previous : item) });
    setHistory((current) => current.slice(0, -1)); toast.success("Đã hoàn tác ghi nhận gần nhất.");
  };
  const markAttendance = (student: Student, attendance: AttendanceStatus) => {
    if (student.attendance === attendance) return;
    setHistory((current) => [...current, { studentId: student.id, previous: { ...student, scores: { ...student.scores } } }]);
    setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, attendance } : item) });
  };
  const saveNote = () => {
    if (!noteDraft) return;
    const selectedStudent = data.students.find((item) => item.id === noteDraft.studentId);
    if (!selectedStudent) return;
    setData({ ...data, students: data.students.map((item) => item.id === noteDraft.studentId ? { ...item, note: noteDraft.value.trim() } : item) });
    setNoteDraft(null);
    toast.success(`Đã lưu nhận xét cho ${selectedStudent.name}.`);
  };
  const attendanceCounts = (Object.keys(attendanceLabel) as AttendanceStatus[]).map((status) => ({ status, count: students.filter((student) => student.attendance === status).length }));
  return <div className="stack-lg">
    <section className="surface lesson-head">
      <div className="section-toolbar"><div><h1>THEO DÕI TIẾT HỌC {classroom.name.toUpperCase()} <span>KHỐI {classroom.grade}</span></h1><p>Ghi nhận nhanh mức độ tham gia và kết quả của từng học sinh trong giờ học.</p></div>
        <div className="lesson-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
          <div className="sound-toggle"><Megaphone /><Switch checked={sound} onCheckedChange={setSound} aria-label="Bật âm thanh" /></div>
          <Button className="tool-btn-gold" onClick={() => setWheelOpen(true)}><Sparkles /> Vòng quay gọi tên</Button>
          <Button className="tool-btn-timer" onClick={() => setTimerOpen(true)}><Clock3 /> Đồng hồ nhóm</Button>
          <Button className="tool-btn-trophy" onClick={() => setHonorOpen(true)}><Trophy /> Vinh danh tiết học</Button>
          <Button className="undo-action" onClick={undo}><RotateCcw /> Hoàn tác</Button>
          <Button className="dark-action" onClick={() => { setHonorOpen(true); toast.success("Đã hoàn thành tiết học!"); }}><Check /> Kết thúc tiết học</Button>
        </div>
      </div>
      <div className="lesson-fields"><label><BookOpenCheck /><input value={lessonName} onChange={(event) => setLessonName(event.target.value)} /></label><label><Clock3 /><Select defaultValue="2"><SelectTrigger className="lesson-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2">Tiết dạy · Thứ 2</SelectItem><SelectItem value="4">Tiết dạy · Thứ 4</SelectItem></SelectContent></Select></label><label><CalendarDays /><input type="date" value={lessonDate} onChange={(event) => setLessonDate(event.target.value)} /></label></div>
    </section>
    <div className="notice"><AlertTriangle /><p><strong>Nguyên tắc quan trọng:</strong> điểm hoạt động hỗ trợ đánh giá quá trình. Giáo viên cần đối chiếu minh chứng trước khi quy đổi sang điểm môn học.</p></div>
    <section className="attendance-strip surface"><div><span className="eyebrow green"><ClipboardCheck /> ĐIỂM DANH NHANH</span><h2>{students.length} học sinh · {classroom.name}</h2></div><div className="attendance-summary">{attendanceCounts.map(({ status, count }) => <span className={status} key={status}><i />{attendanceLabel[status]} <strong>{count}</strong></span>)}</div></section>
    <section className="lesson-tools"><label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên học sinh hoặc STT..." /></label><Button variant={quickMode ? "default" : "outline"} onClick={() => setQuickMode(!quickMode)}><Smartphone /> {quickMode ? "Đang ở chế độ nhanh" : "Chế độ nhanh mobile"}</Button><Button variant="outline" onClick={() => toast.info("Danh sách hiện được thao tác theo từng học sinh.")}><UsersRound /> {shown.length} học sinh</Button></section>
    {!quickMode ? <section className="student-action-grid">{shown.map((student, index) => <article key={student.id} className="student-action-card"><div className="student-card-head"><span className="student-index">{index + 1}</span><div><h3>{student.name}</h3><p>STT {index + 1} · {student.gender}</p></div><strong>{student.activity > 0 ? "+" : ""}{student.activity}đ<small>hoạt động</small></strong></div><AttendanceButtons student={student} onMark={markAttendance} /><div className="behavior-grid"><button className="yellow" onClick={() => reward(student, "hand", 1, "Giơ tay phát biểu")}><Hand />Giơ tay phát biểu</button><button className="green" onClick={() => reward(student, "correct", 1, "Trả lời đúng")}><Check />Trả lời đúng</button><button className="purple" onClick={() => reward(student, "praise", 2, "Trả lời xuất sắc")}><Star />Trả lời xuất sắc</button><button className="blue" onClick={() => reward(student, "activity", 1, "Hỗ trợ hoạt động")}><ThumbsUp />Hỗ trợ hoạt động</button><button className="mint" onClick={() => reward(student, "activity", 1, "Chuẩn bị bài tốt")}><ClipboardCheck />Chuẩn bị bài tốt</button><button className="rose" onClick={() => reward(student, "activity", -1, "Cần nhắc nhở")}><AlertTriangle />Cần nhắc nhở</button></div><button className="note-button" onClick={() => setNoteDraft({ studentId: student.id, value: student.note })}><Pencil /> Ghi nhận xét nhanh</button></article>)}</section> : <section className="quick-roster surface">{shown.map((student, index) => <article className="quick-row" key={student.id}><span className="student-index">{index + 1}</span><div className="quick-name"><strong>{student.name}</strong><small>{student.gender} · <b className={student.attendance}>{attendanceLabel[student.attendance]}</b></small></div><AttendanceButtons student={student} onMark={markAttendance} /><div className="quick-actions"><button className="reward" onClick={() => reward(student, "hand", 1, "Phát biểu tích cực")}><Hand /> +1</button><button className="remind" onClick={() => reward(student, "activity", -1, "Cần nhắc nhở")}><AlertTriangle /> -1</button></div><strong className="quick-score">{student.activity > 0 ? "+" : ""}{student.activity}đ</strong></article>)}</section>}
    {!shown.length && <div className="surface empty-state"><Search /><h2>Không tìm thấy học sinh</h2><p>Thử nhập một họ tên khác.</p></div>}
    <Dialog open={!!noteDraft} onOpenChange={(open) => !open && setNoteDraft(null)}><DialogContent><DialogHeader><DialogTitle className="dialog-title"><Pencil /> Nhận xét trong tiết học</DialogTitle><DialogDescription>{data.students.find((item) => item.id === noteDraft?.studentId)?.name} · {classroom.name}</DialogDescription></DialogHeader><label className="form-stack">Nội dung nhận xét<textarea rows={5} value={noteDraft?.value ?? ""} onChange={(event) => setNoteDraft((current) => current ? { ...current, value: event.target.value } : current)} placeholder="Ghi nhận tiến bộ, điểm cần hỗ trợ hoặc minh chứng quan sát được..." /></label><DialogFooter><Button variant="ghost" onClick={() => setNoteDraft(null)}>Hủy</Button><Button onClick={saveNote}><Save /> Lưu nhận xét</Button></DialogFooter></DialogContent></Dialog>

    {/* Các modal công cụ trợ giảng trên lớp */}
    <LuckyWheelModal
      open={wheelOpen}
      onClose={() => setWheelOpen(false)}
      students={students}
      className={classroom.name}
      onRewardStudent={(studentId, type, points, msg) => {
        const st = students.find((s) => s.id === studentId);
        if (st) {
          if (type === "correct") reward(st, "correct", points, msg);
          else if (type === "praise") reward(st, "praise", points, msg);
          else reward(st, "activity", points, msg);
        }
      }}
    />
    <ClassroomTimerModal
      open={timerOpen}
      onClose={() => setTimerOpen(false)}
      className={classroom.name}
    />
    <HonorBoardModal
      open={honorOpen}
      onClose={() => setHonorOpen(false)}
      students={students}
      className={classroom.name}
      subject={data.subject}
    />
  </div>;
}

function GradesPage({ data, setData, classroom, students }: { data: AppData; setData: (value: AppData) => void; classroom: Classroom; students: Student[] }) {
  const updateScore = (studentId: string, key: string, raw: string) => {
    const number = raw === "" ? null : Number(raw);
    if (number !== null && (Number.isNaN(number) || number < 0 || number > 10)) return;
    setData({ ...data, students: data.students.map((item) => item.id === studentId ? { ...item, scores: { ...item.scores, [key]: number } } : item) });
  };
  const exportCsv = () => {
    const header = ["STT","Họ và tên",...scoreColumns.map((item) => item.label),"ĐTB môn","Xếp loại TT 22/2021","Căn cứ xếp loại"];
    const rows = students.map((student, index) => {
      const evalTT22 = evaluateStudentTT22(student.scores, data.scoreWeights);
      return [
        index + 1,
        student.name,
        ...scoreColumns.map((item) => student.scores[item.key] ?? ""),
        evalTT22.average?.toFixed(1) ?? "",
        evalTT22.rank,
        evalTT22.reason
      ];
    });
    const csv = [header,...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `so-diem-TT22-${classroom.name.replace("Lớp ","")}.csv`; link.click(); URL.revokeObjectURL(url); toast.success("Đã xuất sổ điểm CSV chuẩn Thông tư 22 mở được bằng Excel.");
  };
  return <div className="stack-lg">
    <section className="surface grade-head"><div className="section-toolbar"><div><h1><Table2 /> SỔ ĐIỂM ĐÁNH GIÁ THEO THÔNG TƯ 22 · {classroom.name.toUpperCase()}</h1><p>Nhập trực tiếp, tự động tính ĐTB và xếp loại Tốt / Khá / Đạt / Chưa đạt trong {data.semester.toLowerCase()}.</p></div><div className="toolbar-actions"><Button onClick={() => toast.info("Chọn trực tiếp một ô trong bảng để nhập điểm.")}><Plus /> Thêm / Nhập cột điểm</Button><Button variant="outline" className="purple-soft" onClick={exportCsv}><Download /> Lưu xuất điểm Excel (TT22)</Button><Button variant="outline" onClick={() => toast.info("Các thay đổi được lưu ngay trên trình duyệt này.")}><Clock3 /> Lịch sử sửa ĐG</Button></div></div>
      <div className="legend">
        <span>Quy chuẩn Thông tư 22/2021/TT-BGDĐT:</span>
        <i className="pink">TX (hệ số 1)</i>
        <i className="yellow">GK (hệ số 2)</i>
        <i className="blue">CK (hệ số 3)</i>
        <span style={{ marginLeft: "12px", color: "#64748b" }}>Tiêu chuẩn: Tốt (ĐTB ≥8,0 & Min ≥6,5) · Khá (ĐTB ≥6,5 & Min ≥5,0) · Đạt (ĐTB ≥5,0 & Min ≥3,5)</span>
      </div>
    </section>
    <section className="surface grade-table-wrap">
      <Table className="grade-table">
        <TableHeader>
          <TableRow>
            <TableHead style={{ color: "#ffffff", fontWeight: 800 }}>STT</TableHead>
            <TableHead className="student-name-col" style={{ color: "#ffffff", fontWeight: 800 }}>Họ và tên học sinh</TableHead>
            {scoreColumns.map((column) => <TableHead key={column.key} style={{ color: "#ffffff", fontWeight: 800 }}>{column.label}<small style={{ color: "#a7f3d0", fontWeight: 700, display: "block", marginTop: "4px" }}>Hệ số {data.scoreWeights[column.key]}</small></TableHead>)}
            <TableHead className="average-head" style={{ color: "#ffffff", fontWeight: 900 }}>ĐTB môn</TableHead>
            <TableHead className="average-head" style={{ color: "#ffffff", fontWeight: 900 }}>Xếp loại TT22</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => {
            const evalTT22 = evaluateStudentTT22(student.scores, data.scoreWeights);
            return (
              <TableRow key={student.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="student-name-col"><strong>{student.name}</strong></TableCell>
                {scoreColumns.map((column) => (
                  <TableCell key={column.key}>
                    <input
                      aria-label={`${column.label} của ${student.name}`}
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={student.scores[column.key] ?? ""}
                      onChange={(event) => updateScore(student.id, column.key, event.target.value)}
                      placeholder="—"
                    />
                  </TableCell>
                ))}
                <TableCell className="average-cell">{evalTT22.average?.toFixed(1) ?? "—"}</TableCell>
                <TableCell>
                  <span className={`rank-badge ${evalTT22.colorClass}`} title={evalTT22.reason}>
                    {evalTT22.rank}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  </div>;
}

function ClassesPage({ data, setData, setActiveClassId, navigate }: { data: AppData; setData: (value: AppData) => void; setActiveClassId: (id: string) => void; navigate: (key: string) => void }) {
  const [selected, setSelected] = useState<Classroom | null>(null);
  return <div className="stack-xl"><section className="surface page-title"><div><span className="eyebrow green"><UsersRound /> QUẢN LÝ LỚP HỌC</span><h1>Các lớp đang giảng dạy</h1><p>Quản lý thông tin lớp và danh sách học sinh theo từng năm học.</p></div></section><section className="class-grid">{data.classes.map((item) => <ClassCard item={item} data={data} key={item.id} teach={() => { setActiveClassId(item.id); navigate("lesson"); }} manage={() => setSelected(item)} />)}</section><StudentManager open={!!selected} classroom={selected} data={data} setData={setData} onClose={() => setSelected(null)} /></div>;
}

function StudentManager({ open, classroom, data, setData, onClose }: { open: boolean; classroom: Classroom | null; data: AppData; setData: (value: AppData) => void; onClose: () => void }) {
  const [pasted, setPasted] = useState("");
  const [form, setForm] = useState({ name: "", gender: "Nữ" as Student["gender"], parentName: "", parentPhone: "", note: "" });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = classroom ? data.students.filter((item) => item.classId === classroom.id) : [];
  const addStudents = (rows: { name: string; gender?: string; parentName?: string; parentPhone?: string; note?: string }[]) => {
    if (!classroom) return;
    const existingNames = new Set(current.map((student) => student.name.trim().toLocaleLowerCase("vi")));
    const seenNames = new Set<string>();
    const valid = rows.filter((row) => {
      const normalizedName = row.name?.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
      if (!normalizedName || existingNames.has(normalizedName) || seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    });
    if (!valid.length) return toast.error("Không tìm thấy học sinh mới hợp lệ hoặc danh sách đã bị trùng.");
    const added: Student[] = valid.map((row, index) => ({ id: `s${Date.now()}${index}`, classId: classroom.id, name: row.name.trim(), gender: row.gender === "Nam" || row.gender === "Khác" ? row.gender : "Nữ", parentName: row.parentName?.trim() ?? "", parentPhone: row.parentPhone?.trim() ?? "", note: row.note?.trim() ?? "", hand: 0, correct: 0, praise: 0, activity: 0, attendance: "present", scores: { tx1: null, tx2: null, tx3: null, mid: null, practice: null, final: null } }));
    setData({ ...data, students: [...data.students,...added], classes: data.classes.map((item) => item.id === classroom.id ? { ...item, studentIds: [...(item.studentIds ?? []),...added.map((student) => student.id)] } : item) });
    const skipped = rows.length - valid.length;
    toast.success(`Đã thêm ${added.length} học sinh vào ${classroom.name}${skipped > 0 ? `, bỏ qua ${skipped} dòng trống hoặc trùng` : ""}.`);
  };
  const deleteStudent = (studentId: string, studentName: string) => {
    if (!classroom) return;
    setData({
      ...data,
      students: data.students.filter((item) => item.id !== studentId),
      classes: data.classes.map((item) => item.id === classroom.id ? { ...item, studentIds: (item.studentIds ?? []).filter((id) => id !== studentId) } : item),
    });
    toast.success(`Đã xóa học sinh ${studentName} khỏi lớp.`);
  };
  const saveEditedStudent = () => {
    if (!editingStudent || !editingStudent.name.trim()) return toast.error("Vui lòng nhập họ và tên học sinh.");
    setData({
      ...data,
      students: data.students.map((item) => item.id === editingStudent.id ? { ...editingStudent, name: editingStudent.name.trim() } : item),
    });
    setEditingStudent(null);
    toast.success("Đã cập nhật thông tin học sinh.");
  };
  const addPasted = () => { addStudents(pasted.split(/\r?\n/).filter(Boolean).map((line) => { const [name,gender,parentName,parentPhone,note] = parseDelimitedRow(line); return { name,gender,parentName,parentPhone,note }; })); setPasted(""); };
  const addManual = () => { if (!form.name.trim()) return toast.error("Vui lòng nhập họ và tên học sinh."); addStudents([form]); setForm({ name: "", gender: "Nữ", parentName: "", parentPhone: "", note: "" }); };
  const importCsv = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) return toast.error("Tệp vượt quá 5 MB. Vui lòng chia nhỏ danh sách.");
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const { readSheet } = await import("read-excel-file/browser");
        const rows = await readSheet(file);
        const body = /họ|ho|name/i.test(String(rows[0]?.[0] ?? "")) ? rows.slice(1) : rows;
        addStudents(body.map((row) => ({ name: String(row[0] ?? ""), gender: String(row[1] ?? ""), parentName: String(row[2] ?? ""), parentPhone: String(row[3] ?? ""), note: String(row[4] ?? "") })));
      } else {
        const text = await file.text(); const lines = text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean); const body = /họ|ho|name/i.test(lines[0] ?? "") ? lines.slice(1) : lines;
        addStudents(body.map((line) => { const [name,gender,parentName,parentPhone,note] = parseDelimitedRow(line); return { name,gender,parentName,parentPhone,note }; }));
      }
    } catch { toast.error("Không đọc được tệp. Vui lòng dùng đúng file .xlsx hoặc CSV theo mẫu."); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const downloadTemplate = () => { const content = "Họ và tên,Giới tính,Họ tên phụ huynh,Số điện thoại,Ghi chú\nNguyễn Văn An,Nam,Nguyễn Văn Bình,0901234567,"; const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "mau-danh-sach-hoc-sinh.csv"; link.click(); URL.revokeObjectURL(url); };
  return <><Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="student-dialog"><DialogHeader><DialogTitle className="dialog-title"><UserRoundPlus /> Quản lý & nhập danh sách học sinh · {classroom?.name}</DialogTitle><DialogDescription>Dữ liệu được lưu trên trình duyệt của thiết bị này.</DialogDescription></DialogHeader><Tabs defaultValue="paste"><TabsList className="student-tabs"><TabsTrigger value="file"><FileSpreadsheet /> Tải tệp Excel / CSV</TabsTrigger><TabsTrigger value="paste"><ClipboardCheck /> Dán từ Excel / Sheets</TabsTrigger><TabsTrigger value="manual"><Plus /> Thêm thủ công 1 HS</TabsTrigger><TabsTrigger value="list"><UsersRound /> Danh sách {current.length} HS</TabsTrigger></TabsList>
    <TabsContent value="file" className="tab-panel"><input ref={fileRef} type="file" accept=".xlsx,.csv,.txt" hidden onChange={(event) => importCsv(event.target.files?.[0])} /><button className="upload-zone" onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void importCsv(event.dataTransfer.files?.[0]); }}><Upload /><strong>Kéo thả hoặc bấm để tải danh sách Excel / CSV</strong><span>Hỗ trợ tệp .xlsx, .csv và dữ liệu xuất từ Google Sheets, tối đa 5 MB.</span><b>Chọn tệp danh sách</b></button><div className="template-row"><div><strong>Chưa có file đúng định dạng?</strong><p>Tải file mẫu gồm 5 cột thông tin cơ bản.</p></div><Button variant="outline" onClick={downloadTemplate}><Download /> Tải file mẫu (.csv)</Button></div></TabsContent>
    <TabsContent value="paste" className="tab-panel"><label>Sao chép các cột từ Excel/Google Sheets rồi dán vào đây<textarea rows={7} value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={"Nguyễn Văn An\tNam\tNguyễn Văn Bình\t0901234567\nTrần Thị Mai\tNữ\tTrần Văn Nam\t0912345678"} /></label><Button className="wide" onClick={addPasted}><ClipboardCheck /> Xác nhận và thêm danh sách học sinh</Button></TabsContent>
    <TabsContent value="manual" className="tab-panel"><div className="two-col-form"><label>Họ và tên học sinh *<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập họ tên học sinh" /></label><label>Giới tính<Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value as Student["gender"] })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Nữ">Nữ</SelectItem><SelectItem value="Nam">Nam</SelectItem><SelectItem value="Khác">Khác</SelectItem></SelectContent></Select></label><label>Họ tên phụ huynh<input value={form.parentName} onChange={(event) => setForm({ ...form, parentName: event.target.value })} placeholder="Nhập họ tên phụ huynh" /></label><label>Số điện thoại phụ huynh<input value={form.parentPhone} onChange={(event) => setForm({ ...form, parentPhone: event.target.value })} placeholder="Nhập số điện thoại liên hệ" /></label></div><label>Ghi chú cá biệt / sức khỏe / môn học<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Ghi chú thêm nếu có" /></label><Button className="wide" onClick={addManual}><Plus /> Thêm học sinh vào danh sách</Button></TabsContent>
    <TabsContent value="list" className="tab-panel student-list-panel">
      {editingStudent ? (
        <div style={{ display: "grid", gap: "12px", padding: "14px", border: "1px solid var(--border)", borderRadius: "12px", background: "#f8fbf9" }}>
          <strong>Chỉnh sửa học sinh: {editingStudent.name}</strong>
          <div className="two-col-form">
            <label>Họ và tên *<input value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} /></label>
            <label>Giới tính
              <Select value={editingStudent.gender} onValueChange={(v) => setEditingStudent({ ...editingStudent, gender: v as Student["gender"] })}>
                <SelectTrigger className="field"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Nữ">Nữ</SelectItem><SelectItem value="Nam">Nam</SelectItem><SelectItem value="Khác">Khác</SelectItem></SelectContent>
              </Select>
            </label>
            <label>Họ tên phụ huynh<input value={editingStudent.parentName} onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })} /></label>
            <label>SĐT phụ huynh<input value={editingStudent.parentPhone} onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} /></label>
          </div>
          <label>Ghi chú<input value={editingStudent.note} onChange={(e) => setEditingStudent({ ...editingStudent, note: e.target.value })} /></label>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setEditingStudent(null)}>Hủy</Button>
            <Button onClick={saveEditedStudent}><Save /> Lưu thay đổi</Button>
          </div>
        </div>
      ) : (
        current.map((student, index) => (
          <div className="student-list-row" key={student.id}>
            <span>{index + 1}</span>
            <div>
              <strong>{student.name}</strong>
              <small>{student.gender} · {student.parentPhone || "Chưa có SĐT phụ huynh"}</small>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${student.name}`} onClick={() => setEditingStudent({ ...student })}>
                <Pencil />
              </Button>
              <Button size="icon-sm" variant="ghost" style={{ color: "var(--destructive)" }} aria-label={`Xóa ${student.name}`} onClick={() => setPendingDelete({ id: student.id, name: student.name })}>
                <UserX />
              </Button>
            </div>
          </div>
        ))
      )}
      {!current.length && <div className="empty-state"><UsersRound /><strong>Chưa có học sinh</strong><p>Chọn một phương thức nhập ở phía trên để bắt đầu.</p></div>}
    </TabsContent>
    </Tabs><DialogFooter><span className="dialog-count">Tổng số học sinh lớp: <strong>{current.length}</strong></span><Button variant="ghost" onClick={onClose}>Đóng</Button><Button onClick={() => { onClose(); toast.success("Danh sách học sinh đã được lưu."); }}><Save /> Hoàn tất</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={!!pendingDelete} onOpenChange={(value) => !value && setPendingDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa học sinh khỏi lớp?</AlertDialogTitle><AlertDialogDescription>Bạn sắp xóa {pendingDelete?.name} khỏi {classroom?.name}. Thao tác này cũng xóa điểm số và dữ liệu hoạt động của học sinh trên thiết bị này.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="danger-confirm" onClick={() => { if (pendingDelete) deleteStudent(pendingDelete.id, pendingDelete.name); setPendingDelete(null); }}>Xác nhận xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

function ReportsPage({ data, students, classroom, navigate, openProfile }: { data: AppData; students: Student[]; classroom: Classroom; navigate: (key: string) => void; openProfile: (studentId: string) => void }) {
  const rows = students.map((student) => {
    const evalTT22 = evaluateStudentTT22(student.scores, data.scoreWeights);
    return {
      student,
      avg: evalTT22.average,
      evalTT22,
      trend: scoreTrend(student),
    };
  });
  const graded = rows.filter((item): item is typeof item & { avg: number } => typeof item.avg === "number");
  const classAverage = graded.length ? graded.reduce((sum, item) => sum + item.avg, 0) / graded.length : null;
  const needsAttention = rows.filter(({ student, avg }) => student.attendance === "absent" || student.attendance === "late" || (avg !== null && avg < 6.5) || student.activity < 3);
  const excellent = graded.filter((item) => item.evalTT22.rank === "Tốt").length;
  const present = students.filter((student) => student.attendance === "present").length;
  
  // Phân bố theo chuẩn Thông tư 22/2021/TT-BGDĐT
  const distributionTT22 = [
    { label: "Mức Tốt", count: graded.filter((item) => item.evalTT22.rank === "Tốt").length, tone: "great", desc: "ĐTB ≥ 8,0 & Min ≥ 6,5", badge: "rank-tot" },
    { label: "Mức Khá", count: graded.filter((item) => item.evalTT22.rank === "Khá").length, tone: "good", desc: "ĐTB ≥ 6,5 & Min ≥ 5,0", badge: "rank-kha" },
    { label: "Mức Đạt", count: graded.filter((item) => item.evalTT22.rank === "Đạt").length, tone: "medium", desc: "ĐTB ≥ 5,0 & Min ≥ 3,5", badge: "rank-dat" },
    { label: "Chưa đạt", count: graded.filter((item) => item.evalTT22.rank === "Chưa đạt").length, tone: "low", desc: "ĐTB < 5,0 hoặc Min < 3,5", badge: "rank-chuadat" },
  ];

  const reasonFor = ({ student, avg, evalTT22 }: typeof rows[number]) => {
    const reasons: string[] = [];
    if (student.attendance === "absent") reasons.push("Vắng học");
    if (student.attendance === "late") reasons.push("Đi muộn");
    if (evalTT22.hasSubMinimumScore) reasons.push(evalTT22.reason);
    else if (avg !== null && avg < 6.5) reasons.push(`ĐTB ${avg.toFixed(1)}`);
    if (student.activity < 3) reasons.push("Ít tương tác");
    return reasons;
  };

  return <div className="stack-xl">
    <section className="report-hero"><div><span className="eyebrow"><BarChart3 /> BÁO CÁO TIẾN BỘ & ĐÁNH GIÁ THÔNG TƯ 22</span><h1>{classroom.name} · {data.subject}</h1><p>Tổng hợp điểm số, mức độ tham gia, trạng thái điểm danh và kết quả xếp loại theo Thông tư 22/2021/TT-BGDĐT.</p></div><div className="report-hero-score"><small>Điểm trung bình lớp</small><strong>{classAverage?.toFixed(1) ?? "—"}</strong><span>{graded.length}/{students.length} học sinh có điểm</span></div></section>
    <section className="report-kpis"><article><span className="kpi-icon green"><BarChart3 /></span><div><small>ĐTB môn lớp</small><strong>{classAverage?.toFixed(1) ?? "—"}</strong></div></article><article><span className="kpi-icon purple"><Medal /></span><div><small>Mức Tốt (TT22)</small><strong>{excellent} HS</strong></div></article><article><span className="kpi-icon amber"><AlertTriangle /></span><div><small>Cần chú ý</small><strong>{needsAttention.length} HS</strong></div></article><article><span className="kpi-icon blue"><UserCheck /></span><div><small>Có mặt</small><strong>{present}/{students.length}</strong></div></article></section>
    <section className="report-grid">
      <article className="surface distribution-card">
        <div className="card-heading"><div><h2>Cơ cấu Xếp loại theo Thông tư 22</h2><p>Đánh giá kết hợp ĐTB và điểm khống chế thành phần</p></div><BarChart3 /></div>
        <div className="distribution-bars">
          {distributionTT22.map((item) => (
            <div className="distribution-row" key={item.label}>
              <span style={{ minWidth: "120px" }}>
                <strong className={`rank-badge ${item.badge}`} style={{ marginRight: "6px" }}>{item.label}</strong>
              </span>
              <div><i className={item.tone} style={{ width: `${graded.length ? Math.max(6, item.count / graded.length * 100) : 0}%` }} /></div>
              <strong>{item.count} HS <small style={{ color: "#64748b", fontWeight: "normal" }}>({graded.length ? Math.round(item.count / graded.length * 100) : 0}%)</small></strong>
            </div>
          ))}
        </div>
      </article>
      <article className="surface attention-panel"><div className="card-heading"><div><h2>Học sinh cần chú ý & Điểm khống chế</h2><p>Cảnh báo chuyên cần và hạ mức theo TT22</p></div><AlertTriangle /></div><div className="attention-list">{needsAttention.slice(0, 6).map((row) => <div className="attention-item" key={row.student.id}><span>{row.student.name.split(" ").at(-1)?.[0]}</span><div><strong>{row.student.name}</strong><p>{reasonFor(row).map((reason) => <i key={reason}>{reason}</i>)}</p></div><button aria-label={`Mở hồ sơ ${row.student.name}`} onClick={() => openProfile(row.student.id)}><ChevronRight /></button></div>)}{!needsAttention.length && <div className="report-empty"><Check /> Chưa có cảnh báo cần xử lý.</div>}</div><p className="rule-note"><ShieldCheck /> Tiêu chuẩn TT22: Tốt (ĐTB ≥8,0; Min ≥6,5); Khá (ĐTB ≥6,5; Min ≥5,0); Đạt (ĐTB ≥5,0; Min ≥3,5).</p></article>
    </section>
    <section className="surface progress-table-card">
      <div className="section-toolbar"><div><h2>Tiến bộ & Xếp loại từng học sinh</h2><p>Theo dõi xu hướng và kết quả xếp loại Thông tư 22</p></div><Button variant="outline" onClick={() => navigate("grades")}><Table2 /> Mở sổ điểm</Button></div>
      <div className="progress-table-wrap">
        <table className="progress-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>ĐTB môn</th>
              <th>Xếp loại TT22</th>
              <th>Xu hướng</th>
              <th>Hoạt động</th>
              <th>Điểm danh</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, avg, evalTT22, trend }) => {
              const attention = needsAttention.some((item) => item.student.id === student.id);
              return (
                <tr key={student.id}>
                  <td><strong>{student.name}</strong><small>{student.gender} · {classroom.name}</small></td>
                  <td><b>{avg?.toFixed(1) ?? "—"}</b></td>
                  <td>
                    <span className={`rank-badge ${evalTT22.colorClass}`} title={evalTT22.reason}>
                      {evalTT22.rank}
                    </span>
                  </td>
                  <td><span className={`trend ${trend > 0 ? "up" : trend < 0 ? "down" : "flat"}`}>{trend > 0 ? "+" : ""}{trend.toFixed(1)}</span></td>
                  <td>+{student.activity}đ</td>
                  <td><span className={`attendance-badge ${student.attendance}`}>{attendanceLabel[student.attendance]}</span></td>
                  <td><span className={`student-status ${attention ? "attention" : "steady"}`}>{attention ? "Cần chú ý" : "Ổn định"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}

function AssistantPage({ data, setData, students, classroom, selectedId, setSelectedId }: { data: AppData; setData: DataSetter; students: Student[]; classroom: Classroom; selectedId: string; setSelectedId: (studentId: string) => void }) {
  const [activeTab, setActiveTab] = useState<"comment" | "zalo">("comment");
  const [tone, setTone] = useState<"encouraging" | "academic" | "short">("encouraging");
  const [zaloScenario, setZaloScenario] = useState<ZaloScenario>("khen-ngoi");
  const [comment, setComment] = useState("");
  const [zaloMsg, setZaloMsg] = useState("");
  const [aiSource, setAiSource] = useState<"smart-rule" | "gemini">("smart-rule");
  const [isGenerating, setIsGenerating] = useState(false);

  const student = students.find((item) => item.id === selectedId) ?? students[0];
  if (!student) return <div className="surface empty-state"><Bot /><h2>Chưa có dữ liệu để tạo nhận xét</h2><p>Hãy thêm học sinh vào {classroom.name} trước.</p></div>;

  const contextData = {
    teacherName: data.teacherName,
    schoolName: data.schoolName,
    subject: data.subject,
    className: classroom.name,
    semester: data.semester,
    schoolYear: data.schoolYear,
    scoreWeights: data.scoreWeights,
  };

  const handleGenerateComment = async () => {
    setIsGenerating(true);
    try {
      const res = await generateWithGeminiOrFallback(student, contextData, tone, data.geminiApiKey);
      setComment(res.text);
      setAiSource(res.source);
      toast.success(res.source === "gemini" ? "Đã tạo nhận xét bằng Gemini AI!" : "Đã tạo nhận xét sư phạm (Sandwich Feedback)!");
    } catch {
      const fallback = generateSandwichFeedback(student, contextData, tone);
      setComment(fallback);
      setAiSource("smart-rule");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateZalo = (scenario: ZaloScenario) => {
    setZaloScenario(scenario);
    const text = generateZaloMessage(student, contextData, scenario);
    setZaloMsg(text);
  };

  // Tự động tạo tin nhắn Zalo khi chọn học sinh hoặc mở tab Zalo
  const currentZaloText = zaloMsg || generateZaloMessage(student, contextData, zaloScenario);

  const copyComment = async () => {
    if (!comment) return toast.info("Hãy tạo nhận xét trước khi sao chép.");
    try {
      await navigator.clipboard.writeText(comment);
      toast.success("Đã sao chép nhận xét.");
    } catch {
      toast.error("Không thể sao chép trên trình duyệt này.");
    }
  };

  const copyZalo = async () => {
    try {
      await navigator.clipboard.writeText(currentZaloText);
      toast.success("Đã sao chép tin nhắn Zalo! Hãy mở Zalo và dán (Ctrl+V) gửi phụ huynh.");
    } catch {
      toast.error("Không thể sao chép trên trình duyệt này.");
    }
  };

  const saveComment = () => {
    if (!comment.trim()) return toast.info("Hãy tạo hoặc nhập nhận xét trước khi lưu.");
    setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, note: comment.trim() } : item) }, `Lưu nhận xét cho ${student.name}`);
    toast.success("Đã lưu nhận xét vào hồ sơ học sinh.");
  };

  return <div className="stack-xl">
    <section className="assistant-hero">
      <div className="assistant-orb"><Bot /></div>
      <div>
        <span>TRỢ LÝ SƯ PHẠM THÔNG MINH</span>
        <h1>Soạn nhận xét học bạ & Tin nhắn Zalo phụ huynh</h1>
        <p>Ứng dụng chuẩn phản hồi sư phạm Sandwich Feedback 3 vế; hỗ trợ 1-click soạn tin nhắn gửi phụ huynh học sinh.</p>
      </div>
      <div className="local-badge">
        <ShieldCheck />
        <span>
          <strong>{data.geminiApiKey ? "Gemini AI + Offline" : "Xử lý cục bộ an toàn"}</strong>
          {data.geminiApiKey ? "Đã kích hoạt mô hình Gemini" : "Dữ liệu không rời trình duyệt"}
        </span>
      </div>
    </section>

    {/* Thanh chọn chế độ làm việc */}
    <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid var(--border)", paddingBottom: "8px" }}>
      <button
        className={`chip ${activeTab === "comment" ? "active" : ""}`}
        style={{ fontSize: "15px", padding: "8px 18px" }}
        onClick={() => setActiveTab("comment")}
      >
        <WandSparkles /> 1. Lời phê Học bạ & Sổ liên lạc
      </button>
      <button
        className={`chip ${activeTab === "zalo" ? "active" : ""}`}
        style={{ fontSize: "15px", padding: "8px 18px" }}
        onClick={() => {
          setActiveTab("zalo");
          if (!zaloMsg) handleGenerateZalo(zaloScenario);
        }}
      >
        <MessageCircle /> 2. Soạn tin nhắn Zalo gửi Phụ huynh (1-Click)
      </button>
    </div>

    {activeTab === "comment" ? (
      <section className="assistant-layout">
        <article className="surface assistant-controls">
          <div className="card-heading"><div><h2>1. Chọn học sinh & Phong cách</h2><p>{classroom.name} · {data.subject}</p></div><Sparkles /></div>
          <label className="assistant-student-picker">Học sinh
            <Select value={student.id} onValueChange={(value) => { setSelectedId(value); setComment(""); }}>
              <SelectTrigger className="field"><SelectValue /></SelectTrigger>
              <SelectContent>{students.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#065f46" }}>
            <strong>Cấu trúc chuẩn Sandwich Feedback:</strong>
            <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
              <li>Vế 1: Khen ngợi ưu điểm (nỗ lực, phát biểu, điểm tốt)</li>
              <li>Vế 2: Nhắc nhở khéo léo điểm cần khắc phục</li>
              <li>Vế 3: Động viên, khích lệ và định hướng giải pháp</li>
            </ul>
          </div>
          <label className="assistant-tone">Phong cách sư phạm
            <Select value={tone} onValueChange={(val) => setTone(val as typeof tone)}>
              <SelectTrigger className="field"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="encouraging">Tích cực, khích lệ truyền cảm hứng</SelectItem>
                <SelectItem value="academic">Trang trọng, chuẩn mực học bạ</SelectItem>
                <SelectItem value="short">Ngắn gọn, súc tích</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <Button className="generate-button" disabled={isGenerating} onClick={handleGenerateComment}>
            <WandSparkles /> {isGenerating ? "Đang suy nghĩ..." : "Tạo bản nháp nhận xét"}
          </Button>
        </article>

        <article className="surface assistant-output">
          <div className="card-heading">
            <div>
              <h2>2. Kiểm tra và hoàn thiện</h2>
              <p>Có thể chỉnh sửa trực tiếp trước khi lưu vào hồ sơ</p>
            </div>
            <span className="draft-badge">
              {aiSource === "gemini" ? "GEMINI AI" : "SANDWICH FEEDBACK"}
            </span>
          </div>
          <div className="student-context">
            <span>{student.name.split(" ").at(-1)?.[0]}</span>
            <div>
              <strong>{student.name}</strong>
              <small>{classroom.name} · {evaluateStudentTT22(student.scores, data.scoreWeights).rank} (ĐTB {evaluateStudentTT22(student.scores, data.scoreWeights).average?.toFixed(1) ?? "—"}) · +{student.activity}đ hoạt động</small>
            </div>
          </div>
          <textarea rows={10} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Bấm “Tạo bản nháp nhận xét” để tự động soạn lời phê..." />
          <div className="assistant-output-actions">
            <Button variant="outline" onClick={copyComment}><Copy /> Sao chép</Button>
            <Button onClick={saveComment}><Save /> Lưu vào hồ sơ</Button>
          </div>
          <p className="assistant-disclaimer"><AlertTriangle /> Giáo viên luôn là người đọc lại, điều chỉnh ngữ cảnh và chịu trách nhiệm về nội dung nhận xét trước khi gửi đi.</p>
        </article>
      </section>
    ) : (
      <section className="assistant-layout">
        <article className="surface assistant-controls">
          <div className="card-heading">
            <div>
              <h2>1. Chọn kịch bản tin nhắn</h2>
              <p>Phụ huynh: {student.parentName || "Gia đình em"} {student.parentPhone ? `(${student.parentPhone})` : ""}</p>
            </div>
            <MessageCircle />
          </div>

          <label className="assistant-student-picker">Học sinh
            <Select value={student.id} onValueChange={(value) => { setSelectedId(value); setZaloMsg(""); }}>
              <SelectTrigger className="field"><SelectValue /></SelectTrigger>
              <SelectContent>{students.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>

          <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginTop: "8px" }}>
            Chọn mục đích gửi tin nhắn:
          </span>

          <div className="zalo-scenario-grid">
            <button
              type="button"
              className={`zalo-scenario-btn ${zaloScenario === "khen-ngoi" ? "active" : ""}`}
              onClick={() => handleGenerateZalo("khen-ngoi")}
            >
              ⭐ Khen ngợi & Báo tin vui
              <small>Hăng hái phát biểu, điểm cao</small>
            </button>
            <button
              type="button"
              className={`zalo-scenario-btn ${zaloScenario === "nhac-nho" ? "active" : ""}`}
              onClick={() => handleGenerateZalo("nhac-nho")}
            >
              ✍️ Nhắc nhở & Phối hợp
              <small>Ít phát biểu, cần ôn bài</small>
            </button>
            <button
              type="button"
              className={`zalo-scenario-btn ${zaloScenario === "chuyen-can" ? "active" : ""}`}
              onClick={() => handleGenerateZalo("chuyen-can")}
            >
              📅 Báo vắng / Đi muộn
              <small>Chuyên cần trong tiết dạy</small>
            </button>
            <button
              type="button"
              className={`zalo-scenario-btn ${zaloScenario === "tong-ket" ? "active" : ""}`}
              onClick={() => handleGenerateZalo("tong-ket")}
            >
              📊 Báo cáo định kỳ
              <small>ĐTB, Xếp loại TT22, nhận xét</small>
            </button>
          </div>
        </article>

        <article className="surface assistant-output">
          <div className="card-heading">
            <div>
              <h2>2. Xem trước tin nhắn Zalo chuẩn mực</h2>
              <p>Đã điền sẵn thông tin giáo viên, môn học và số liệu của em</p>
            </div>
            <span className="live-badge" style={{ background: "#2563eb" }}>ZALO FORMAT</span>
          </div>

          <textarea
            rows={12}
            className="zalo-bubble"
            style={{ width: "100%", resize: "vertical" }}
            value={currentZaloText}
            onChange={(e) => setZaloMsg(e.target.value)}
          />

          <div className="assistant-output-actions" style={{ marginTop: "12px" }}>
            <Button
              size="lg"
              onClick={copyZalo}
              style={{ background: "#0284c7", color: "#ffffff", fontWeight: 700 }}
            >
              <Copy /> Sao chép tin nhắn Zalo (1-Click)
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("https://chat.zalo.me", "_blank")}
            >
              <Send /> Mở Zalo Web
            </Button>
          </div>
          <p className="assistant-disclaimer">
            <Check /> Sau khi bấm sao chép, Thầy/Cô chỉ cần mở cuộc trò chuyện với phụ huynh trên Zalo và bấm <strong>Ctrl + V</strong> để gửi.
          </p>
        </article>
      </section>
    )}
  </div>;
}

function ProfilesPage({ data, students, classroom, navigate, selectedId, setSelectedId }: { data: AppData; students: Student[]; classroom: Classroom; navigate: (key: string) => void; selectedId: string; setSelectedId: (studentId: string) => void }) {
  const student = students.find((item) => item.id === selectedId) ?? students[0];
  if (!student) return <div className="surface empty-state"><UsersRound /><h2>Chưa có học sinh trong {classroom.name}</h2><p>Hãy nhập danh sách học sinh ở trang Lớp học.</p></div>;
  const chartValues = scoreColumns.map((column) => ({ label: column.label.replace("Thường xuyên", "TX"), value: student.scores[column.key] }));
  const evalTT22 = evaluateStudentTT22(student.scores, data.scoreWeights);

  return <div className="profile-layout">
    <aside className="surface profile-card">
      <label className="profile-picker">Học sinh<Select value={student.id} onValueChange={setSelectedId}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{students.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label>
      <div className="avatar">{student.name.split(" ").at(-1)?.[0]}</div><span className="stt">STT {students.findIndex((item) => item.id === student.id) + 1}</span><h1>{student.name}</h1>
      <p>{student.gender} · {classroom.name} · {data.schoolYear} · {attendanceLabel[student.attendance]}</p>
      <div style={{ margin: "8px 0 12px" }}>
        <span className={`rank-badge ${evalTT22.colorClass}`} title={evalTT22.reason} style={{ fontSize: "13px", padding: "4px 12px" }}>
          Xếp loại TT22: {evalTT22.rank}
        </span>
      </div>
      <dl><div><dt>Phụ huynh</dt><dd>{student.parentName || "Chưa cập nhật"}</dd></div><div><dt>Điện thoại</dt><dd>{student.parentPhone || "Chưa cập nhật"}</dd></div></dl>
      <h2>THỐNG KÊ THI ĐUA PHÁT BIỂU</h2><div className="profile-stats"><div className="yellow"><Hand /><strong>{student.hand}</strong><span>Lượt giơ tay</span></div><div className="green"><Check /><strong>{student.correct}</strong><span>Trả lời đúng</span></div><div className="purple"><Star /><strong>{student.praise}</strong><span>Lần xuất sắc</span></div><div className="blue"><Sparkles /><strong>+{student.activity}đ</strong><span>Điểm hoạt động</span></div></div>
    </aside>
    <div className="profile-main stack-lg">
      <section className="surface chart-card">
        <div className="section-toolbar">
          <div><h2><BarChart3 /> Biểu đồ diễn biến điểm kiểm tra môn học</h2><p>Theo thang điểm 10</p></div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong className="average-badge">ĐTB {evalTT22.average?.toFixed(1) ?? "—"}</strong>
            <span className={`rank-badge ${evalTT22.colorClass}`} title={evalTT22.reason}>
              {evalTT22.rank}
            </span>
          </div>
        </div>
        <div className="score-chart">{chartValues.map((item) => <div key={item.label} className="score-bar-item"><span className="score-value">{item.value ?? "—"}</span><div className="score-bar-track"><i style={{ height: `${(item.value ?? 0) * 9}%` }} /></div><small>{item.label}</small></div>)}</div>
      </section>
      <section className="surface comment-card">
        <div className="section-toolbar">
          <div><h2><Sparkles /> Đánh giá & Nhận xét của Giáo viên</h2><p>{student.note || "Chưa có nhận xét riêng cho học sinh này."}</p></div>
          <Button onClick={() => navigate("assistant")}><Sparkles /> Tạo nhận xét cá nhân</Button>
        </div>
      </section>
    </div>
  </div>;
}

function SettingsPage({ data, setData }: { data: AppData; setData: DataSetter }) {
  const [teacherName, setTeacherName] = useState(data.teacherName || "Mai Hoa");
  const [schoolName, setSchoolName] = useState(data.schoolName || "");
  const [subject, setSubject] = useState(data.subject || "Địa lý");
  const [apiKey, setApiKey] = useState(data.geminiApiKey || "");
  const [newClass, setNewClass] = useState("");
  const [newGrade, setNewGrade] = useState("8");
  const backupRef = useRef<HTMLInputElement>(null);
  const subjects = [
    "Địa lý", "KHTN", "Toán học", "Tiếng Anh", "Ngữ văn",
    "Lịch sử & Địa lý", "Sinh học", "Hóa học", "Lịch sử", "Tin học", "Công nghệ", "GDCD"
  ];

  const saveGeneral = () => {
    if (!teacherName.trim()) return toast.error("Vui lòng nhập họ và tên giáo viên.");
    if (!subject.trim()) return toast.error("Vui lòng nhập hoặc chọn môn học.");
    setData(
      {
        ...data,
        title: "SỔ TAY BỘ MÔN",
        teacherName: teacherName.trim(),
        schoolName: schoolName.trim(),
        subject: subject.trim(),
        geminiApiKey: apiKey.trim(),
      },
      "Cập nhật thông tin giáo viên, trường, môn học & khóa API"
    );
    toast.success("Đã lưu thay đổi thông tin giáo viên, trường và môn học.");
  };

  const addClass = () => {
    if (!newClass.trim()) return toast.error("Vui lòng nhập tên lớp.");
    const grade = Number(newGrade);
    const cleanName = newClass.trim().replace(/\s+/g, " ");
    const displayName = /^lớp\s/i.test(cleanName) ? cleanName : `Lớp ${cleanName}`;
    if (data.classes.some((item) => item.name.toLocaleLowerCase("vi") === displayName.toLocaleLowerCase("vi"))) return toast.error("Lớp học này đã tồn tại.");
    setData({ ...data, classes: [...data.classes, { id: `c${Date.now()}`, name: displayName, grade, room: `Phòng ${cleanName}`, studentIds: [] }] });
    setNewClass(""); toast.success("Đã thêm lớp học mới.");
  };
  const resetToSample = () => {
    const restored = cloneInitial();
    setTeacherName(restored.teacherName);
    setSchoolName(restored.schoolName);
    setSubject(restored.subject);
    setApiKey("");
    setData(restored, "Khôi phục dữ liệu mẫu ban đầu");
    toast.success("Đã khôi phục dữ liệu mẫu.");
  };
  const downloadBackup = () => {
    const payload = { version: 2, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `so-tay-${data.schoolYear.replace("–", "-")}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
    toast.success("Đã tải bản sao lưu dữ liệu.");
  };
  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      const wrapped = parsed as { data?: Partial<AppData> };
      const candidate = wrapped.data && typeof wrapped.data === "object" ? wrapped.data : parsed as Partial<AppData>;
      if (!Array.isArray(candidate.classes) || !Array.isArray(candidate.students) || !Array.isArray(candidate.schedule)) throw new Error("invalid");
      const restored = normalizeData(candidate);
      setTeacherName(restored.teacherName);
      setSchoolName(restored.schoolName);
      setSubject(restored.subject);
      setApiKey(restored.geminiApiKey || "");
      setData(restored, "Khôi phục dữ liệu từ bản sao lưu"); toast.success("Đã khôi phục dữ liệu từ bản sao lưu.");
    } catch { toast.error("Tệp sao lưu không hợp lệ hoặc đã bị hỏng."); }
    if (backupRef.current) backupRef.current.value = "";
  };
  return <div className="stack-xl">
    <section className="surface page-title"><div><span className="eyebrow green"><Settings2 /> THIẾT LẬP</span><h1>Thiết lập thông tin giáo viên, trường & môn học</h1><p>Tùy chỉnh thông tin cá nhân giáo viên, đơn vị trường học và bộ môn giảng dạy.</p></div></section>
    <section className="surface settings-section">
      <div className="section-toolbar">
        <div>
          <h2><BookOpenCheck /> Thiết lập Giáo viên, Trường & Môn học</h2>
          <p>Tên hiển thị mặc định: <strong>SỔ TAY BỘ MÔN</strong></p>
        </div>
        <Button className="purple-action" onClick={saveGeneral}><Save /> Lưu thay đổi</Button>
      </div>

      <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.22)", padding: "12px 18px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "var(--muted-foreground, #64748b)" }}>Tên hiển thị sổ tay:</span>
          <strong style={{ fontSize: "16px", color: "#065f46", letterSpacing: "0.5px" }}>SỔ TAY BỘ MÔN</strong>
        </div>
        <span style={{ fontSize: "11px", background: "#10b981", color: "#ffffff", padding: "3px 10px", borderRadius: "12px", fontWeight: 700 }}>
          Mặc định hệ thống
        </span>
      </div>

      <div className="settings-grid">
        <label>
          Tên giáo viên *
          <input
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            placeholder="Nhập tên giáo viên (VD: Mai Hoa, Nguyễn Văn An...)"
          />
        </label>
        <label>
          Trường
          <input
            value={schoolName}
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Nhập tên trường học (VD: THCS Chu Văn An, THPT Lê Lợi...)"
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        <label>
          Môn học *
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Nhập tên môn học (VD: KHTN, Địa lý, Toán học...)"
          />
        </label>
        <span className="field-label" style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
          Hoặc bấm chọn nhanh môn học:
        </span>
        <div className="chip-row subjects">
          {subjects.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSubject(item)}
              className={subject === item ? "chip active" : "chip"}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
        <Button onClick={saveGeneral}><Save /> Lưu thay đổi</Button>
      </div>
    </section>

    {/* Cấu hình Gemini API Key tùy chọn */}
    <section className="surface settings-section">
      <div className="section-toolbar">
        <div>
          <h2><KeyRound /> Khóa Google Gemini API (Tùy chọn)</h2>
          <p>Kích hoạt trí tuệ nhân tạo thế hệ mới (Gemini Flash) cho mục Trợ lý sư phạm</p>
        </div>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--muted-foreground, #64748b)", lineHeight: 1.6 }}>
        Nếu để trống, Trợ lý AI vẫn hoạt động 100% ngoại tuyến (Offline) thông qua thuật toán quy chuẩn Sandwich Feedback sư phạm an toàn tuyệt đối. Nếu Thầy/Cô nhập khóa API Gemini, ứng dụng sẽ sinh lời phê cá nhân hóa sâu sắc và phong phú hơn.
      </p>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Nhập khóa API Gemini (ví dụ: AIzaSy...)"
          style={{ flex: 1, minWidth: "260px" }}
        />
        <Button onClick={() => {
          setData({ ...data, geminiApiKey: apiKey.trim() }, "Cập nhật khóa Google Gemini API");
          toast.success(apiKey.trim() ? "Đã lưu khóa API Gemini!" : "Đã chuyển về chế độ AI Ngoại tuyến an toàn.");
        }}>
          <Save /> Lưu khóa API
        </Button>
      </div>
    </section>

    <section className="surface settings-section"><h2><CalendarDays /> Quản lý & Chọn Năm học</h2><div className="settings-grid"><label>Năm học<Select value={data.schoolYear} onValueChange={(value) => setData({ ...data, schoolYear: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2025–2026">2025–2026</SelectItem><SelectItem value="2026–2027">2026–2027</SelectItem></SelectContent></Select></label><label>Học kỳ<Select value={data.semester} onValueChange={(value) => setData({ ...data, semester: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Học kỳ I">Học kỳ I</SelectItem><SelectItem value="Học kỳ II">Học kỳ II</SelectItem></SelectContent></Select></label></div></section>
    <section className="surface settings-section"><h2><BookOpenCheck /> Hệ số công thức tính điểm môn học</h2><div className="weight-grid">{scoreColumns.map((column) => <label key={column.key}><strong>{column.label}</strong><span>Hệ số tính ĐTB</span><Select value={String(data.scoreWeights[column.key])} onValueChange={(value) => setData({ ...data, scoreWeights: { ...data.scoreWeights, [column.key]: Number(value) } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Hệ số 1</SelectItem><SelectItem value="2">Hệ số 2</SelectItem><SelectItem value="3">Hệ số 3</SelectItem></SelectContent></Select></label>)}</div></section>
    <section className="surface settings-section"><h2><Plus /> Quản lý & Thêm lớp học mới</h2><div className="add-class-row"><Select value={newGrade} onValueChange={setNewGrade}><SelectTrigger aria-label="Khối lớp mới"><SelectValue /></SelectTrigger><SelectContent>{[6,7,8,9,10,11,12].map((item) => <SelectItem key={item} value={String(item)}>Khối {item}</SelectItem>)}</SelectContent></Select><input value={newClass} onChange={(event) => setNewClass(event.target.value)} placeholder="Tên lớp (VD: 11B2, 11B3...)" /><Button onClick={addClass}><Plus /> Thêm lớp</Button></div><div className="existing-classes">{data.classes.map((item) => <span key={item.id}>{item.name} (Khối {item.grade})</span>)}</div></section>
    <section className="backup-grid"><article className="surface backup-card"><div className="card-heading"><div><h2><DatabaseBackup /> Sao lưu & khôi phục</h2><p>Tạo một tệp chứa toàn bộ dữ liệu đang lưu trên trình duyệt.</p></div><ShieldCheck /></div><div className="backup-actions"><Button onClick={downloadBackup}><Download /> Tải bản sao lưu</Button><input ref={backupRef} type="file" accept=".json,application/json" hidden onChange={(event) => restoreBackup(event.target.files?.[0])} /><Button variant="outline" onClick={() => backupRef.current?.click()}><Upload /> Khôi phục từ tệp</Button></div><small>Dữ liệu chỉ được đọc hoặc ghi khi giáo viên chủ động thao tác.</small></article><article className="surface history-card"><div className="card-heading"><div><h2><FileClock /> Lịch sử chỉnh sửa</h2><p>{data.auditLog.length} hoạt động gần nhất được lưu cục bộ</p></div><span className="history-count">{Math.min(data.auditLog.length, 80)}/80</span></div><div className="history-list">{data.auditLog.slice(0, 12).map((entry) => <div className="history-item" key={entry.id}><i /><div><strong>{entry.action}</strong><small>{new Date(entry.at).toLocaleString("vi-VN")}</small></div></div>)}{!data.auditLog.length && <div className="history-empty"><FileClock /> Chưa có thay đổi nào trong phiên bản này.</div>}</div></article></section>
    <section className="danger-zone"><div><strong>Khôi phục dữ liệu mẫu ban đầu</strong><p>Đặt lại toàn bộ lớp, học sinh, thời khóa biểu và điểm số. Nên tải bản sao lưu trước khi thực hiện.</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><RotateCcw /> Đặt lại dữ liệu</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Khôi phục toàn bộ dữ liệu mẫu?</AlertDialogTitle><AlertDialogDescription>Mọi thay đổi đang lưu trên trình duyệt sẽ bị thay thế. Bạn có thể khôi phục lại nếu đã tải bản sao lưu.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={resetToSample}>Xác nhận đặt lại</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section>
  </div>;
}
