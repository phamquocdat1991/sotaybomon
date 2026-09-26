export type TT22Rank = "Tốt" | "Khá" | "Đạt" | "Chưa đạt" | "Chưa xếp loại";

export interface TT22Evaluation {
  average: number | null;
  rank: TT22Rank;
  rankCode: "tot" | "kha" | "dat" | "chuadat" | "none";
  colorClass: string;
  reason: string;
  recordedScoresCount: number;
  hasSubMinimumScore: boolean;
  minScore: number | null;
}

export function evaluateStudentTT22(
  scores: Record<string, number | null>,
  weights: Record<string, number>
): TT22Evaluation {
  const entries = Object.entries(scores)
    .filter(([, val]) => typeof val === "number" && !Number.isNaN(val))
    .map(([key, val]) => ({ key, value: val as number, weight: weights[key] ?? 1 }));

  if (!entries.length) {
    return {
      average: null,
      rank: "Chưa xếp loại",
      rankCode: "none",
      colorClass: "rank-none",
      reason: "Chưa có cột điểm nào được nhập",
      recordedScoresCount: 0,
      hasSubMinimumScore: false,
      minScore: null,
    };
  }

  const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = entries.reduce((sum, item) => sum + item.value * item.weight, 0);
  const avg = Math.round((weightedSum / totalWeight) * 10) / 10;

  const scoreValues = entries.map((item) => item.value);
  const minScore = Math.min(...scoreValues);

  // Kiểm tra đã có điểm giữa kỳ hoặc cuối kỳ chưa (để xét xếp loại đầy đủ)
  const hasPeriodicScore = typeof scores["mid"] === "number" || typeof scores["final"] === "number";

  if (!hasPeriodicScore && entries.length < 2) {
    return {
      average: avg,
      rank: "Chưa xếp loại",
      rankCode: "none",
      colorClass: "rank-none",
      reason: "Cần thêm bài kiểm tra để xếp loại",
      recordedScoresCount: entries.length,
      hasSubMinimumScore: false,
      minScore,
    };
  }

  // Tiêu chí TT 22/2021:
  // Tốt: ĐTB >= 8.0, tất cả điểm >= 6.5
  // Khá: ĐTB >= 6.5, tất cả điểm >= 5.0
  // Đạt: ĐTB >= 5.0, tất cả điểm >= 3.5
  // Chưa đạt: ĐTB < 5.0 hoặc có điểm < 3.5

  if (avg >= 8.0) {
    if (minScore >= 6.5) {
      return {
        average: avg,
        rank: "Tốt",
        rankCode: "tot",
        colorClass: "rank-tot",
        reason: "ĐTB ≥ 8,0 và không có điểm dưới 6,5",
        recordedScoresCount: entries.length,
        hasSubMinimumScore: false,
        minScore,
      };
    } else if (minScore >= 5.0) {
      return {
        average: avg,
        rank: "Khá",
        rankCode: "kha",
        colorClass: "rank-kha",
        reason: `Hạ Khá vì có bài kiểm tra ${minScore}đ (< 6,5)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    } else if (minScore >= 3.5) {
      return {
        average: avg,
        rank: "Đạt",
        rankCode: "dat",
        colorClass: "rank-dat",
        reason: `Hạ Đạt vì có bài kiểm tra ${minScore}đ (< 5,0)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    } else {
      return {
        average: avg,
        rank: "Chưa đạt",
        rankCode: "chuadat",
        colorClass: "rank-chuadat",
        reason: `Chưa đạt vì có bài kiểm tra ${minScore}đ (< 3,5)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    }
  }

  if (avg >= 6.5) {
    if (minScore >= 5.0) {
      return {
        average: avg,
        rank: "Khá",
        rankCode: "kha",
        colorClass: "rank-kha",
        reason: "ĐTB ≥ 6,5 và không có điểm dưới 5,0",
        recordedScoresCount: entries.length,
        hasSubMinimumScore: false,
        minScore,
      };
    } else if (minScore >= 3.5) {
      return {
        average: avg,
        rank: "Đạt",
        rankCode: "dat",
        colorClass: "rank-dat",
        reason: `Hạ Đạt vì có bài kiểm tra ${minScore}đ (< 5,0)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    } else {
      return {
        average: avg,
        rank: "Chưa đạt",
        rankCode: "chuadat",
        colorClass: "rank-chuadat",
        reason: `Chưa đạt vì có bài kiểm tra ${minScore}đ (< 3,5)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    }
  }

  if (avg >= 5.0) {
    if (minScore >= 3.5) {
      return {
        average: avg,
        rank: "Đạt",
        rankCode: "dat",
        colorClass: "rank-dat",
        reason: "ĐTB ≥ 5,0 và không có điểm dưới 3,5",
        recordedScoresCount: entries.length,
        hasSubMinimumScore: false,
        minScore,
      };
    } else {
      return {
        average: avg,
        rank: "Chưa đạt",
        rankCode: "chuadat",
        colorClass: "rank-chuadat",
        reason: `Chưa đạt vì có bài kiểm tra ${minScore}đ (< 3,5)`,
        recordedScoresCount: entries.length,
        hasSubMinimumScore: true,
        minScore,
      };
    }
  }

  return {
    average: avg,
    rank: "Chưa đạt",
    rankCode: "chuadat",
    colorClass: "rank-chuadat",
    reason: `ĐTB ${avg.toFixed(1)} < 5,0`,
    recordedScoresCount: entries.length,
    hasSubMinimumScore: false,
    minScore,
  };
}
