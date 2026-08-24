import { describe, test, expect } from "@jest/globals";
import { calculateTeamPerformanceMetrics } from "../../src/logic/monthly-performance-analysis";

describe("月次チームパフォーマンス分析", () => {
  test("SCEN-2312: 指定期間内の日報1件から課題解決日数と対応完了率が正しく計算される", () => {
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");
    const teamId = "team-001";

    const reportRecords = [
      {
        recordId: "report-2024-01-15-001",
        reportDate: new Date("2024-01-15T09:00:00Z"),
        teamId: "team-001",
        memberId: "member-001",
        yesterdayAccomplishment: "バグ修正3件対応完了",
        todayPlan: "新機能実装開始、レビュー対応",
        issues: [
          {
            issueId: "issue-001",
            issueText: "データベース接続タイムアウト",
            reportedDate: new Date("2024-01-10T09:00:00Z"),
            resolvedDate: new Date("2024-01-15T14:00:00Z"),
            resolutionDays: 5,
            resolutionStatus: "resolved" as const,
          },
        ],
      },
    ];

    const result = calculateTeamPerformanceMetrics({
      aggregationStartDate,
      aggregationEndDate,
      teamIds: [teamId],
      reportDataset: reportRecords,
    });

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe("team-001");
    expect(typeof teamMetric.issueResolutionSpeed).toBe("number");
    expect(typeof teamMetric.reportSubmissionRate).toBe("number");
    expect(typeof teamMetric.issueRecurrenceRate).toBe("number");
    expect(typeof teamMetric.priorityScore).toBe("number");

    expect(teamMetric.issueResolutionSpeed).toBe(5);
    expect(teamMetric.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(teamMetric.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(teamMetric.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(teamMetric.priorityScore).toBeGreaterThanOrEqual(1);
    expect(teamMetric.priorityScore).toBeLessThanOrEqual(100);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(31);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.outlierDetectionResult).toBeDefined();
  });
});