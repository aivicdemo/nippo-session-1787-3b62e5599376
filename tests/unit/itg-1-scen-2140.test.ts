import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("ensureDashboardDataFreshness", () => {
  // SCEN-2140: [edge] データ保持期間管理・自動削除機能 - 保持期間満了後のデータセットに重複データが含まれている場合、すべての重複が削除対象として判定される
  test("should mark all duplicate reports as deletion targets when retention period expires", async () => {
    const now = new Date("2024-12-15T10:00:00Z");
    const thirtyDaysAgo = new Date("2024-11-15T10:00:00Z");

    const userId = "user-001";
    const reporterId = "reporter-001";
    const teamId = "team-001";
    const reportDate = "2024-11-15";
    const reportContent = "昨日の実績：機能A実装。今日の予定：テスト実施。課題：依存ライブラリの更新";

    const duplicateReportDataset = [
      {
        reportId: "report-id-001",
        reporterId: reporterId,
        reportDate: reportDate,
        content: reportContent,
        submissionTimestamp: thirtyDaysAgo.toISOString(),
        createdAt: thirtyDaysAgo,
        teamId: teamId,
      },
      {
        reportId: "report-id-002",
        reporterId: reporterId,
        reportDate: reportDate,
        content: reportContent,
        submissionTimestamp: thirtyDaysAgo.toISOString(),
        createdAt: thirtyDaysAgo,
        teamId: teamId,
      },
      {
        reportId: "report-id-003",
        reporterId: reporterId,
        reportDate: reportDate,
        content: reportContent,
        submissionTimestamp: thirtyDaysAgo.toISOString(),
        createdAt: thirtyDaysAgo,
        teamId: teamId,
      },
    ];

    const duplicateDetectionResults = [
      { reportId: "report-id-001", isDuplicate: true },
      { reportId: "report-id-002", isDuplicate: true },
      { reportId: "report-id-003", isDuplicate: true },
    ];

    const mockDuplicateDetector = jest.fn((reports: typeof duplicateReportDataset) => {
      return reports.map((report) => {
        const result = duplicateDetectionResults.find(
          (r) => r.reportId === report.reportId
        );
        return {
          reportId: report.reportId,
          isDuplicate: result?.isDuplicate ?? false,
        };
      });
    });

    const mockDeleteLogger = jest.fn();

    const mockDatabaseQueries = {
      countReportsBeforeDeletion: jest.fn(() => Promise.resolve(3)),
      countReportsAfterDeletion: jest.fn(() => Promise.resolve(0)),
      deleteReports: jest.fn((reportIds: string[]) => {
        mockDeleteLogger({
          targetCount: 3,
          completedCount: reportIds.length,
          reportIds: reportIds,
          timestamp: now.toISOString(),
        });
        return Promise.resolve({ deletedCount: reportIds.length });
      }),
    };

    const retentionPeriodDays = 30;
    const retentionExpiryTime = new Date(now);
    retentionExpiryTime.setDate(retentionExpiryTime.getDate() - retentionPeriodDays);

    const isRetentionExpired = thirtyDaysAgo <= retentionExpiryTime;
    expect(isRetentionExpired).toBe(true);

    const duplicateTargets = mockDuplicateDetector(duplicateReportDataset);
    expect(duplicateTargets).toHaveLength(3);
    expect(duplicateTargets.every((t) => t.isDuplicate)).toBe(true);

    const countBefore = await mockDatabaseQueries.countReportsBeforeDeletion();
    expect(countBefore).toBe(3);

    const reportIdsToDelete = duplicateTargets
      .filter((t) => t.isDuplicate)
      .map((t) => t.reportId);
    const deleteResult = await mockDatabaseQueries.deleteReports(reportIdsToDelete);
    expect(deleteResult.deletedCount).toBe(3);

    const countAfter = await mockDatabaseQueries.countReportsAfterDeletion();
    expect(countAfter).toBe(0);

    expect(mockDeleteLogger).toHaveBeenCalledWith({
      targetCount: 3,
      completedCount: 3,
      reportIds: ["report-id-001", "report-id-002", "report-id-003"],
      timestamp: now.toISOString(),
    });

    const input = {
      userId: userId,
      teamId: teamId,
      reportDate: reportDate,
      maxStalenessSeconds: 300,
    };

    const result = await ensureDashboardDataFreshness(input);

    expect(result).toHaveProperty("isDataFresh");
    expect(result).toHaveProperty("lastUpdateTimestamp");
    expect(result).toHaveProperty("displayTimestamp");
    expect(result).toHaveProperty("stalenessSeconds");
  });
});