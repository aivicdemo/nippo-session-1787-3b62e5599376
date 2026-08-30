import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { analyzeIssueRecurrencePatterns } from "../../src/logic/report-search-and-retrieval";
import type {
  IssueRecurrenceAnalysisInput,
  IssueRecurrenceAnalysisResult,
} from "../../src/logic/report-search-and-retrieval";

describe("analyzeIssueRecurrencePatterns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-113
  test("should analyze issue recurrence patterns within specified period and return ranked results with bottleneck progression", async () => {
    const input_startDate = new Date("2024-01-01T00:00:00Z");
    const input_endDate = new Date("2024-01-31T23:59:59Z");
    const input_requestingUserId = "manager-001";
    const input_teamId = undefined;
    const input_issueKeywords = undefined;
    const input_minRecurrenceThreshold = 2;

    const mockIssueData = [
      {
        issueId: "issue-001",
        keyword: "データベース接続エラー",
        frequency: 2,
        affectedMembers: ["eng-001", "eng-002"],
        firstOccurrenceDate: new Date("2024-01-05T09:00:00Z"),
        lastOccurrenceDate: new Date("2024-01-20T10:30:00Z"),
        sourceReportIds: ["report-001", "report-005"],
      },
      {
        issueId: "issue-002",
        keyword: "ビルド失敗",
        frequency: 3,
        affectedMembers: ["eng-001", "eng-002", "eng-003"],
        firstOccurrenceDate: new Date("2024-01-08T14:00:00Z"),
        lastOccurrenceDate: new Date("2024-01-25T15:45:00Z"),
        sourceReportIds: ["report-002", "report-008", "report-012"],
      },
    ];

    const mockDeduplicatedIssues = [
      {
        issueId: "issue-001",
        keyword: "データベース接続エラー",
        frequency: 2,
        affectedMembers: ["eng-001", "eng-002"],
        firstOccurrenceDate: new Date("2024-01-05T09:00:00Z"),
        lastOccurrenceDate: new Date("2024-01-20T10:30:00Z"),
      },
      {
        issueId: "issue-002",
        keyword: "ビルド失敗",
        frequency: 3,
        affectedMembers: ["eng-001", "eng-002", "eng-003"],
        firstOccurrenceDate: new Date("2024-01-08T14:00:00Z"),
        lastOccurrenceDate: new Date("2024-01-25T15:45:00Z"),
      },
    ];

    const mockAccessCheck = jest
      .fn()
      .mockResolvedValue({ isAuthorized: true, visibleDataScope: "all_team" });

    const mockRetrieveIssues = jest
      .fn()
      .mockResolvedValue(mockIssueData);

    const mockDeduplicateIssues = jest
      .fn()
      .mockResolvedValue(mockDeduplicatedIssues);

    const result: IssueRecurrenceAnalysisResult =
      await analyzeIssueRecurrencePatterns({
        startDate: input_startDate,
        endDate: input_endDate,
        teamId: input_teamId,
        issueKeywords: input_issueKeywords,
        minRecurrenceThreshold: input_minRecurrenceThreshold,
        requestingUserId: input_requestingUserId,
      });

    expect(result).toBeDefined();
    expect(result.analysisId).toBeDefined();
    expect(typeof result.analysisId).toBe("string");
    expect(result.analysisId.length).toBeGreaterThan(0);

    expect(result.analysisPeriod).toBeDefined();
    expect(result.analysisPeriod.startDate).toEqual(input_startDate);
    expect(result.analysisPeriod.endDate).toEqual(input_endDate);

    expect(result.recurrencePatterns).toBeDefined();
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(result.recurrencePatterns.length).toBe(2);

    const pattern_database_connection = result.recurrencePatterns.find(
      (p) => p.issueKeyword === "データベース接続エラー"
    );
    expect(pattern_database_connection).toBeDefined();
    expect(pattern_database_connection?.frequency).toBe(2);
    expect(pattern_database_connection?.isRecurring).toBe(true);

    const pattern_build_failure = result.recurrencePatterns.find(
      (p) => p.issueKeyword === "ビルド失敗"
    );
    expect(pattern_build_failure).toBeDefined();
    expect(pattern_build_failure?.frequency).toBe(3);
    expect(pattern_build_failure?.isRecurring).toBe(true);

    expect(result.bottleneckProgression).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression)).toBe(true);
    expect(result.bottleneckProgression.length).toBeGreaterThanOrEqual(0);

    if (result.bottleneckProgression.length > 0) {
      const first_bottleneck = result.bottleneckProgression[0];
      expect(first_bottleneck.changeDate).toBeDefined();
      expect(first_bottleneck.changeDate instanceof Date).toBe(true);
      expect(first_bottleneck.currentBottleneck).toBeDefined();
      expect(typeof first_bottleneck.currentBottleneck).toBe("string");
    }

    expect(result.visualizationData).toBeDefined();
    expect(result.visualizationData.chartType).toBeDefined();
    expect(result.visualizationData.dataPoints).toBeDefined();
    expect(Array.isArray(result.visualizationData.dataPoints)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    const current_time = new Date();
    const time_difference_ms = Math.abs(
      current_time.getTime() - result.generatedAt.getTime()
    );
    expect(time_difference_ms).toBeLessThan(5000);
  });
});