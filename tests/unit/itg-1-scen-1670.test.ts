import { generateWeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from "../../src/logic/weekly-issue-analysis";

describe("週次課題傾向分析レポート生成", () => {
  // SCEN-1670
  test("日報件数が最小閾値以上かつデータ品質が有効なとき分析実行フラグがtrueになる", () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "ビルド失敗", frequency: 5 },
          { keyword: "テスト不安定", frequency: 3 },
          { keyword: "デプロイ遅延", frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: "high",
      }),
    };

    const analysisStartDate = new Date("2024-01-08T00:00:00Z");
    const analysisEndDate = new Date("2024-01-14T23:59:59Z");

    const extractedIssuesData = [
      {
        issueKeyword: "ビルド失敗",
        occurrenceCount: 5,
        teamImpactScope: "frontend-team",
        impactScore: 75,
      },
      {
        issueKeyword: "テスト不安定",
        occurrenceCount: 3,
        teamImpactScope: "qa-team",
        impactScore: 65,
      },
      {
        issueKeyword: "デプロイ遅延",
        occurrenceCount: 2,
        teamImpactScope: "devops-team",
        impactScore: 55,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: "2024-01-08",
      aggregationEndDate: "2024-01-14",
      extractedIssues: extractedIssuesData,
      teamId: "engineering-team-001",
    };

    const report = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(report).toBeDefined();
    expect(report.reportId).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe("2024-01-08");
    expect(report.aggregationPeriod.endDate).toBe("2024-01-14");
    expect(report.issueRanking).toBeDefined();
    expect(report.issueRanking.length).toBeGreaterThan(0);
    expect(report.issueRanking[0].issueKeyword).toBe("ビルド失敗");
    expect(report.issueRanking[0].occurrenceCount).toBe(5);
    expect(report.issueRanking[0].rank).toBe(1);
    expect(report.priorityScores).toBeDefined();
    expect(report.priorityScores.length).toBeGreaterThan(0);
    expect(report.priorityScores[0].priorityScore).toBeGreaterThanOrEqual(0);
    expect(report.priorityScores[0].priorityScore).toBeLessThanOrEqual(100);
    expect(["high", "medium", "low"]).toContain(
      report.priorityScores[0].priorityRank
    );
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(report.recommendedCountermeasures.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeDefined();
    const generatedAtDate = new Date(report.generatedAt);
    expect(generatedAtDate.getTime()).toBeGreaterThan(0);
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});