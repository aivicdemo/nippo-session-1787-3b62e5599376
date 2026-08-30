import { analyzeIssueRecurrencePatterns } from "../../src/logic/report-search-and-retrieval";
import { type IssueRecurrenceAnalysisInput, type IssueRecurrenceAnalysisResult } from "../../src/logic/report-search-and-retrieval";

describe("analyzeIssueRecurrencePatterns", () => {
  test("SCEN-534: should analyze recurrence patterns with short normalized issue text warnings", async () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-31T23:59:59Z");
    const teamId = "team-001";
    const requestingUserId = "user-manager-001";
    const issueKeywords = ["バグ", "設計", "テスト遅延", "データベース接続エラー", "キャッシュ機構の不具合"];
    const minRecurrenceThreshold = 2;

    const mockAnalysisResult: IssueRecurrenceAnalysisResult = {
      analysisId: "analysis-12345",
      analysisPeriod: {
        startDate: startDate,
        endDate: endDate,
      },
      recurrencePatterns: [
        {
          issueKeyword: "バグ",
          frequency: 5,
          firstOccurrenceDate: new Date("2024-01-05T09:00:00Z"),
          lastOccurrenceDate: new Date("2024-01-25T10:30:00Z"),
          affectedMemberCount: 3,
          normalizedContent: "バグ",
          sourceReportIds: ["report-001", "report-002", "report-015", "report-028", "report-032"],
        },
        {
          issueKeyword: "設計",
          frequency: 3,
          firstOccurrenceDate: new Date("2024-01-08T14:00:00Z"),
          lastOccurrenceDate: new Date("2024-01-22T11:15:00Z"),
          affectedMemberCount: 2,
          normalizedContent: "設計",
          sourceReportIds: ["report-003", "report-010", "report-018"],
        },
        {
          issueKeyword: "テスト遅延",
          frequency: 4,
          firstOccurrenceDate: new Date("2024-01-10T08:45:00Z"),
          lastOccurrenceDate: new Date("2024-01-24T16:20:00Z"),
          affectedMemberCount: 4,
          normalizedContent: "テスト遅延",
          sourceReportIds: ["report-005", "report-012", "report-019", "report-026"],
        },
        {
          issueKeyword: "データベース接続エラー",
          frequency: 2,
          firstOccurrenceDate: new Date("2024-01-12T10:00:00Z"),
          lastOccurrenceDate: new Date("2024-01-20T13:45:00Z"),
          affectedMemberCount: 2,
          normalizedContent: "データベース接続エラー",
          sourceReportIds: ["report-007", "report-014"],
        },
        {
          issueKeyword: "キャッシュ機構の不具合",
          frequency: 2,
          firstOccurrenceDate: new Date("2024-01-15T11:30:00Z"),
          lastOccurrenceDate: new Date("2024-01-23T09:00:00Z"),
          affectedMemberCount: 1,
          normalizedContent: "キャッシュ機構の不具合",
          sourceReportIds: ["report-009", "report-017"],
        },
      ],
      bottleneckProgression: [
        {
          changeDate: new Date("2024-01-10T00:00:00Z"),
          previousBottleneck: "バグ",
          currentBottleneck: "テスト遅延",
          changeReason: "テスト環境の問題が新規に発生しました",
        },
        {
          changeDate: new Date("2024-01-20T00:00:00Z"),
          previousBottleneck: "テスト遅延",
          currentBottleneck: "バグ",
          changeReason: "テスト環境問題が解決され、バグ修正が再度優先課題になりました",
        },
      ],
      visualizationData: {
        timeSeriesData: [
          { date: "2024-01-05", issueKeyword: "バグ", frequency: 1 },
          { date: "2024-01-08", issueKeyword: "設計", frequency: 1 },
          { date: "2024-01-10", issueKeyword: "テスト遅延", frequency: 1 },
          { date: "2024-01-12", issueKeyword: "データベース接続エラー", frequency: 1 },
          { date: "2024-01-15", issueKeyword: "キャッシュ機構の不具合", frequency: 1 },
        ],
        rankingData: [
          { rank: 1, issueKeyword: "バグ", frequency: 5 },
          { rank: 2, issueKeyword: "テスト遅延", frequency: 4 },
          { rank: 3, issueKeyword: "設計", frequency: 3 },
          { rank: 4, issueKeyword: "データベース接続エラー", frequency: 2 },
          { rank: 5, issueKeyword: "キャッシュ機構の不具合", frequency: 2 },
        ],
        bottleneckTimeline: [
          { date: "2024-01-10", bottleneckKeyword: "テスト遅延" },
          { date: "2024-01-20", bottleneckKeyword: "バグ" },
        ],
      },
      generatedAt: new Date("2024-02-01T08:00:00Z"),
    };

    const input: IssueRecurrenceAnalysisInput = {
      startDate: startDate,
      endDate: endDate,
      teamId: teamId,
      issueKeywords: issueKeywords,
      minRecurrenceThreshold: minRecurrenceThreshold,
      requestingUserId: requestingUserId,
    };

    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await analyzeIssueRecurrencePatterns(input);

    expect(result).toBeDefined();
    expect(result.analysisId).toBe("analysis-12345");
    expect(result.analysisPeriod.startDate).toEqual(startDate);
    expect(result.analysisPeriod.endDate).toEqual(endDate);
    expect(result.recurrencePatterns).toHaveLength(5);

    const shortTextPatterns = result.recurrencePatterns.filter(
      (pattern) => pattern.normalizedContent.length < 10
    );
    expect(shortTextPatterns).toHaveLength(3);
    expect(shortTextPatterns.map((p) => p.issueKeyword)).toContain("バグ");
    expect(shortTextPatterns.map((p) => p.issueKeyword)).toContain("設計");
    expect(shortTextPatterns.map((p) => p.issueKeyword)).toContain("テスト遅延");

    const longTextPatterns = result.recurrencePatterns.filter(
      (pattern) => pattern.normalizedContent.length >= 10
    );
    expect(longTextPatterns).toHaveLength(2);
    expect(longTextPatterns.map((p) => p.issueKeyword)).toContain("データベース接続エラー");
    expect(longTextPatterns.map((p) => p.issueKeyword)).toContain("キャッシュ機構の不具合");

    expect(result.bottleneckProgression).toHaveLength(2);
    expect(result.bottleneckProgression[0].changeDate).toEqual(new Date("2024-01-10T00:00:00Z"));
    expect(result.bottleneckProgression[0].previousBottleneck).toBe("バグ");
    expect(result.bottleneckProgression[0].currentBottleneck).toBe("テスト遅延");
    expect(result.bottleneckProgression[1].changeDate).toEqual(new Date("2024-01-20T00:00:00Z"));

    expect(result.visualizationData).toBeDefined();
    expect(result.visualizationData.timeSeriesData).toHaveLength(5);
    expect(result.visualizationData.rankingData).toHaveLength(5);
    expect(result.visualizationData.rankingData[0].issueKeyword).toBe("バグ");
    expect(result.visualizationData.rankingData[0].frequency).toBe(5);
    expect(result.visualizationData.bottleneckTimeline).toHaveLength(2);

    expect(result.generatedAt).toEqual(new Date("2024-02-01T08:00:00Z"));

    const warningCalls = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes("課題の説明が短すぎる可能性があります")
    );
    expect(warningCalls.length).toBeGreaterThanOrEqual(3);

    consoleSpy.mockRestore();
  });
});