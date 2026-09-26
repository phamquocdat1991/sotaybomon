import assert from "node:assert/strict";
import test from "node:test";
import { evaluateStudentTT22 } from "../lib/tt22-evaluation.ts";
import { generateSandwichFeedback, generateZaloMessage } from "../lib/ai-assistant.ts";

test("Thông tư 22: Học sinh xếp loại Tốt khi ĐTB >= 8.0 và tất cả điểm >= 6.5", () => {
  const scores = { tx1: 8.5, tx2: 9.0, tx3: 8.0, mid: 8.5, practice: 9.0, final: 8.5 };
  const weights = { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 };
  const result = evaluateStudentTT22(scores, weights);

  assert.equal(result.rank, "Tốt");
  assert.equal(result.rankCode, "tot");
  assert.equal(result.hasSubMinimumScore, false);
  assert.ok(result.average >= 8.0);
});

test("Thông tư 22: Điểm khống chế - ĐTB >= 8.0 nhưng có bài 6.0 (<6.5) bị hạ xuống Khá", () => {
  const scores = { tx1: 9.0, tx2: 9.5, tx3: 9.0, mid: 6.0, practice: 8.5, final: 8.5 };
  const weights = { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 };
  const result = evaluateStudentTT22(scores, weights);

  assert.equal(result.rank, "Khá");
  assert.equal(result.rankCode, "kha");
  assert.equal(result.hasSubMinimumScore, true);
  assert.ok(result.reason.includes("6"));
});

test("Thông tư 22: Điểm khống chế - ĐTB >= 6.5 nhưng có bài 3.0 (<3.5) bị xếp loại Chưa đạt", () => {
  const scores = { tx1: 8.0, tx2: 7.5, tx3: 7.0, mid: 3.0, practice: 7.0, final: 7.0 };
  const weights = { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 };
  const result = evaluateStudentTT22(scores, weights);

  assert.equal(result.rank, "Chưa đạt");
  assert.equal(result.rankCode, "chuadat");
  assert.equal(result.hasSubMinimumScore, true);
});

test("Trợ lý AI: Tạo nhận xét học sinh chuẩn Sandwich Feedback 3 vế", () => {
  const student = {
    name: "Nguyễn Minh Anh",
    gender: "Nữ",
    hand: 4,
    correct: 3,
    praise: 2,
    activity: 8,
    attendance: "present",
    scores: { tx1: 8.0, tx2: 8.5, tx3: 9.0, mid: 8.0, practice: 9.0, final: null },
    note: "",
    parentName: "Nguyễn Văn Hòa",
    parentPhone: "0901245688",
  };
  const context = {
    teacherName: "Mai Hoa",
    schoolName: "THCS Chu Văn An",
    subject: "Địa lý",
    className: "Lớp 8A2",
    semester: "Học kỳ I",
    schoolYear: "2025–2026",
    scoreWeights: { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 },
  };

  const feedback = generateSandwichFeedback(student, context, "encouraging");
  assert.ok(feedback.includes("Nguyễn Minh Anh"));
  assert.ok(feedback.length > 50);
});

test("Zalo Assistant: Tạo tin nhắn gửi phụ huynh chuẩn mực, đầy đủ thông tin", () => {
  const student = {
    name: "Trần Quốc Bảo",
    gender: "Nam",
    hand: 3,
    correct: 2,
    praise: 1,
    activity: 5,
    attendance: "present",
    scores: { tx1: 7.0, tx2: 8.0, tx3: null, mid: 7.5, practice: 8.0, final: null },
    note: "",
    parentName: "Trần Thị Mai",
    parentPhone: "0903622901",
  };
  const context = {
    teacherName: "Mai Hoa",
    schoolName: "THCS Chu Văn An",
    subject: "Địa lý",
    className: "Lớp 8A2",
    semester: "Học kỳ I",
    schoolYear: "2025–2026",
    scoreWeights: { tx1: 1, tx2: 1, tx3: 1, mid: 2, practice: 1, final: 3 },
  };

  const zaloMsg = generateZaloMessage(student, context, "khen-ngoi");
  assert.ok(zaloMsg.includes("Trần Quốc Bảo"));
  assert.ok(zaloMsg.includes("Mai Hoa"));
  assert.ok(zaloMsg.includes("Địa lý"));
  assert.ok(zaloMsg.includes("Lớp 8A2"));
  assert.ok(zaloMsg.includes("THCS Chu Văn An"));
});
