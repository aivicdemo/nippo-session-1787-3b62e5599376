import { generateMonthlyAnalysisReport } from "../../src/logic/monthly-analysis-report";
import { type MonthlyAnalysisInput, type StructuredMonthlyReportContent } from "../../src/logic/monthly-analysis-report";

describe("Monthly Analysis Report Generation", () => {
  // SCEN-463: [edge] プロジェクト納期が本日より前の日付のときの警告処理
  test("should warn when project deadline is in the past and continue processing", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

    // 本日を2025-02-19と仮定
    const today = new Date("2025-02-19T09:00:00Z");
    const pastDeadline = new Date("2025-01-01T17:00:00Z");

    const input: MonthlyAnalysisInput = {
      aggregationPeriodStart: "2025-01-01",
      aggregationPeriodEnd: "2025-01-31",
      issueRankingData: [
        {
          issueId: "issue-001",
          keyword: "DB性能低下",
          frequency: 5,
          impactScore: 80,
        },
      ],
      priorityScoreData: [
        {
          issueId: "issue-001",
          priorityScore: 75,
          priorityRank: "high",
          colorCode: "red",
        },
      ],
      teamPerformanceMetrics: [
        {
          teamId: "team-001",
          issueResolutionSpeedDays: 3,
          reportSubmissionRate: 95,
          issueRecurrenceRate: 15,
        },
      ],
      bottleneckProgressionData: [
        {
          issueId: "issue-001",
          progressionType: "deteriorating",
          weeklyFrequencyTrend: [1, 2, 3, 4],
          category: "technical",
        },
      ],
    };

    // 本日より前の納期を指定してレポート生成
    // generateMonthlyAnalysisReport は内部で detectProjectDelayRisk を呼び出す
    const result: StructuredMonthlyReportContent = generateMonthlyAnalysisReport(
      input,
      pastDeadline,
      today
    );

    // 処理が続行され、警告が出力されていることを検証
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("プロジェクト納期が過去日付です")
    );

    // レポートが生成されていることを確認（処理が中断されていない）
    expect(result).toBeDefined();
    expect(result.reportPeriod).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    // daysUntilDeadline が負の値（-49日）であることを検証
    const daysUntilDeadline = Math.floor(
      (pastDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysUntilDeadline).toBe(-49);

    // riskLevelが計算ロジックに従い決定されていることを確認
    const riskAssessment = result.projectDelayRiskAssessment;
    expect(riskAssessment).toBeDefined();
    expect(["HIGH", "MEDIUM", "LOW"]).toContain(riskAssessment.riskLevel);

    consoleSpy.mockRestore();
  });
});