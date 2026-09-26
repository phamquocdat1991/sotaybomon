import { evaluateStudentTT22, type TT22Evaluation } from "./tt22-evaluation";

export interface StudentDataForAI {
  name: string;
  gender: "Nam" | "Nữ" | "Khác";
  hand: number;
  correct: number;
  praise: number;
  activity: number;
  attendance: "present" | "absent" | "late" | "excused";
  scores: Record<string, number | null>;
  note: string;
  parentName: string;
  parentPhone: string;
}

export interface ContextDataForAI {
  teacherName: string;
  schoolName: string;
  subject: string;
  className: string;
  semester: string;
  schoolYear: string;
  scoreWeights: Record<string, number>;
}

export type ZaloScenario = "khen-ngoi" | "nhac-nho" | "chuyen-can" | "tong-ket";

/**
 * 1. Thuật toán tạo nhận xét học sinh chuẩn phương pháp "Sandwich Feedback" (3 vế sư phạm)
 */
export function generateSandwichFeedback(
  student: StudentDataForAI,
  context: ContextDataForAI,
  tone: "encouraging" | "academic" | "short"
): string {
  const evalTT22 = evaluateStudentTT22(student.scores, context.scoreWeights);
  const avg = evalTT22.average;
  const rank = evalTT22.rank;
  const isFemale = student.gender === "Nữ";
  const pronoun = "Em";

  // VẾ 1: Khen ngợi ưu điểm nổi bật (Praise)
  const praises: string[] = [];
  if (student.praise > 0) {
    praises.push(`có ${student.praise} lần trả lời xuất sắc được tuyên dương trước lớp`);
  } else if (student.correct >= 2) {
    praises.push(`rất tích cực với ${student.correct} lần trả lời đúng`);
  } else if (student.hand >= 3) {
    praises.push(`chăm chỉ giơ tay phát biểu (${student.hand} lượt)`);
  }

  if (student.activity >= 6) {
    praises.push("tham gia sôi nổi các hoạt động học tập");
  } else if (student.activity > 0) {
    praises.push("có ý thức tham gia xây dựng bài");
  }

  if (student.attendance === "present") {
    praises.push("chuyên cần, đi học đúng giờ và nề nếp tốt");
  }

  if (avg !== null && avg >= 8.0) {
    praises.push(`nắm vững kiến thức trọng tâm bộ môn, điểm trung bình đạt ${avg.toFixed(1)} (${rank})`);
  } else if (avg !== null && avg >= 6.5) {
    praises.push(`kết quả học tập ổn định, đạt mức ${rank} (ĐTB ${avg.toFixed(1)})`);
  }

  const praisePart = praises.length
    ? `${pronoun} ${student.name} ${praises.slice(0, 2).join(", ")}.`
    : `${pronoun} ${student.name} có nỗ lực duy trì việc học tập môn ${context.subject}.`;

  // VẾ 2: Góp ý điểm cần khắc phục (Constructive Guidance)
  const improvements: string[] = [];
  if (student.attendance === "late") {
    improvements.push("cần chú ý đến lớp đúng giờ để không bỏ lỡ phần khởi động bài học");
  } else if (student.attendance === "absent" || student.attendance === "excused") {
    improvements.push("cần chủ động mượn vở bạn chép bài và hỏi lại thầy cô phần bài chưa rõ");
  }

  if (evalTT22.hasSubMinimumScore && evalTT22.minScore !== null) {
    improvements.push(`cần củng cố thêm nội dung bài kiểm tra ${evalTT22.minScore}đ để kết quả đồng đều hơn`);
  } else if (avg !== null && avg < 5.0) {
    improvements.push("cần ôn tập lại các khái niệm cơ bản và làm đầy đủ bài tập rèn luyện");
  } else if (avg !== null && avg < 6.5) {
    improvements.push("cần rèn thêm kỹ năng phân tích và làm bài tập vận dụng để nâng cao điểm số");
  }

  if (student.activity < 2 && student.hand === 0) {
    improvements.push("cần tự tin, mạnh dạn giơ tay phát biểu ý kiến hơn trong giờ học");
  }

  const improvePart = improvements.length
    ? `Tuy nhiên, ${improvements.slice(0, 2).join("; ")}.`
    : `Em duy trì rất tốt thái độ học tập và không có vấn đề cần nhắc nhở.`;

  // VẾ 3: Động viên & Khích lệ (Encouragement & Forward look)
  let motivatePart = "";
  if (tone === "short") {
    motivatePart = "Mong em tiếp tục cố gắng phát huy.";
  } else if (avg !== null && avg >= 8.0) {
    motivatePart = `Thầy/Cô tin tưởng ${student.name} sẽ tiếp tục giữ vững phong độ và đạt thành tích cao hơn nữa trong các kỳ đánh giá tiếp theo.`;
  } else if (avg !== null && avg >= 6.5) {
    motivatePart = `Chỉ cần tập trung thêm một chút, ${student.name} hoàn toàn có thể bứt phá lên mức Tốt trong thời gian tới!`;
  } else {
    motivatePart = `Thầy/Cô luôn sẵn sàng hỗ trợ, mong ${student.name} kiên trì và không nản lòng, em chắc chắn sẽ tiến bộ rõ rệt!`;
  }

  if (tone === "short") {
    return `${student.name}: ${praises[0] || "Học tập nghiêm túc"}. ${improvements[0] ? `Lưu ý: ${improvements[0]}.` : ""} ${motivatePart}`;
  }

  return `${praisePart} ${improvePart} ${motivatePart}`;
}

/**
 * 2. Soạn tin nhắn Zalo gửi Phụ huynh học sinh (1-Click Copy)
 */
export function generateZaloMessage(
  student: StudentDataForAI,
  context: ContextDataForAI,
  scenario: ZaloScenario
): string {
  const evalTT22 = evaluateStudentTT22(student.scores, context.scoreWeights);
  const avgText = evalTT22.average !== null ? `${evalTT22.average.toFixed(1)} (${evalTT22.rank})` : "chưa có đủ điểm";
  const parentSalutation = student.parentName ? `phụ huynh em ${student.name}` : `gia đình em ${student.name}`;
  const teacherSign = context.teacherName ? `${context.teacherName}` : "Giáo viên bộ môn";

  switch (scenario) {
    case "khen-ngoi":
      return `Dạ kính gửi ${parentSalutation},

Em là ${teacherSign}, giáo viên phụ trách bộ môn ${context.subject} lớp ${context.className} (${context.schoolName}).

Em xin vui mừng chia sẻ với gia đình về tinh thần học tập rất tích cực của ${student.name} trong thời gian qua:
• Điểm hoạt động phát biểu: +${student.activity}đ (${student.hand} lượt giơ tay, ${student.correct} lần trả lời đúng).
• Điểm trung bình môn hiện tại: ${avgText}.
• Tinh thần: Rất chăm chỉ, lễ phép và tích cực tham gia các hoạt động cùng thầy cô và bạn bè.

Xin chúc mừng gia đình và cảm ơn quý phụ huynh đã luôn đồng hành, động viên em. Mong gia đình tiếp tục khích lệ để em giữ vững niềm đam mê học tập ạ!

Trân trọng,
${teacherSign}`;

    case "nhac-nho":
      return `Dạ kính gửi ${parentSalutation},

Em là ${teacherSign}, giáo viên bộ môn ${context.subject} lớp ${context.className} (${context.schoolName}).

Em xin phép trao đổi nhanh với gia đình về việc học tập của ${student.name}:
• Điểm trung bình môn hiện tại: ${avgText}.
• Tình hình lớp học: Trong giờ học, em còn khá rụt rè, ít giơ tay phát biểu${student.activity < 2 ? " và chưa thật sự tập trung" : ""}.

Để giúp em tiến bộ hơn và chuẩn bị tốt cho các bài kiểm tra sắp tới, em rất mong phụ huynh nhắc nhở em:
1. Xem lại bài học và hoàn thành bài tập trước khi đến lớp.
2. Mạnh dạn hỏi thầy cô khi chưa hiểu bài.

Em xin chân thành cảm ơn sự phối hợp quý báu từ phía gia đình ạ!

Trân trọng,
${teacherSign}`;

    case "chuyen-can":
      return `Dạ kính gửi ${parentSalutation},

Em là ${teacherSign}, giáo viên bộ môn ${context.subject} lớp ${context.className}.

Em xin thông tin đến gia đình về tình hình chuyên cần của ${student.name} trong tiết học gần nhất:
• Trạng thái ghi nhận: ${student.attendance === "late" ? "Em có đi học muộn" : student.attendance === "absent" ? "Em vắng mặt chưa rõ lý do" : "Em có vắng mặt có phép"}.
• Để không bị hổng kiến thức bài học, em nhờ gia đình nhắc nhở ${student.name} mượn vở bạn chép lại nội dung bài và hỏi lại thầy cô những phần chưa nắm vững ạ.

Kính chúc gia đình nhiều sức khỏe!

Trân trọng,
${teacherSign}`;

    case "tong-ket":
    default:
      return `Dạ kính gửi ${parentSalutation},

Em là ${teacherSign}, giáo viên bộ môn ${context.subject} lớp ${context.className} (${context.schoolName}).

Em xin gửi đến gia đình phiếu tổng hợp kết quả học tập môn ${context.subject} của em ${student.name} trong ${context.semester.toLowerCase()} (Năm học ${context.schoolYear}):
• Điểm trung bình môn: ${avgText}
• Xếp loại theo Thông tư 22: ${evalTT22.rank}
• Tương tác phát biểu: ${student.hand} lượt giơ tay, ${student.correct} câu trả lời đúng
• Chuyên cần: ${student.attendance === "present" ? "Đi học đầy đủ, đúng giờ" : student.attendance === "late" ? "Có lần đi muộn" : "Có buổi vắng mặt"}
• Nhận xét chung: ${student.note || generateSandwichFeedback(student, context, "short")}

Kính mong gia đình tiếp tục phối hợp cùng nhà trường để tạo điều kiện tốt nhất cho quá trình học tập của em.

Trân trọng,
${teacherSign}`;
  }
}

/**
 * 3. Gọi Gemini API nếu có API Key, với timeout và tự động fallback về Offline Smart Rule
 */
export async function generateWithGeminiOrFallback(
  student: StudentDataForAI,
  context: ContextDataForAI,
  tone: "encouraging" | "academic" | "short",
  apiKey?: string
): Promise<{ text: string; source: "gemini" | "smart-rule" }> {
  if (!apiKey || !apiKey.trim()) {
    return {
      text: generateSandwichFeedback(student, context, tone),
      source: "smart-rule",
    };
  }

  const prompt = `Bạn là chuyên gia sư phạm Việt Nam. Hãy viết một lời nhận xét học bạ / sổ liên lạc điện tử cho học sinh sau đây:
Họ và tên: ${student.name} (${student.gender})
Môn học: ${context.subject}, Lớp ${context.className}, ${context.schoolName}
Học kỳ: ${context.semester}, Năm học: ${context.schoolYear}
Điểm số: ${JSON.stringify(student.scores)}
Số lượt giơ tay: ${student.hand}, Trả lời đúng: ${student.correct}, Tuyên dương: ${student.praise}
Trạng thái chuyên cần: ${student.attendance}
Ghi chú riêng: ${student.note || "Không có"}
Yêu cầu phong cách: ${tone === "encouraging" ? "Tích cực, truyền cảm hứng" : tone === "academic" ? "Trang trọng, chuẩn mực học thuật" : "Ngắn gọn, súc tích"}.
Áp dụng cấu trúc Sandwich Feedback 3 vế:
1. Khen ngợi ưu điểm cụ thể (nỗ lực, phát biểu, điểm tốt).
2. Nhắc nhở khéo léo điểm cần khắc phục nếu có (chuyên cần, điểm còn thấp).
3. Động viên, khích lệ và định hướng hành động.
Độ dài khoảng 3-4 câu, xưng hô Thầy/Cô và Em. Không dùng các ký hiệu markdown dư thừa.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText && typeof generatedText === "string") {
      return {
        text: generatedText.trim(),
        source: "gemini",
      };
    }
  } catch (error) {
    console.warn("Gemini call failed or timed out, falling back to smart rules:", error);
  }

  // Fallback an toàn về rule offline
  return {
    text: generateSandwichFeedback(student, context, tone),
    source: "smart-rule",
  };
}
