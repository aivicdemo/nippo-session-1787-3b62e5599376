import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";
import { type MonthlyReportDataset } from "../../src/logic/monthly-performance-analysis";

describe("月次レポート生成機能", () => {
  // SCEN-1801
  test("ボトルネック推移データが null の状態でレポート生成するとエラーになる", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: "API接続エラー", frequency: 5 },
          { keyword: "デプロイ遅延", frequency: 3 },
        ],
        totalOccurrences: 8,
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
        severity: "high" as const,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue("high"),
    };

    const invalidMonthlyReportRequest = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: "user-001",
      teamIdFilter: ["team-a"],
      bottleneckTrendData: null,
    };

    expect(() =>
      extractMonthlyReportData(
        invalidMonthlyReportRequest,
        mockTextAnalysisServiceAdapter
      )
    ).toThrow(/ボトルネック推移データ/);
  });
});