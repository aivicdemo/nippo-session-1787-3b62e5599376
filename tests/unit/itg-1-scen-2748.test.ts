import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractDashboardReportData } from "../../src/logic/manager-dashboard";
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  PrioritizedIssue,
  SubmissionSummary,
} from "../../src/logic/manager-dashboard";

describe("Manager Dashboard - Extract Report Data", () => {
  // SCEN-2748: [normal] ダッシュボード表示機能 - 報告が1件の場合に1つの課題が返却される
  test("should return exactly one prioritized issue when one report with one extracted keyword is submitted", () => {
    const now = new Date("2024-01-15T10:30:00Z");
    const reportDate = "2024-01-15";
    const userId = "user-manager-001";
    const teamId = "team-001";
    const reporterId = "user-engineer-001";
    const reporterName = "Taro Yamada";

    const extractedKeyword = "データベース接続エラー";
    const keywordFrequency = 1;
    const impactScore = 75;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        {
          keyword: extractedKeyword,
          frequency: keywordFrequency,
        },
      ]),
      assessImpactScore: jest.fn().mockReturnValue(impactScore),
      classifyIssueSeverity: jest.fn().mockReturnValue("high"),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: "sent",
        deliveredAt: now.toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: "schedule-001",
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "delivered",
      }),
    };

    const reportContent = {
      yesterdayAccomplishments:
        "ユーザー認証機能の実装完了。テスト環境でのデータベース接続エラーが発生。",
      todayPlans: "データベース接続エラーの原因調査とシステムテスト。",
      challengesAndIssues: "データベース接続エラーが本番環境にも波及する可能性あり。",
    };

    const input: ExtractDashboardReportDataInput = {
      userId,
      teamId,
      reportDate,
      includeUnsubmitted: true,
    };

    const output: DashboardReportDataOutput = extractDashboardReportData(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      {
        reportId: "report-001",
        reporterId,
        reporterName,
        submissionStatus: "submitted",
        submissionTimestamp: now.toISOString(),
        content: reportContent,
      }
    );

    expect(output).toBeDefined();
    expect(output.reportDate).toBe(reportDate);

    const submissionSummary: SubmissionSummary = output.submissionSummary;
    expect(submissionSummary.totalMembers).toBe(1);
    expect(submissionSummary.submittedCount).toBe(1);
    expect(submissionSummary.unsubmittedCount).toBe(0);
    expect(submissionSummary.submissionRate).toBe(100);

    expect(output.prioritizedIssues).toBeDefined();
    expect(output.prioritizedIssues).toHaveLength(1);

    const issue: PrioritizedIssue = output.prioritizedIssues[0];
    expect(issue.issueId).toBeDefined();
    expect(issue.issueContent).toBe(extractedKeyword);
    expect(issue.priorityScore).toBe(impactScore);
    expect(issue.reporterName).toBe(reporterName);

    const priorityColorMap: { [key: number]: string } = {
      75: "yellow",
    };
    expect(priorityColorMap[issue.priorityScore]).toBe("yellow");
    expect(
      ["red", "yellow", "green"].includes(issue.priorityColor)
    ).toBeTruthy();

    expect(["high", "medium", "low"].includes(issue.impactLevel)).toBeTruthy();

    expect(output.unsubmittedMembers).toEqual([]);

    expect(output.lastUpdatedAt).toBeDefined();
    const lastUpdated = new Date(output.lastUpdatedAt);
    expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(now.getTime());

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});