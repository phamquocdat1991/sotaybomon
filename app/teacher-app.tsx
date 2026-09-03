"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, BarChart3, BookOpenCheck, Bot, CalendarDays, Check, ChevronLeft,
  ChevronRight, ClipboardCheck, Clock3, Copy, DatabaseBackup, Download, FileClock,
  FileSpreadsheet, Hand, LayoutDashboard, ListChecks, Medal, Megaphone, Pencil,
  Plus, RotateCcw, Save, Search, Settings2, ShieldCheck, Smartphone, Sparkles,
  Star, Table2, ThumbsUp, Upload, UserCheck, UserRound, UserRoundPlus, UsersRound,
  UserX, WandSparkles, X,
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
import { readSheet } from "read-excel-file/browser";

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
type ScheduleEntry = { id: string; day: number; period: number; classId: string; room: string; note: string };
type AuditEntry = { id: string; at: string; action: string };
type AppData = {
  title: string; teacherName: string; schoolName: string;
  schoolYear: string; semester: string; subject: string;
  classes: Classroom[]; students: Student[]; schedule: ScheduleEntry[];
  scoreWeights: Record<string, number>;
  auditLog: AuditEntry[];
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
    schedule: Array.isArray(value.schedule) ? value.schedule : fallback.schedule,
    scoreWeights: { ...fallback.scoreWeights, ...(value.scoreWeights ?? {}) },
    auditLog: Array.isArray(value.auditLog) ? value.auditLog : [],
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

export default function TeacherApp() {
  const [data, setStore] = useState<AppData>(initialData);
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState<PageKey>("dashboard");
  const [activeClassId, setActiveClassId] = useState("c8a2");
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) setStore(normalizeData(JSON.parse(saved) as Partial<AppData>)); }
    catch { toast.error("Không thể đọc dữ liệu đã lưu trên trình duyệt."); }
    finally { setHydrated(true); }
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(storageKey, JSON.stringify(data)); }, [data, hydrated]);
  const setData: DataSetter = (next, action) => setStore((previous) => ({
    ...next,
    auditLog: [{ id: `log${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), action: action ?? describeChange(previous, next) }, ...(next.auditLog ?? previous.auditLog ?? [])].slice(0, 80),
  }));
  const activeClass = data.classes.find((item) => item.id === activeClassId) ?? data.classes[0];
  const activeStudents = data.students.filter((item) => item.classId === activeClass?.id);
  const navigate = (key: string) => {
    setPage(key as PageKey); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (!activeClass) return null;
  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-main">
        <button className="brand" onClick={() => navigate("dashboard")} aria-label="Về trang tổng quan">
          <span className="brand-mark"><BookOpenCheck /></span>
          <span className="brand-copy"><strong>SỔ TAY BỘ MÔN</strong><small>GV: {data.teacherName || "Mai Hoa"}{data.schoolName ? ` · ${data.schoolName}` : ""} · {data.subject || "Địa lý"}</small></span>
          <span className="edition">QUẢN LÝ 4.0</span>
        </button>
        <div className="context-bar">
          <Select value={data.schoolYear} onValueChange={(value) => setData({ ...data, schoolYear: value })}>
            <SelectTrigger className="context-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2025–2026">Năm 2025–2026</SelectItem><SelectItem value="2026–2027">Năm 2026–2027</SelectItem></SelectContent>
          </Select>
          <Select value={data.semester} onValueChange={(value) => setData({ ...data, semester: value })}>
            <SelectTrigger className="context-select semester"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Học kỳ I">Học kỳ I</SelectItem><SelectItem value="Học kỳ II">Học kỳ II</SelectItem></SelectContent>
          </Select>
          <Select value={activeClassId} onValueChange={setActiveClassId}>
            <SelectTrigger className="context-select class-picker"><span className="select-prefix">Lớp</span><SelectValue /></SelectTrigger><SelectContent>{data.classes.map((item) => <SelectItem value={item.id} key={item.id}>{item.name} · Khối {item.grade}</SelectItem>)}</SelectContent>
          </Select>
          <Button className="purple-action" onClick={() => navigate("assistant")}><Sparkles /> Trợ lý AI</Button>
          <Button className="start-action" onClick={() => setPage("lesson")}><Clock3 /> Bắt đầu tiết học</Button>
        </div>
        <Button className="mobile-menu" size="icon" variant="ghost" onClick={() => setMobileNav(!mobileNav)} aria-label="Mở điều hướng">{mobileNav ? <X /> : <ListChecks />}</Button>
      </div>
      <nav className={mobileNav ? "main-nav is-open" : "main-nav"} aria-label="Điều hướng chính">
        {navItems.map(([key,label,Icon]) => <button key={key} className={page === key ? "active" : ""} onClick={() => navigate(key)}><Icon /><span>{label}</span></button>)}
      </nav>
    </header>
    <main className="page-wrap">
      {page === "dashboard" && <Dashboard data={data} setData={setData} activeClass={activeClass} setActiveClassId={setActiveClassId} navigate={navigate} />}
      {page === "schedule" && <SchedulePage data={data} setData={setData} activeClassId={activeClassId} />}
      {page === "lesson" && <LessonPage data={data} setData={setData} classroom={activeClass} students={activeStudents} />}
      {page === "grades" && <GradesPage data={data} setData={setData} classroom={activeClass} students={activeStudents} />}
      {page === "classes" && <ClassesPage data={data} setData={setData} setActiveClassId={setActiveClassId} navigate={navigate} />}
      {page === "profiles" && <ProfilesPage data={data} students={activeStudents} classroom={activeClass} navigate={navigate} />}
      {page === "report" && <ReportsPage data={data} classroom={activeClass} students={activeStudents} navigate={navigate} />}
      {page === "assistant" && <AssistantPage data={data} setData={setData} classroom={activeClass} students={activeStudents} />}
      {page === "settings" && <SettingsPage data={data} setData={setData} />}
    </main>
    <Toaster position="bottom-right" richColors />
  </div>;
}

function Dashboard({ data, setData, activeClass, setActiveClassId, navigate }: {
  data: AppData; setData: (value: AppData) => void; activeClass: Classroom;
  setActiveClassId: (id: string) => void; navigate: (key: string) => void;
}) {
  const [grade, setGrade] = useState<number | "all">("all");
  const [classOpen, setClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({ grade: "8", name: "" });
  const filtered = grade === "all" ? data.classes : data.classes.filter((item) => item.grade === grade);
  const topStudents = data.students.filter((item) => item.praise >= 2).length;
  const activeStudents = data.students.filter((item) => item.activity >= 7).length;
  const createClass = () => {
    if (!newClass.name.trim()) return toast.error("Vui lòng nhập tên lớp.");
    const classroom: Classroom = { id: `c${Date.now()}`, name: newClass.name.trim().startsWith("Lớp") ? newClass.name.trim() : `Lớp ${newClass.name.trim()}`, grade: Number(newClass.grade), room: `Phòng ${newClass.name.trim()}`, studentIds: [] };
    setData({ ...data, classes: [...data.classes, classroom] }); setNewClass({ grade: "8", name: "" }); setClassOpen(false); toast.success("Đã thêm lớp học mới.");
  };
  return <div className="stack-xl">
    <section className="hero-panel">
      <div><span className="eyebrow"><CalendarDays /> {data.semester} · Năm học {data.schoolYear}</span><h1>SỔ TAY BỘ MÔN 360 · BÀN LÀM VIỆC GIÁO VIÊN</h1><p>Theo sát từng lớp học, từng học sinh và từng tiết dạy trong một không gian thống nhất.</p></div>
      <div className="hero-current"><small>Lớp đang chọn</small><strong>{activeClass.name} <span>(Khối {activeClass.grade})</span></strong><p>{data.subject} · {activeClass.room}</p><Button onClick={() => navigate("lesson")}><Clock3 /> Bắt đầu tiết học ngay</Button></div>
    </section>
    <section className="metric-grid">
      <Metric icon={<AlertTriangle />} tone="amber" value={`${data.students.length} học sinh`} label="Tổng số học sinh đang theo dõi" action="Mở hồ sơ học sinh" onClick={() => navigate("profiles")} />
      <Metric icon={<UsersRound />} tone="blue" value={`${activeStudents} học sinh`} label="Đang có hoạt động tích cực" action="Xem theo dõi trong giờ" onClick={() => navigate("lesson")} />
      <Metric icon={<Medal />} tone="green" value={`${topStudents} học sinh`} label="Có thành tích nổi bật" action="Xem danh sách tuyên dương" onClick={() => navigate("profiles")} />
      <Metric icon={<Clock3 />} tone="purple" value={`${data.schedule.length} tiết`} label="Đã thiết lập trong tuần" action="Điền thời khóa biểu" onClick={() => navigate("schedule")} />
    </section>
    <section className="surface class-section">
      <div className="section-toolbar"><div><h2><UsersRound /> Danh sách các Khối & Lớp đang giảng dạy</h2><p>Chọn lớp để theo dõi lịch học, học sinh và sổ điểm.</p></div><div className="toolbar-actions"><div className="chip-row"><button className={grade === "all" ? "chip active" : "chip"} onClick={() => setGrade("all")}>Tất cả</button>{[6,7,8,9,10,11,12].map((item) => <button key={item} className={grade === item ? "chip active" : "chip"} onClick={() => setGrade(item)}>Khối {item}</button>)}</div><Button onClick={() => setClassOpen(true)}><Plus /> Thêm lớp</Button></div></div>
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
  const openSlot = (day: number, period: number) => { const existing = data.schedule.find((item) => item.day === day && item.period === period); setEditing(existing ? { ...existing } : { day, period, classId: activeClassId, room: "", note: "" }); };
  const save = () => {
    if (!editing?.classId || !editing.day || !editing.period) return;
    const selectedClass = data.classes.find((item) => item.id === editing.classId);
    const item: ScheduleEntry = { id: editing.id ?? `e${Date.now()}`, day: editing.day, period: editing.period, classId: editing.classId, room: editing.room?.trim() || selectedClass?.room || "Chưa xếp phòng", note: editing.note?.trim() || "Tiết học Địa lý" };
    setData({ ...data, schedule: editing.id ? data.schedule.map((entry) => entry.id === editing.id ? item : entry) : [...data.schedule, item] }); setEditing(null); toast.success(`Đã lưu Thứ ${item.day} · Tiết ${item.period}.`);
  };
  const remove = () => { if (!editing?.id) return; setData({ ...data, schedule: data.schedule.filter((item) => item.id !== editing.id) }); setEditing(null); toast.success("Đã xóa tiết khỏi thời khóa biểu."); };
  return <div className="stack-xl">
    <section className="week-panel"><div className="week-head"><div><small>NĂM HỌC {data.schoolYear}</small><h1>TUẦN {week} / 38</h1></div><div className="week-nav"><Button size="icon" variant="ghost" onClick={() => setWeek(Math.max(1, week - 1))}><ChevronLeft /></Button><span>Tuần {week} (hiện tại)</span><Button size="icon" variant="ghost" onClick={() => setWeek(Math.min(38, week + 1))}><ChevronRight /></Button></div></div><div className="week-chips">{Array.from({ length: 12 }, (_, index) => index + 1).map((item) => <button className={week === item ? "active" : ""} onClick={() => setWeek(item)} key={item}>T{item}</button>)}</div></section>
    <section className="surface schedule-surface"><div className="schedule-grid"><div className="schedule-header corner">BUỔI / TIẾT</div>{days.map((day) => <div key={day} className="schedule-header">THỨ {day}</div>)}{periods.map((period) => <div className="schedule-row" key={period}><div className="period-label"><span>{period <= 3 ? "BUỔI SÁNG" : "BUỔI CHIỀU"}</span>TIẾT {period}</div>{days.map((day) => { const entry = data.schedule.find((item) => item.day === day && item.period === period); const classroom = data.classes.find((item) => item.id === entry?.classId); return <button key={day} className={entry ? "schedule-cell filled" : "schedule-cell"} onClick={() => openSlot(day, period)}>{entry ? <><span className="schedule-class">{classroom?.name}</span><strong>{data.subject}</strong><small>{entry.room}</small><Pencil /></> : <Plus />}</button>; })}</div>)}</div></section>
    <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle className="dialog-title"><CalendarDays /> Thiết lập tiết dạy · Thứ {editing?.day}</DialogTitle><DialogDescription>Sáng · Tiết {editing?.period}</DialogDescription></DialogHeader><div className="form-stack"><label>Chọn lớp học<Select value={editing?.classId} onValueChange={(value) => setEditing({ ...editing, classId: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{data.classes.map((item) => <SelectItem value={item.id} key={item.id}>{item.name} · Khối {item.grade}</SelectItem>)}</SelectContent></Select></label><label>Môn giảng dạy<input value={data.subject} readOnly /></label><label>Phòng học<input value={editing?.room ?? ""} onChange={(event) => setEditing({ ...editing, room: event.target.value })} placeholder="Nhập phòng học" /></label><label>Ghi chú tiết học<input value={editing?.note ?? ""} onChange={(event) => setEditing({ ...editing, note: event.target.value })} placeholder="Nội dung bài học, dặn dò..." /></label></div><DialogFooter>{editing?.id && <Button variant="destructive" onClick={remove}>Xóa tiết</Button>}<Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button><Button className="purple-action" onClick={save}><Save /> Lưu tiết dạy</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function LessonPage({ data, setData, classroom, students }: { data: AppData; setData: (value: AppData) => void; classroom: Classroom; students: Student[] }) {
  const [query, setQuery] = useState("");
  const [sound, setSound] = useState(true);
  const [quickMode, setQuickMode] = useState(false);
  const [lessonName, setLessonName] = useState("Tiết 14 · Ôn tập và luyện tập bản đồ");
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState<{ studentId: string; previous: Student }[]>([]);
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
    setHistory([...history, { studentId: student.id, previous: { ...student, scores: { ...student.scores } } }]);
    setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, [field]: Math.max(0, item[field] + 1), activity: Math.max(0, item.activity + points) } : item) });
    toast.success(`${student.name}: ${message} (${points > 0 ? "+" : ""}${points}đ)`);
  };
  const undo = () => {
    const last = history.at(-1);
    if (!last) return toast.info("Chưa có thao tác để hoàn tác.");
    setData({ ...data, students: data.students.map((item) => item.id === last.studentId ? last.previous : item) });
    setHistory(history.slice(0, -1)); toast.success("Đã hoàn tác ghi nhận gần nhất.");
  };
  const markAttendance = (student: Student, attendance: AttendanceStatus) => {
    if (student.attendance === attendance) return;
    setHistory([...history, { studentId: student.id, previous: { ...student, scores: { ...student.scores } } }]);
    setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, attendance } : item) });
  };
  const attendanceCounts = (Object.keys(attendanceLabel) as AttendanceStatus[]).map((status) => ({ status, count: students.filter((student) => student.attendance === status).length }));
  const AttendanceButtons = ({ student }: { student: Student }) => <div className="attendance-actions" aria-label={`Điểm danh ${student.name}`}>
    {(Object.keys(attendanceLabel) as AttendanceStatus[]).map((status) => <button key={status} title={attendanceLabel[status]} aria-label={attendanceLabel[status]} className={`${status} ${student.attendance === status ? "active" : ""}`} onClick={() => markAttendance(student, status)}>{status === "present" ? <UserCheck /> : status === "absent" ? <UserX /> : status === "late" ? <Clock3 /> : <ShieldCheck />}<span>{attendanceLabel[status]}</span></button>)}
  </div>;
  return <div className="stack-lg">
    <section className="surface lesson-head">
      <div className="section-toolbar"><div><h1>THEO DÕI TIẾT HỌC {classroom.name.toUpperCase()} <span>KHỐI {classroom.grade}</span></h1><p>Ghi nhận nhanh mức độ tham gia và kết quả của từng học sinh trong giờ học.</p></div><div className="lesson-actions"><div className="sound-toggle"><Megaphone /><Switch checked={sound} onCheckedChange={setSound} aria-label="Bật âm thanh" /></div><Button className="undo-action" onClick={undo}><RotateCcw /> Hoàn tác</Button><Button className="purple-soft" onClick={() => toast.info("Quy đổi điểm đang áp dụng theo hệ số trong Thiết lập.")}><Settings2 /> Quy đổi sang điểm môn</Button><Button className="dark-action" onClick={() => toast.success("Đã kết thúc và lưu tiết học.")}><Check /> Kết thúc tiết học</Button></div></div>
      <div className="lesson-fields"><label><BookOpenCheck /><input value={lessonName} onChange={(event) => setLessonName(event.target.value)} /></label><label><Clock3 /><Select defaultValue="2"><SelectTrigger className="lesson-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2">Tiết dạy · Thứ 2</SelectItem><SelectItem value="4">Tiết dạy · Thứ 4</SelectItem></SelectContent></Select></label><label><CalendarDays /><input type="date" value={lessonDate} onChange={(event) => setLessonDate(event.target.value)} /></label></div>
    </section>
    <div className="notice"><AlertTriangle /><p><strong>Nguyên tắc quan trọng:</strong> điểm hoạt động hỗ trợ đánh giá quá trình. Giáo viên cần đối chiếu minh chứng trước khi quy đổi sang điểm môn học.</p></div>
    <section className="attendance-strip surface"><div><span className="eyebrow green"><ClipboardCheck /> ĐIỂM DANH NHANH</span><h2>{students.length} học sinh · {classroom.name}</h2></div><div className="attendance-summary">{attendanceCounts.map(({ status, count }) => <span className={status} key={status}><i />{attendanceLabel[status]} <strong>{count}</strong></span>)}</div></section>
    <section className="lesson-tools"><label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên học sinh hoặc STT..." /></label><Button variant={quickMode ? "default" : "outline"} onClick={() => setQuickMode(!quickMode)}><Smartphone /> {quickMode ? "Đang ở chế độ nhanh" : "Chế độ nhanh mobile"}</Button><Button variant="outline" onClick={() => toast.info("Danh sách hiện được thao tác theo từng học sinh.")}><UsersRound /> {shown.length} học sinh</Button></section>
    {!quickMode ? <section className="student-action-grid">{shown.map((student, index) => <article key={student.id} className="student-action-card"><div className="student-card-head"><span className="student-index">{index + 1}</span><div><h3>{student.name}</h3><p>STT {index + 1} · {student.gender}</p></div><strong>+{student.activity}đ<small>hoạt động</small></strong></div><AttendanceButtons student={student} /><div className="behavior-grid"><button className="yellow" onClick={() => reward(student, "hand", 1, "Giơ tay phát biểu")}><Hand />Giơ tay phát biểu</button><button className="green" onClick={() => reward(student, "correct", 1, "Trả lời đúng")}><Check />Trả lời đúng</button><button className="purple" onClick={() => reward(student, "praise", 2, "Trả lời xuất sắc")}><Star />Trả lời xuất sắc</button><button className="blue" onClick={() => reward(student, "activity", 1, "Hỗ trợ hoạt động")}><ThumbsUp />Hỗ trợ hoạt động</button><button className="mint" onClick={() => reward(student, "activity", 1, "Chuẩn bị bài tốt")}><ClipboardCheck />Chuẩn bị bài tốt</button><button className="rose" onClick={() => reward(student, "activity", -1, "Cần nhắc nhở")}><AlertTriangle />Cần nhắc nhở</button></div><button className="note-button" onClick={() => toast.info(`Ghi chú hiện tại: ${student.note || "Chưa có ghi chú"}`)}><Pencil /> Thêm nhận xét / Tệp minh chứng</button></article>)}</section> : <section className="quick-roster surface">{shown.map((student, index) => <article className="quick-row" key={student.id}><span className="student-index">{index + 1}</span><div className="quick-name"><strong>{student.name}</strong><small>{student.gender} · <b className={student.attendance}>{attendanceLabel[student.attendance]}</b></small></div><AttendanceButtons student={student} /><div className="quick-actions"><button className="reward" onClick={() => reward(student, "hand", 1, "Phát biểu tích cực")}><Hand /> +1</button><button className="remind" onClick={() => reward(student, "activity", -1, "Cần nhắc nhở")}><AlertTriangle /> -1</button></div><strong className="quick-score">{student.activity > 0 ? "+" : ""}{student.activity}đ</strong></article>)}</section>}
    {!shown.length && <div className="surface empty-state"><Search /><h2>Không tìm thấy học sinh</h2><p>Thử nhập một họ tên khác.</p></div>}
  </div>;
}

function GradesPage({ data, setData, classroom, students }: { data: AppData; setData: (value: AppData) => void; classroom: Classroom; students: Student[] }) {
  const updateScore = (studentId: string, key: string, raw: string) => {
    const number = raw === "" ? null : Number(raw);
    if (number !== null && (Number.isNaN(number) || number < 0 || number > 10)) return;
    setData({ ...data, students: data.students.map((item) => item.id === studentId ? { ...item, scores: { ...item.scores, [key]: number } } : item) });
  };
  const exportCsv = () => {
    const header = ["STT","Họ và tên",...scoreColumns.map((item) => item.label),"ĐTB"];
    const rows = students.map((student, index) => [index + 1,student.name,...scoreColumns.map((item) => student.scores[item.key] ?? ""),average(student, data.scoreWeights)?.toFixed(1) ?? ""]);
    const csv = [header,...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = `so-diem-${classroom.name.replace("Lớp ","")}.csv`; link.click(); URL.revokeObjectURL(url); toast.success("Đã xuất sổ điểm CSV mở được bằng Excel.");
  };
  return <div className="stack-lg">
    <section className="surface grade-head"><div className="section-toolbar"><div><h1><Table2 /> SỔ ĐIỂM KIỂM TRA & ĐÁNH GIÁ · {classroom.name.toUpperCase()}</h1><p>Nhập trực tiếp, theo dõi và xuất sổ điểm trong {data.semester.toLowerCase()}.</p></div><div className="toolbar-actions"><Button onClick={() => toast.info("Chọn trực tiếp một ô trong bảng để nhập điểm.")}><Plus /> Thêm / Nhập cột điểm</Button><Button variant="outline" className="purple-soft" onClick={exportCsv}><Download /> Lưu xuất điểm ra Excel</Button><Button variant="outline" onClick={() => toast.info("Các thay đổi được lưu ngay trên trình duyệt này.")}><Clock3 /> Lịch sử sửa ĐG</Button></div></div><div className="legend"><span>Ngữ nghĩa điểm số:</span><i className="pink">TX</i> Thường xuyên <i className="yellow">GK</i> Giữa kỳ <i className="blue">CK</i> Cuối kỳ</div></section>
    <section className="surface grade-table-wrap"><Table className="grade-table"><TableHeader><TableRow><TableHead style={{ color: "#ffffff", fontWeight: 800 }}>STT</TableHead><TableHead className="student-name-col" style={{ color: "#ffffff", fontWeight: 800 }}>Họ và tên học sinh</TableHead>{scoreColumns.map((column) => <TableHead key={column.key} style={{ color: "#ffffff", fontWeight: 800 }}>{column.label}<small style={{ color: "#a7f3d0", fontWeight: 700, display: "block", marginTop: "4px" }}>Hệ số {data.scoreWeights[column.key]}</small></TableHead>)}<TableHead className="average-head" style={{ color: "#ffffff", fontWeight: 900 }}>ĐTB môn</TableHead></TableRow></TableHeader><TableBody>{students.map((student, index) => <TableRow key={student.id}><TableCell>{index + 1}</TableCell><TableCell className="student-name-col"><strong>{student.name}</strong></TableCell>{scoreColumns.map((column) => <TableCell key={column.key}><input aria-label={`${column.label} của ${student.name}`} type="number" min="0" max="10" step="0.1" value={student.scores[column.key] ?? ""} onChange={(event) => updateScore(student.id, column.key, event.target.value)} placeholder="—" /></TableCell>)}<TableCell className="average-cell">{average(student, data.scoreWeights)?.toFixed(1) ?? "—"}</TableCell></TableRow>)}</TableBody></Table></section>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const current = classroom ? data.students.filter((item) => item.classId === classroom.id) : [];
  const addStudents = (rows: { name: string; gender?: string; parentName?: string; parentPhone?: string; note?: string }[]) => {
    if (!classroom) return; const valid = rows.filter((row) => row.name?.trim()); if (!valid.length) return toast.error("Không tìm thấy học sinh hợp lệ.");
    const added: Student[] = valid.map((row, index) => ({ id: `s${Date.now()}${index}`, classId: classroom.id, name: row.name.trim(), gender: row.gender === "Nam" || row.gender === "Khác" ? row.gender : "Nữ", parentName: row.parentName?.trim() ?? "", parentPhone: row.parentPhone?.trim() ?? "", note: row.note?.trim() ?? "", hand: 0, correct: 0, praise: 0, activity: 0, attendance: "present", scores: { tx1: null, tx2: null, tx3: null, mid: null, practice: null, final: null } }));
    setData({ ...data, students: [...data.students,...added], classes: data.classes.map((item) => item.id === classroom.id ? { ...item, studentIds: [...(item.studentIds ?? []),...added.map((student) => student.id)] } : item) }); toast.success(`Đã thêm ${added.length} học sinh vào ${classroom.name}.`);
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
  const addPasted = () => { addStudents(pasted.split(/\r?\n/).map((line) => { const [name,gender,parentName,parentPhone,note] = line.split(/\t|,/); return { name,gender,parentName,parentPhone,note }; })); setPasted(""); };
  const addManual = () => { if (!form.name.trim()) return toast.error("Vui lòng nhập họ và tên học sinh."); addStudents([form]); setForm({ name: "", gender: "Nữ", parentName: "", parentPhone: "", note: "" }); };
  const importCsv = async (file?: File) => {
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const rows = await readSheet(file);
        const body = /họ|ho|name/i.test(String(rows[0]?.[0] ?? "")) ? rows.slice(1) : rows;
        addStudents(body.map((row) => ({ name: String(row[0] ?? ""), gender: String(row[1] ?? ""), parentName: String(row[2] ?? ""), parentPhone: String(row[3] ?? ""), note: String(row[4] ?? "") })));
      } else {
        const text = await file.text(); const lines = text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean); const body = /họ|ho|name/i.test(lines[0] ?? "") ? lines.slice(1) : lines;
        addStudents(body.map((line) => { const [name,gender,parentName,parentPhone,note] = line.split(/,|;|\t/).map((cell) => cell.replace(/^"|"$/g,"").trim()); return { name,gender,parentName,parentPhone,note }; }));
      }
    } catch { toast.error("Không đọc được tệp. Vui lòng dùng đúng file .xlsx hoặc CSV theo mẫu."); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const downloadTemplate = () => { const content = "Họ và tên,Giới tính,Họ tên phụ huynh,Số điện thoại,Ghi chú\nNguyễn Văn An,Nam,Nguyễn Văn Bình,0901234567,"; const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "mau-danh-sach-hoc-sinh.csv"; link.click(); URL.revokeObjectURL(url); };
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="student-dialog"><DialogHeader><DialogTitle className="dialog-title"><UserRoundPlus /> Quản lý & nhập danh sách học sinh · {classroom?.name}</DialogTitle><DialogDescription>Dữ liệu được lưu trên trình duyệt của thiết bị này.</DialogDescription></DialogHeader><Tabs defaultValue="paste"><TabsList className="student-tabs"><TabsTrigger value="file"><FileSpreadsheet /> Tải tệp Excel / CSV</TabsTrigger><TabsTrigger value="paste"><ClipboardCheck /> Dán từ Excel / Sheets</TabsTrigger><TabsTrigger value="manual"><Plus /> Thêm thủ công 1 HS</TabsTrigger><TabsTrigger value="list"><UsersRound /> Danh sách {current.length} HS</TabsTrigger></TabsList>
    <TabsContent value="file" className="tab-panel"><input ref={fileRef} type="file" accept=".xlsx,.csv,.txt" hidden onChange={(event) => importCsv(event.target.files?.[0])} /><button className="upload-zone" onClick={() => fileRef.current?.click()}><Upload /><strong>Kéo thả hoặc bấm để tải danh sách Excel / CSV</strong><span>Hỗ trợ tệp .xlsx, .csv và dữ liệu xuất từ Google Sheets.</span><b>Chọn tệp danh sách</b></button><div className="template-row"><div><strong>Chưa có file đúng định dạng?</strong><p>Tải file mẫu gồm 5 cột thông tin cơ bản.</p></div><Button variant="outline" onClick={downloadTemplate}><Download /> Tải file mẫu (.csv)</Button></div></TabsContent>
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
              <Button size="icon-sm" variant="ghost" style={{ color: "var(--destructive)" }} aria-label={`Xóa ${student.name}`} onClick={() => deleteStudent(student.id, student.name)}>
                <UserX />
              </Button>
            </div>
          </div>
        ))
      )}
      {!current.length && <div className="empty-state"><UsersRound /><strong>Chưa có học sinh</strong><p>Chọn một phương thức nhập ở phía trên để bắt đầu.</p></div>}
    </TabsContent>
    </Tabs><DialogFooter><span className="dialog-count">Tổng số học sinh lớp: <strong>{current.length}</strong></span><Button variant="ghost" onClick={onClose}>Hủy</Button><Button onClick={() => { onClose(); toast.success("Danh sách học sinh đã được lưu."); }}><Save /> Lưu danh sách học sinh vào lớp</Button></DialogFooter></DialogContent></Dialog>;
}

function ReportsPage({ data, students, classroom, navigate }: { data: AppData; students: Student[]; classroom: Classroom; navigate: (key: string) => void }) {
  const rows = students.map((student) => ({ student, avg: average(student, data.scoreWeights), trend: scoreTrend(student) }));
  const graded = rows.filter((item): item is typeof item & { avg: number } => typeof item.avg === "number");
  const classAverage = graded.length ? graded.reduce((sum, item) => sum + item.avg, 0) / graded.length : null;
  const needsAttention = rows.filter(({ student, avg }) => student.attendance === "absent" || student.attendance === "late" || (avg !== null && avg < 6.5) || student.activity < 3);
  const excellent = rows.filter(({ avg }) => avg !== null && avg >= 8).length;
  const present = students.filter((student) => student.attendance === "present").length;
  const distribution = [
    { label: "Dưới 6,5", count: graded.filter(({ avg }) => avg < 6.5).length, tone: "low" },
    { label: "6,5 – 7,9", count: graded.filter(({ avg }) => avg >= 6.5 && avg < 8).length, tone: "medium" },
    { label: "8,0 – 8,9", count: graded.filter(({ avg }) => avg >= 8 && avg < 9).length, tone: "good" },
    { label: "Từ 9,0", count: graded.filter(({ avg }) => avg >= 9).length, tone: "great" },
  ];
  const reasonFor = ({ student, avg }: typeof rows[number]) => {
    const reasons: string[] = [];
    if (student.attendance === "absent") reasons.push("Vắng học");
    if (student.attendance === "late") reasons.push("Đi muộn");
    if (avg !== null && avg < 6.5) reasons.push(`ĐTB ${avg.toFixed(1)}`);
    if (student.activity < 3) reasons.push("Ít tương tác");
    return reasons;
  };
  return <div className="stack-xl">
    <section className="report-hero"><div><span className="eyebrow"><BarChart3 /> BÁO CÁO TIẾN BỘ</span><h1>{classroom.name} · {data.subject}</h1><p>Tổng hợp điểm số, mức độ tham gia và trạng thái điểm danh từ dữ liệu giáo viên đã ghi nhận.</p></div><div className="report-hero-score"><small>Điểm trung bình lớp</small><strong>{classAverage?.toFixed(1) ?? "—"}</strong><span>{graded.length}/{students.length} học sinh có điểm</span></div></section>
    <section className="report-kpis"><article><span className="kpi-icon green"><BarChart3 /></span><div><small>ĐTB lớp</small><strong>{classAverage?.toFixed(1) ?? "—"}</strong></div></article><article><span className="kpi-icon purple"><Medal /></span><div><small>Đạt từ 8,0</small><strong>{excellent} HS</strong></div></article><article><span className="kpi-icon amber"><AlertTriangle /></span><div><small>Cần chú ý</small><strong>{needsAttention.length} HS</strong></div></article><article><span className="kpi-icon blue"><UserCheck /></span><div><small>Có mặt</small><strong>{present}/{students.length}</strong></div></article></section>
    <section className="report-grid"><article className="surface distribution-card"><div className="card-heading"><div><h2>Phân bố kết quả học tập</h2><p>Theo điểm trung bình có trọng số</p></div><BarChart3 /></div><div className="distribution-bars">{distribution.map((item) => <div className="distribution-row" key={item.label}><span>{item.label}</span><div><i className={item.tone} style={{ width: `${graded.length ? Math.max(6, item.count / graded.length * 100) : 0}%` }} /></div><strong>{item.count}</strong></div>)}</div></article><article className="surface attention-panel"><div className="card-heading"><div><h2>Học sinh cần chú ý</h2><p>Cảnh báo theo dữ liệu hiện có</p></div><AlertTriangle /></div><div className="attention-list">{needsAttention.slice(0, 6).map((row) => <div className="attention-item" key={row.student.id}><span>{row.student.name.split(" ").at(-1)?.[0]}</span><div><strong>{row.student.name}</strong><p>{reasonFor(row).map((reason) => <i key={reason}>{reason}</i>)}</p></div><button onClick={() => navigate("profiles")}><ChevronRight /></button></div>)}{!needsAttention.length && <div className="report-empty"><Check /> Chưa có cảnh báo cần xử lý.</div>}</div><p className="rule-note"><ShieldCheck /> Quy tắc cảnh báo: vắng/đi muộn, ĐTB dưới 6,5 hoặc điểm hoạt động dưới 3.</p></article></section>
    <section className="surface progress-table-card"><div className="card-heading"><div><h2>Tiến bộ từng học sinh</h2><p>So sánh điểm được nhập đầu tiên và gần nhất</p></div><Button variant="outline" onClick={() => navigate("grades")}><Table2 /> Mở sổ điểm</Button></div><div className="progress-table-wrap"><table className="progress-table"><thead><tr><th>Học sinh</th><th>ĐTB</th><th>Thay đổi</th><th>Hoạt động</th><th>Điểm danh</th><th>Trạng thái</th></tr></thead><tbody>{rows.map(({ student, avg, trend }) => { const attention = needsAttention.some((item) => item.student.id === student.id); return <tr key={student.id}><td><strong>{student.name}</strong><small>{student.gender} · {classroom.name}</small></td><td><b>{avg?.toFixed(1) ?? "—"}</b></td><td><span className={`trend ${trend > 0 ? "up" : trend < 0 ? "down" : "flat"}`}>{trend > 0 ? "+" : ""}{trend.toFixed(1)}</span></td><td>+{student.activity}đ</td><td><span className={`attendance-badge ${student.attendance}`}>{attendanceLabel[student.attendance]}</span></td><td><span className={`student-status ${attention ? "attention" : "steady"}`}>{attention ? "Cần chú ý" : "Ổn định"}</span></td></tr>; })}</tbody></table></div></section>
  </div>;
}

function AssistantPage({ data, setData, students, classroom }: { data: AppData; setData: DataSetter; students: Student[]; classroom: Classroom }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  const [tone, setTone] = useState("encouraging");
  const [sources, setSources] = useState({ scores: true, activity: true, attendance: true, note: false });
  const [comment, setComment] = useState("");
  useEffect(() => { setSelectedId(students[0]?.id ?? ""); setComment(""); }, [classroom.id]);
  const student = students.find((item) => item.id === selectedId) ?? students[0];
  if (!student) return <div className="surface empty-state"><Bot /><h2>Chưa có dữ liệu để tạo nhận xét</h2><p>Hãy thêm học sinh vào {classroom.name} trước.</p></div>;
  const toggleSource = (key: keyof typeof sources, checked: boolean) => setSources({ ...sources, [key]: checked });
  const generate = () => {
    if (!Object.values(sources).some(Boolean)) return toast.error("Vui lòng chọn ít nhất một nhóm dữ liệu.");
    const parts: string[] = [];
    const avg = average(student, data.scoreWeights);
    const trend = scoreTrend(student);
    if (sources.scores) parts.push(avg === null ? "chưa có đủ điểm đánh giá" : `có điểm trung bình ${avg.toFixed(1)}${trend > 0 ? `, tiến bộ ${trend.toFixed(1)} điểm so với lần đầu` : trend < 0 ? `, giảm ${Math.abs(trend).toFixed(1)} điểm so với lần đầu` : ", kết quả đang ổn định"}`);
    if (sources.activity) parts.push(student.activity >= 8 ? "tham gia học tập rất tích cực" : student.activity >= 3 ? "có tham gia các hoạt động trên lớp" : "cần chủ động tương tác và phát biểu nhiều hơn");
    if (sources.attendance) parts.push(student.attendance === "present" ? "đi học đầy đủ trong buổi ghi nhận" : `trạng thái điểm danh hiện tại là ${attendanceLabel[student.attendance].toLowerCase()}`);
    if (sources.note && student.note) parts.push(`ghi chú của giáo viên: ${student.note}`);
    const lead = tone === "short" ? `${student.name}: ` : `Trong ${data.semester.toLowerCase()}, ${student.name} `;
    const advice = avg !== null && avg < 6.5 ? " Em cần ôn lại kiến thức nền, hoàn thành nhiệm vụ đúng hạn và trao đổi với giáo viên khi chưa hiểu bài." : student.activity < 3 ? " Em nên mạnh dạn phát biểu, tham gia hoạt động nhóm và duy trì chuẩn bị bài trước khi đến lớp." : " Em hãy tiếp tục duy trì tinh thần học tập và phát huy những kết quả đã đạt được.";
    const detail = tone === "detailed" ? ` Số liệu ghi nhận gồm ${student.hand} lượt giơ tay, ${student.correct} lần trả lời đúng và ${student.praise} lần được tuyên dương.` : "";
    setComment(`${lead}${parts.join(", ")}.${tone === "short" ? "" : advice}${detail}`);
  };
  const copyComment = async () => { if (!comment) return toast.info("Hãy tạo nhận xét trước khi sao chép."); try { await navigator.clipboard.writeText(comment); toast.success("Đã sao chép nhận xét."); } catch { toast.error("Không thể sao chép trên trình duyệt này."); } };
  const saveComment = () => { if (!comment.trim()) return toast.info("Hãy tạo hoặc nhập nhận xét trước khi lưu."); setData({ ...data, students: data.students.map((item) => item.id === student.id ? { ...item, note: comment.trim() } : item) }, `Lưu nhận xét cho ${student.name}`); toast.success("Đã lưu nhận xét vào hồ sơ học sinh."); };
  return <div className="stack-xl">
    <section className="assistant-hero"><div className="assistant-orb"><Bot /></div><div><span>TRỢ LÝ NHẬN XÉT</span><h1>Soạn nhận xét từ dữ liệu giáo viên chọn</h1><p>Tạo bản nháp có căn cứ từ điểm số, hoạt động và điểm danh; giáo viên luôn là người kiểm tra và quyết định nội dung cuối cùng.</p></div><div className="local-badge"><ShieldCheck /><span><strong>Xử lý cục bộ</strong>Dữ liệu không rời trình duyệt</span></div></section>
    <section className="assistant-layout"><article className="surface assistant-controls"><div className="card-heading"><div><h2>1. Chọn dữ liệu đầu vào</h2><p>{classroom.name} · {data.subject}</p></div><Sparkles /></div><label className="assistant-student-picker">Học sinh<Select value={student.id} onValueChange={(value) => { setSelectedId(value); setComment(""); }}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{students.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label><div className="source-options">{([
      ["scores","Điểm số & xu hướng","ĐTB và thay đổi giữa các lần đánh giá"], ["activity","Hoạt động trên lớp","Phát biểu, trả lời đúng và điểm hoạt động"], ["attendance","Điểm danh","Trạng thái có mặt, vắng hoặc đi muộn"], ["note","Ghi chú hiện có","Nội dung giáo viên đã lưu trong hồ sơ"],
    ] as const).map(([key,label,description]) => <label key={key} className={sources[key] ? "selected" : ""}><Checkbox checked={sources[key]} onCheckedChange={(value) => toggleSource(key, value === true)} /><span><strong>{label}</strong><small>{description}</small></span></label>)}</div><label className="assistant-tone">Phong cách nhận xét<Select value={tone} onValueChange={setTone}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="encouraging">Tích cực, khích lệ</SelectItem><SelectItem value="short">Ngắn gọn</SelectItem><SelectItem value="detailed">Chi tiết, có số liệu</SelectItem></SelectContent></Select></label><Button className="generate-button" onClick={generate}><WandSparkles /> Tạo bản nháp nhận xét</Button></article>
    <article className="surface assistant-output"><div className="card-heading"><div><h2>2. Kiểm tra và hoàn thiện</h2><p>Có thể chỉnh sửa trực tiếp trước khi lưu</p></div><span className="draft-badge">BẢN NHÁP</span></div><div className="student-context"><span>{student.name.split(" ").at(-1)?.[0]}</span><div><strong>{student.name}</strong><small>{classroom.name} · ĐTB {average(student, data.scoreWeights)?.toFixed(1) ?? "—"} · +{student.activity}đ hoạt động</small></div></div><textarea rows={10} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chọn dữ liệu rồi bấm “Tạo bản nháp nhận xét”..." /><div className="assistant-output-actions"><Button variant="outline" onClick={copyComment}><Copy /> Sao chép</Button><Button onClick={saveComment}><Save /> Lưu vào hồ sơ</Button></div><p className="assistant-disclaimer"><AlertTriangle /> Giáo viên cần đọc lại, điều chỉnh ngữ cảnh và chịu trách nhiệm về nhận xét trước khi sử dụng.</p></article></section>
  </div>;
}

function ProfilesPage({ data, students, classroom, navigate }: { data: AppData; students: Student[]; classroom: Classroom; navigate: (key: string) => void }) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  useEffect(() => setSelectedId(students[0]?.id ?? ""), [classroom.id, students]);
  const student = students.find((item) => item.id === selectedId) ?? students[0];
  if (!student) return <div className="surface empty-state"><UsersRound /><h2>Chưa có học sinh trong {classroom.name}</h2><p>Hãy nhập danh sách học sinh ở trang Lớp học.</p></div>;
  const chartValues = scoreColumns.map((column) => ({ label: column.label.replace("Thường xuyên", "TX"), value: student.scores[column.key] }));
  return <div className="profile-layout">
    <aside className="surface profile-card">
      <label className="profile-picker">Học sinh<Select value={student.id} onValueChange={setSelectedId}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent>{students.map((item) => <SelectItem value={item.id} key={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label>
      <div className="avatar">{student.name.split(" ").at(-1)?.[0]}</div><span className="stt">STT {students.findIndex((item) => item.id === student.id) + 1}</span><h1>{student.name}</h1><p>{student.gender} · {classroom.name} · {data.schoolYear} · {attendanceLabel[student.attendance]}</p>
      <dl><div><dt>Phụ huynh</dt><dd>{student.parentName || "Chưa cập nhật"}</dd></div><div><dt>Điện thoại</dt><dd>{student.parentPhone || "Chưa cập nhật"}</dd></div></dl>
      <h2>THỐNG KÊ THI ĐUA PHÁT BIỂU</h2><div className="profile-stats"><div className="yellow"><Hand /><strong>{student.hand}</strong><span>Lượt giơ tay</span></div><div className="green"><Check /><strong>{student.correct}</strong><span>Trả lời đúng</span></div><div className="purple"><Star /><strong>{student.praise}</strong><span>Lần xuất sắc</span></div><div className="blue"><Sparkles /><strong>+{student.activity}đ</strong><span>Điểm hoạt động</span></div></div>
    </aside>
    <div className="profile-main stack-lg"><section className="surface chart-card"><div className="section-toolbar"><div><h2><BarChart3 /> Biểu đồ diễn biến điểm kiểm tra môn học</h2><p>Theo thang điểm 10</p></div><strong className="average-badge">ĐTB {average(student, data.scoreWeights)?.toFixed(1) ?? "—"}</strong></div><div className="score-chart">{chartValues.map((item) => <div key={item.label} className="score-bar-item"><span className="score-value">{item.value ?? "—"}</span><div className="score-bar-track"><i style={{ height: `${(item.value ?? 0) * 9}%` }} /></div><small>{item.label}</small></div>)}</div></section><section className="surface comment-card"><div className="section-toolbar"><div><h2><Sparkles /> Đánh giá & Nhận xét của Giáo viên</h2><p>{student.note || "Chưa có nhận xét riêng cho học sinh này."}</p></div><Button onClick={() => navigate("assistant")}><Sparkles /> Tạo nhận xét cá nhân</Button></div></section></div>
  </div>;
}

function SettingsPage({ data, setData }: { data: AppData; setData: DataSetter }) {
  const [teacherName, setTeacherName] = useState(data.teacherName || "Mai Hoa");
  const [schoolName, setSchoolName] = useState(data.schoolName || "");
  const [subject, setSubject] = useState(data.subject || "Địa lý");
  const [newClass, setNewClass] = useState("");
  const [newGrade, setNewGrade] = useState("8");
  const backupRef = useRef<HTMLInputElement>(null);
  const subjects = [
    "Địa lý", "KHTN", "Toán học", "Tiếng Anh", "Ngữ văn",
    "Lịch sử & Địa lý", "Sinh học", "Hóa học", "Lịch sử", "Tin học", "Công nghệ", "GDCD"
  ];

  useEffect(() => {
    setTeacherName(data.teacherName || "Mai Hoa");
    setSchoolName(data.schoolName || "");
    setSubject(data.subject || "Địa lý");
  }, [data.teacherName, data.schoolName, data.subject]);

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
      },
      "Cập nhật thông tin giáo viên, trường & môn học"
    );
    toast.success("Đã lưu thay đổi thông tin giáo viên, trường và môn học.");
  };

  const addClass = () => {
    if (!newClass.trim()) return toast.error("Vui lòng nhập tên lớp.");
    const grade = Number(newGrade);
    setData({ ...data, classes: [...data.classes, { id: `c${Date.now()}`, name: newClass.startsWith("Lớp") ? newClass : `Lớp ${newClass}`, grade, room: `Phòng ${newClass}`, studentIds: [] }] });
    setNewClass(""); toast.success("Đã thêm lớp học mới.");
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
      setData(normalizeData(candidate), "Khôi phục dữ liệu từ bản sao lưu"); toast.success("Đã khôi phục dữ liệu từ bản sao lưu.");
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
    <section className="surface settings-section"><h2><CalendarDays /> Quản lý & Chọn Năm học</h2><div className="settings-grid"><label>Năm học<Select value={data.schoolYear} onValueChange={(value) => setData({ ...data, schoolYear: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2025–2026">2025–2026</SelectItem><SelectItem value="2026–2027">2026–2027</SelectItem></SelectContent></Select></label><label>Học kỳ<Select value={data.semester} onValueChange={(value) => setData({ ...data, semester: value })}><SelectTrigger className="field"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Học kỳ I">Học kỳ I</SelectItem><SelectItem value="Học kỳ II">Học kỳ II</SelectItem></SelectContent></Select></label></div></section>
    <section className="surface settings-section"><h2><BookOpenCheck /> Hệ số công thức tính điểm môn học</h2><div className="weight-grid">{scoreColumns.map((column) => <label key={column.key}><strong>{column.label}</strong><span>Hệ số tính ĐTB</span><Select value={String(data.scoreWeights[column.key])} onValueChange={(value) => setData({ ...data, scoreWeights: { ...data.scoreWeights, [column.key]: Number(value) } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Hệ số 1</SelectItem><SelectItem value="2">Hệ số 2</SelectItem><SelectItem value="3">Hệ số 3</SelectItem></SelectContent></Select></label>)}</div></section>
    <section className="surface settings-section"><h2><Plus /> Quản lý & Thêm lớp học mới</h2><div className="add-class-row"><Select value={newGrade} onValueChange={setNewGrade}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[6,7,8,9,10,11,12].map((item) => <SelectItem key={item} value={String(item)}>Khối {item}</SelectItem>)}</SelectContent></Select><input value={newClass} onChange={(event) => setNewClass(event.target.value)} placeholder="Tên lớp (VD: 11B2, 11B3...)" /><Button onClick={addClass}><Plus /> Thêm lớp</Button></div><div className="existing-classes">{data.classes.map((item) => <span key={item.id}>{item.name} (Khối {item.grade})</span>)}</div></section>
    <section className="backup-grid"><article className="surface backup-card"><div className="card-heading"><div><h2><DatabaseBackup /> Sao lưu & khôi phục</h2><p>Tạo một tệp chứa toàn bộ dữ liệu đang lưu trên trình duyệt.</p></div><ShieldCheck /></div><div className="backup-actions"><Button onClick={downloadBackup}><Download /> Tải bản sao lưu</Button><input ref={backupRef} type="file" accept=".json,application/json" hidden onChange={(event) => restoreBackup(event.target.files?.[0])} /><Button variant="outline" onClick={() => backupRef.current?.click()}><Upload /> Khôi phục từ tệp</Button></div><small>Dữ liệu chỉ được đọc hoặc ghi khi giáo viên chủ động thao tác.</small></article><article className="surface history-card"><div className="card-heading"><div><h2><FileClock /> Lịch sử chỉnh sửa</h2><p>{data.auditLog.length} hoạt động gần nhất được lưu cục bộ</p></div><span className="history-count">{Math.min(data.auditLog.length, 80)}/80</span></div><div className="history-list">{data.auditLog.slice(0, 12).map((entry) => <div className="history-item" key={entry.id}><i /><div><strong>{entry.action}</strong><small>{new Date(entry.at).toLocaleString("vi-VN")}</small></div></div>)}{!data.auditLog.length && <div className="history-empty"><FileClock /> Chưa có thay đổi nào trong phiên bản này.</div>}</div></article></section>
    <section className="danger-zone"><div><strong>Khôi phục dữ liệu mẫu ban đầu</strong><p>Đặt lại toàn bộ lớp, học sinh, thời khóa biểu và điểm số. Nên tải bản sao lưu trước khi thực hiện.</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><RotateCcw /> Đặt lại dữ liệu</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Khôi phục toàn bộ dữ liệu mẫu?</AlertDialogTitle><AlertDialogDescription>Mọi thay đổi đang lưu trên trình duyệt sẽ bị thay thế. Bạn có thể khôi phục lại nếu đã tải bản sao lưu.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => { setData(cloneInitial(), "Khôi phục dữ liệu mẫu ban đầu"); toast.success("Đã khôi phục dữ liệu mẫu."); }}>Xác nhận đặt lại</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></section>
  </div>;
}
