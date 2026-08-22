import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-147: 課題検索から可視化レポート作成までの自動実行 AIエージェント
  test("should execute all 5 autonomous actions in correct order and return visualization report with required attributes", async () => {
    const mockReportingData = [
      {
        id: "issue_001",
        title: "Database connection timeout",
        reportedDate: "2024-01-08T09:00:00Z",
        category: "infrastructure",
        priority: "high",
        recurrenceCount: 3,
        firstOccurrence: "2024-01-01T08:30:00Z",
        lastOccurrence: "2024-01-08T09:00:00Z",
      },
      {
        id: "issue_002",
        title: "API response delay",
        reportedDate: "2024-01-09T10:15:00Z",
        category: "performance",
        priority: "medium",
        recurrenceCount: 2,
        firstOccurrence: "2024-01-05T14:20:00Z",
        lastOccurrence: "2024-01-09T10:15:00Z",
      },
      {
        id: "issue_003",
        title: "Memory leak in worker thread",
        reportedDate: "2024-01-10T11:30:00Z",
        category: "infrastructure",
        priority: "high",
        recurrenceCount: 5,
        firstOccurrence: "2023-12-28T16:45:00Z",
        lastOccurrence: "2024-01-10T11:30:00Z",
      },
      {
        id: "issue_004",
        title: "UI rendering glitch",
        reportedDate: "2024-01-07T13:20:00Z",
        category: "frontend",
        priority: "low",
        recurrenceCount: 1,
        firstOccurrence: "2024-01-07T13:20:00Z",
        lastOccurrence: "2024-01-07T13:20:00Z",
      },
    ];

    const mockAiClient = {
      callAction01: jest
        .fn()
        .mockResolvedValue({
          issues: mockReportingData,
          extractionTimestamp: "2024-01-15T08:00:00Z",
          totalExtracted: 4,
        }),
      callAction02: jest.fn().mockResolvedValue({
        patterns: [
          {
            patternId: "pattern_infra_001",
            category: "infrastructure",
            recurrenceRate: 0.75,
            timeSeriesData: [
              { date: "2024-01-01", count: 1 },
              { date: "2024-01-05", count: 0 },
              { date: "2024-01-08", count: 1 },
              { date: "2024-01-10", count: 1 },
            ],
          },
          {
            patternId: "pattern_perf_001",
            category: "performance",
            recurrenceRate: 0.5,
            timeSeriesData: [
              { date: "2024-01-05", count: 1 },
              { date: "2024-01-09", count: 1 },
            ],
          },
        ],
      }),
      callAction03: jest.fn().mockResolvedValue({
        bottlenecks: [
          {
            bottleneckId: "bn_001",
            category: "infrastructure",
            severity: "critical",
            trend: "increasing",
            trendChangePoints: [
              {
                date: "2024-01-08",
                changePercentage: 50.0,
                description: "spike in database timeout incidents",
              },
              {
                date: "2024-01-10",
                changePercentage: 66.67,
                description: "memory leak escalation detected",
              },
            ],
          },
          {
            bottleneckId: "bn_002",
            category: "performance",
            severity: "moderate",
            trend: "stable",
            trendChangePoints: [],
          },
        ],
      }),
      callAction04: jest.fn().mockResolvedValue({
        reportId: "report_jan_2024",
        visualizationFormat: "json",
        chartData: {
          recurrenceTimeline: {
            seriesLabel: "Issue Recurrence Over Time",
            dataPoints: [
              { timestamp: "2024-01-01T00:00:00Z", issueCount: 1 },
              { timestamp: "2024-01-05T00:00:00Z", issueCount: 1 },
              { timestamp: "2024-01-08T00:00:00Z", issueCount: 2 },
              { timestamp: "2024-01-09T00:00:00Z", issueCount: 1 },
              { timestamp: "2024-01-10T00:00:00Z", issueCount: 1 },
            ],
          },
          categoryDistribution: {
            infrastructure: 3,
            performance: 1,
            frontend: 1,
          },
        },
      }),
      callAction05: jest.fn().mockResolvedValue({
        prioritizedIssues: {
          high: [
            {
              id: "issue_001",
              title: "Database connection timeout",
              recurrenceCount: 3,
              emphasis: "critical_trend",
            },
            {
              id: "issue_003",
              title: "Memory leak in worker thread",
              recurrenceCount: 5,
              emphasis: "highest_priority",
            },
          ],
          medium: [
            {
              id: "issue_002",
              title: "API response delay",
              recurrenceCount: 2,
              emphasis: "standard",
            },
          ],
          low: [
            {
              id: "issue_004",
              title: "UI rendering glitch",
              recurrenceCount: 1,
              emphasis: "monitor_only",
            },
          ],
        },
      }),
    };

    const input = {
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-01-10T23:59:59Z",
      systemAccessToken: "mock_token_abc123",
    };

    const result = await generateMonthlyAnalysisReport(input, mockAiClient);

    expect(mockAiClient.callAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.callAction05).toHaveBeenCalledTimes(1);

    expect(result).toHaveProperty("recurrencePatterns");
    expect(result).toHaveProperty("bottleneckTrends");
    expect(result).toHaveProperty("prioritizedIssuesList");
    expect(result).toHaveProperty("generatedTimestamp");

    expect(result.recurrencePatterns).toBeInstanceOf(Array);
    expect(result.recurrencePatterns).toHaveLength(2);
    expect(result.recurrencePatterns[0]).toHaveProperty("patternId");
    expect(result.recurrencePatterns[0]).toHaveProperty("recurrenceRate");
    expect(result.recurrencePatterns[0]).toHaveProperty("timeSeriesData");

    expect(result.bottleneckTrends).toBeInstanceOf(Array);
    expect(result.bottleneckTrends).toHaveLength(2);
    expect(result.bottleneckTrends[0]).toHaveProperty("bottleneckId");
    expect(result.bottleneckTrends[0]).toHaveProperty("trend");
    expect(result.bottleneckTrends[0]).toHaveProperty("trendChangePoints");

    expect(result.prioritizedIssuesList).toHaveProperty("high");
    expect(result.prioritizedIssuesList).toHaveProperty("medium");
    expect(result.prioritizedIssuesList).toHaveProperty("low");

    expect(result.prioritizedIssuesList.high).toBeInstanceOf(Array);
    expect(result.prioritizedIssuesList.high).toHaveLength(2);
    expect(result.prioritizedIssuesList.high[0]).toHaveProperty("id");
    expect(result.prioritizedIssuesList.high[0]).toHaveProperty("title");

    expect(result.prioritizedIssuesList.medium).toBeInstanceOf(Array);
    expect(result.prioritizedIssuesList.medium).toHaveLength(1);

    expect(result.prioritizedIssuesList.low).toBeInstanceOf(Array);
    expect(result.prioritizedIssuesList.low).toHaveLength(1);

    expect(typeof result.generatedTimestamp).toBe("string");
    const timestampDate = new Date(result.generatedTimestamp);
    expect(timestampDate.getTime()).toBeGreaterThan(0);

    expect(mockAiClient.callAction01).toHaveBeenCalledBefore(
      mockAiClient.callAction02
    );
    expect(mockAiClient.callAction02).toHaveBeenCalledBefore(
      mockAiClient.callAction03
    );
    expect(mockAiClient.callAction03).toHaveBeenCalledBefore(
      mockAiClient.callAction04
    );
    expect(mockAiClient.callAction04).toHaveBeenCalledBefore(
      mockAiClient.callAction05
    );
  });
});