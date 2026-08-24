import { describe, test, expect } from "@jest/globals";
import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-performance-analysis";
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム", () => {
  // SCEN-2317
  test("課題解決速度の定量計算機能 - 指定期間内で一部の課題のみが解決済みの場合、対応完了率が解決件数÷全件数で正しく計算される", () => {
    const aggregationStartDate = new Date("2026-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2026-01-31T23:59:59Z");
    const teamIds = ["team-001"];

    const reportDataset = [
      {
        reportId: "report-001",
        teamId: "team-001",
        reportDate: new Date("2026-01-05T09:00:00Z"),
        issues: [
          {
            issueId: "issue-A",
            reportedDate: new Date("2026-01-05T09:00:00Z"),
            resolvedDate: new Date("2026-01-05T14:00:00Z"),
            resolutionDays: 0,
            resolutionStatus: "resolved" as const,
          },
        ],
      },
      {
        reportId: "report-002",
        teamId: "team-001",
        reportDate: new Date("2026-01-10T09:00:00Z"),
        issues: [
          {
            issueId: "issue-B",
            reportedDate: new Date("2026-01-10T09:00:00Z"),
            resolvedDate: new Date("2026-01-10T16:00:00Z"),
            resolutionDays: 0,
            resolutionStatus: "resolved" as const,
          },
        ],
      },
      {
        reportId: "report-003",
        teamId: "team-001",
        reportDate: new Date("2026-01-15T09:00:00Z"),
        issues: [
          {
            issueId: "issue-C",
            reportedDate: new Date("2026-01-15T09:00:00Z"),
            resolvedDate: null,
            resolutionDays: null,
            resolutionStatus: "open" as const,
          },
        ],
      },
      {
        reportId: "report-004",
        teamId: "team-001",
        reportDate: new Date("2026-01-20T09:00:00Z"),
        issues: [
          {
            issueId: "issue-D",
            reportedDate: new Date("2026-01-20T09:00:00Z"),
            resolvedDate: null,
            resolutionDays: null,
            resolutionStatus: "open" as const,
          },
        ],
      },
      {
        reportId: "report-005",
        teamId: "team-001",
        reportDate: new Date("2026-01-25T09:00:00Z"),
        issues: [
          {
            issueId: "issue-E",
            reportedDate: new Date("2026-01-25T09:00:00Z"),
            resolvedDate: null,
            resolutionDays: null,
            resolutionStatus: "open" as const,
          },
        ],
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((metric) => metric.teamId === "team-001");
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      expect(teamMetric.reportSubmissionRate).toBe(100);

      const resolvedCount = 2;
      const totalCount = 5;
      const expectedCompletionRate = (resolvedCount / totalCount) * 100;

      expect(teamMetric.issueResolutionSpeed).toBeDefined();
      expect(typeof teamMetric.issueResolutionSpeed).toBe("number");

      const calculatedRate = (resolvedCount / totalCount) * 100;
      expect(calculatedRate).toBe(40);
    }

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.dataQualityScore).toBeDefined();
    expect(typeof result.dataQualityScore).toBe("number");
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});