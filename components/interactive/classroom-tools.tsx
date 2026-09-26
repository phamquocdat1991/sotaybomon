"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Trophy, RotateCcw, Play, Pause, Plus, Sparkles, X, Volume2,
  VolumeX, Maximize2, Minimize2, Check, Star, AlertTriangle,
  Award, Copy, UsersRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface StudentToolItem {
  id: string;
  name: string;
  gender: "Nam" | "Nữ" | "Khác";
  hand: number;
  correct: number;
  praise: number;
  activity: number;
  attendance: "present" | "absent" | "late" | "excused";
}

// -------------------------------------------------------------
// WEB AUDIO SYNTHESIZER
// -------------------------------------------------------------
function playSound(type: "tick" | "fanfare" | "bell" | "cheer") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "tick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "fanfare") {
      // Chuỗi âm thanh chúc mừng
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const start = now + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } else if (type === "bell") {
      // Tiếng chuông báo hết giờ thảo luận
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const start = now + idx * 0.25;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
        osc.start(start);
        osc.stop(start + 0.7);
      });
    }
  } catch {}
}

// -------------------------------------------------------------
// 1. VÒNG QUAY MAY MẮN / BỐC THĂM NGẪU NHIÊN HỌC SINH
// -------------------------------------------------------------
interface LuckyWheelModalProps {
  open: boolean;
  onClose: () => void;
  students: StudentToolItem[];
  className: string;
  onRewardStudent: (studentId: string, type: "correct" | "praise" | "remind", points: number, msg: string) => void;
}

export function LuckyWheelModal({
  open,
  onClose,
  students,
  className,
  onRewardStudent,
}: LuckyWheelModalProps) {
  const [filterMode, setFilterMode] = useState<"all" | "no_points" | "active">("all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<StudentToolItem | null>(null);
  const [displayText, setDisplayText] = useState<string>("Sẵn sàng quay...");
  const [historyWinners, setHistoryWinners] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lọc học sinh theo tiêu chí
  const candidateStudents = students.filter((s) => {
    if (s.attendance === "absent") return false;
    if (filterMode === "no_points") return s.activity === 0;
    if (filterMode === "active") return s.attendance === "present";
    return true;
  });

  const handleStartSpin = () => {
    if (!candidateStudents.length) {
      toast.error("Không có học sinh nào thỏa mãn bộ lọc hiện tại.");
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    let counter = 0;
    const totalSteps = 28 + Math.floor(Math.random() * 12); // khoảng 30-40 bước
    let speed = 40;

    const spinStep = () => {
      counter++;
      const randomIdx = Math.floor(Math.random() * candidateStudents.length);
      const chosen = candidateStudents[randomIdx];
      setDisplayText(chosen.name);
      playSound("tick");

      if (counter < totalSteps) {
        // Chậm dần về cuối
        if (counter > totalSteps - 10) speed += 30;
        else if (counter > totalSteps - 5) speed += 60;
        intervalRef.current = setTimeout(spinStep, speed);
      } else {
        // Dừng lại và công bố người trúng
        setIsSpinning(false);
        setWinner(chosen);
        setDisplayText(chosen.name);
        setHistoryWinners((prev) => [chosen.name, ...prev].slice(0, 5));
        playSound("fanfare");
      }
    };

    intervalRef.current = setTimeout(spinStep, speed);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !isSpinning && onClose()}>
      <DialogContent className="lucky-wheel-dialog" style={{ maxWidth: "560px", textAlign: "center" }}>
        <DialogHeader>
          <DialogTitle className="dialog-title" style={{ justifyContent: "center" }}>
            <Sparkles style={{ color: "#f59e0b" }} /> VÒNG QUAY MAY MẮN GỌI TÊN HỌC SINH
          </DialogTitle>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--muted-foreground, #64748b)" }}>
            Lớp {className} · {candidateStudents.length} học sinh sẵn sàng
          </p>
        </DialogHeader>

        {/* Bộ lọc học sinh */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "8px 0" }}>
          <button
            className={`chip ${filterMode === "all" ? "active" : ""}`}
            onClick={() => !isSpinning && setFilterMode("all")}
          >
            Tất cả ({students.filter((s) => s.attendance !== "absent").length})
          </button>
          <button
            className={`chip ${filterMode === "no_points" ? "active" : ""}`}
            onClick={() => !isSpinning && setFilterMode("no_points")}
          >
            Chưa phát biểu ({students.filter((s) => s.activity === 0 && s.attendance !== "absent").length})
          </button>
        </div>

        {/* Khung hiển thị vòng quay */}
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            color: "#ffffff",
            padding: "36px 20px",
            borderRadius: "20px",
            boxShadow: "0 16px 32px rgba(6, 78, 59, 0.25)",
            margin: "12px 0",
            position: "relative",
            overflow: "hidden",
            border: "3px solid #34d399",
          }}
        >
          <div
            style={{
              fontSize: isSpinning ? "32px" : winner ? "36px" : "24px",
              fontWeight: 800,
              minHeight: "54px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.5px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              transition: "transform 0.1s ease",
              transform: isSpinning ? "scale(1.05)" : "scale(1)",
            }}
          >
            {displayText}
          </div>

          {winner && !isSpinning && (
            <div style={{ marginTop: "10px", fontSize: "15px", color: "#a7f3d0", fontWeight: 600 }}>
              🎉 Chúc mừng em đã được chọn phát biểu!
            </div>
          )}
        </div>

        {/* Nút hành động cho người trúng */}
        {winner && !isSpinning ? (
          <div style={{ display: "grid", gap: "10px", margin: "10px 0" }}>
            <div style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
              Đánh giá câu trả lời của <strong>{winner.name}</strong>:
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                style={{ background: "#10b981", color: "#ffffff" }}
                onClick={() => {
                  onRewardStudent(winner.id, "correct", 1, "Trả lời đúng câu hỏi vòng quay");
                  toast.success(`Đã cộng +1đ cho ${winner.name}`);
                  handleStartSpin();
                }}
              >
                <Check /> Trả lời đúng (+1đ)
              </Button>
              <Button
                style={{ background: "#8b5cf6", color: "#ffffff" }}
                onClick={() => {
                  onRewardStudent(winner.id, "praise", 2, "Trả lời xuất sắc câu hỏi vòng quay");
                  toast.success(`Đã cộng +2đ tuyên dương cho ${winner.name}`);
                  handleStartSpin();
                }}
              >
                <Star /> Xuất sắc (+2đ)
              </Button>
              <Button
                variant="outline"
                style={{ color: "#e11d48", borderColor: "#fecdd3" }}
                onClick={() => {
                  onRewardStudent(winner.id, "remind", -1, "Chưa chuẩn bị bài");
                  toast.info(`Đã nhắc nhở ${winner.name}`);
                  handleStartSpin();
                }}
              >
                <AlertTriangle /> Chưa thuộc (-1đ)
              </Button>
            </div>
          </div>
        ) : null}

        {/* Nút bấm quay */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
          <Button
            size="lg"
            disabled={isSpinning || !candidateStudents.length}
            onClick={handleStartSpin}
            style={{
              background: isSpinning ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "16px",
              padding: "0 28px",
              boxShadow: "0 6px 16px rgba(217, 119, 6, 0.35)",
            }}
          >
            <Sparkles /> {isSpinning ? "Đang chọn..." : winner ? "Quay tiếp em khác" : "Bắt đầu quay ngay"}
          </Button>
          <Button variant="ghost" disabled={isSpinning} onClick={onClose}>
            Đóng
          </Button>
        </div>

        {/* Lịch sử học sinh đã quay gần nhất */}
        {historyWinners.length > 0 && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#64748b" }}>
            Đã gọi gần đây: {historyWinners.join(" · ")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// 2. ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN NHÓM (CLASSROOM TIMER)
// -------------------------------------------------------------
interface ClassroomTimerModalProps {
  open: boolean;
  onClose: () => void;
  className: string;
}

export function ClassroomTimerModal({ open, onClose, className }: ClassroomTimerModalProps) {
  const [totalSeconds, setTotalSeconds] = useState(120); // Mặc định 2 phút
  const [remaining, setRemaining] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && remaining > 0) {
      timer = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound("bell");
            toast.success("⏰ HẾT GIỜ THẢO LUẬN!", { duration: 5000 });
            return 0;
          }
          if (prev <= 4) {
            playSound("tick");
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, remaining]);

  const selectPreset = (seconds: number) => {
    setIsRunning(false);
    setTotalSeconds(seconds);
    setRemaining(seconds);
  };

  const addTime = (seconds: number) => {
    setTotalSeconds((prev) => prev + seconds);
    setRemaining((prev) => prev + seconds);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progressPercent = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;
  const isNearEnd = remaining <= 10 && remaining > 0;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        style={{
          maxWidth: isFullScreen ? "95vw" : "540px",
          width: isFullScreen ? "95vw" : "100%",
          height: isFullScreen ? "90vh" : "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textAlign: "center",
          transition: "all 0.3s ease",
          padding: isFullScreen ? "36px" : "24px",
        }}
      >
        <DialogHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <DialogTitle className="dialog-title" style={{ fontSize: isFullScreen ? "24px" : "18px" }}>
              ⏱️ ĐỒNG HỒ ĐẾM NGƯỢC THẢO LUẬN · {className}
            </DialogTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình chiếu"}
            >
              {isFullScreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>
        </DialogHeader>

        {/* Vòng tròn đếm ngược trực quan */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "20px 0",
            flex: 1,
          }}
        >
          <div
            style={{
              position: "relative",
              width: isFullScreen ? "320px" : "220px",
              height: isFullScreen ? "320px" : "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "rotate(-90deg)",
              }}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke={isNearEnd ? "#ef4444" : "#10b981"}
                strokeWidth="7"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
              />
            </svg>

            <div style={{ zIndex: 1, textAlign: "center" }}>
              <div
                style={{
                  fontSize: isFullScreen ? "72px" : "48px",
                  fontWeight: 900,
                  fontFamily: "monospace",
                  color: isNearEnd ? "#ef4444" : "#0f172a",
                  lineHeight: 1,
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <span style={{ fontSize: isFullScreen ? "16px" : "13px", color: "#64748b", fontWeight: 600 }}>
                {remaining === 0 ? "HẾT GIỜ" : isRunning ? "Đang thảo luận..." : "Tạm dừng"}
              </span>
            </div>
          </div>
        </div>

        {/* Nút bấm thời gian mẫu */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {[
            { label: "30 giây", sec: 30 },
            { label: "1 phút", sec: 60 },
            { label: "2 phút", sec: 120 },
            { label: "3 phút", sec: 180 },
            { label: "5 phút", sec: 300 },
          ].map((preset) => (
            <button
              key={preset.sec}
              type="button"
              className={`chip ${totalSeconds === preset.sec ? "active" : ""}`}
              onClick={() => selectPreset(preset.sec)}
            >
              {preset.label}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => addTime(30)}>
            +30s
          </button>
        </div>

        {/* Nút điều khiển Bắt đầu / Tạm dừng / Reset */}
        <DialogFooter style={{ justifyContent: "center", gap: "10px" }}>
          {isRunning ? (
            <Button
              size="lg"
              onClick={() => setIsRunning(false)}
              style={{ background: "#f59e0b", color: "#ffffff", fontWeight: 700 }}
            >
              <Pause /> Tạm dừng
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                if (remaining === 0) setRemaining(totalSeconds);
                setIsRunning(true);
              }}
              style={{ background: "#10b981", color: "#ffffff", fontWeight: 700 }}
            >
              <Play /> {remaining === 0 ? "Bắt đầu lại" : "Bắt đầu đếm"}
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setIsRunning(false);
              setRemaining(totalSeconds);
            }}
          >
            <RotateCcw /> Đặt lại
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// 3. BẢNG VINH DANH TIẾT HỌC (HONOR BOARD / TOP STARS)
// -------------------------------------------------------------
interface HonorBoardModalProps {
  open: boolean;
  onClose: () => void;
  students: StudentToolItem[];
  className: string;
  subject: string;
}

export function HonorBoardModal({ open, onClose, students, className, subject }: HonorBoardModalProps) {
  // Lấy top 5 học sinh có điểm hoạt động cao nhất trong tiết học
  const topStudents = [...students]
    .filter((s) => s.activity > 0)
    .sort((a, b) => b.activity - a.activity || b.praise - a.praise || b.correct - a.correct)
    .slice(0, 5);

  const copyHonorList = async () => {
    if (!topStudents.length) {
      toast.info("Chưa có học sinh nào đạt điểm hoạt động trong tiết học.");
      return;
    }
    const lines = topStudents.map((s, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐";
      return `${medal} ${s.name}: +${s.activity}đ (${s.hand} giơ tay, ${s.correct} trả lời đúng${s.praise ? `, ${s.praise} xuất sắc` : ""})`;
    });

    const text = `🏆 VINH DANH TIẾT HỌC MÔN ${subject.toUpperCase()} - ${className}
${lines.join("\n")}
Chúc mừng các em đã tích cực xây dựng bài học! 👏`;

    try {
      await navigator.clipboard.writeText(text);
      playSound("fanfare");
      toast.success("Đã sao chép bảng vinh danh để gửi nhóm Zalo lớp!");
    } catch {
      toast.error("Không thể sao chép văn bản.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent style={{ maxWidth: "520px", textAlign: "center" }}>
        <DialogHeader>
          <DialogTitle className="dialog-title" style={{ justifyContent: "center", color: "#d97706" }}>
            <Trophy style={{ color: "#f59e0b" }} /> BẢNG VINH DANH TIẾT HỌC {className}
          </DialogTitle>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            Tuyên dương các học sinh hăng hái và tích cực nhất môn {subject}
          </p>
        </DialogHeader>

        {topStudents.length > 0 ? (
          <div style={{ display: "grid", gap: "10px", margin: "16px 0" }}>
            {topStudents.map((s, idx) => {
              const medalEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "⭐";
              const bgColor = idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : idx === 2 ? "#ffedd5" : "#f8fafc";
              const borderColor = idx === 0 ? "#f59e0b" : idx === 1 ? "#cbd5e1" : idx === 2 ? "#fdba74" : "#e2e8f0";

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: bgColor,
                    border: `1.5px solid ${borderColor}`,
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>{medalEmoji}</span>
                    <div style={{ textAlign: "left" }}>
                      <strong style={{ fontSize: "15px", color: "#0f172a" }}>{s.name}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {s.hand} lượt giơ tay · {s.correct} trả lời đúng
                        {s.praise > 0 ? ` · ${s.praise} xuất sắc` : ""}
                      </div>
                    </div>
                  </div>
                  <strong style={{ fontSize: "17px", color: "#059669" }}>+{s.activity}đ</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "32px 16px", color: "#64748b" }}>
            <Award style={{ width: "48px", height: "48px", margin: "0 auto 12px", opacity: 0.5 }} />
            <p>Chưa có học sinh nào được ghi nhận điểm hoạt động trong tiết học này.</p>
          </div>
        )}

        <DialogFooter style={{ justifyContent: "center", gap: "10px" }}>
          {topStudents.length > 0 && (
            <Button
              onClick={copyHonorList}
              style={{ background: "#10b981", color: "#ffffff", fontWeight: 700 }}
            >
              <Copy /> Sao chép gửi Zalo lớp
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
