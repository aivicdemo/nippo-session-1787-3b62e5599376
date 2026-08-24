import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("ensureDashboardDataFreshness", () => {
  // SCEN-2118: [error] 古いデータ自動削除機能 - 削除対象データの保持期間が null のとき、エラーが発生して処理が中断される
  test("should throw RETENTION_PERIOD_NOT_DEFINED error and not delete data when retentionPeriodDays is null", async () => {
    const input = {
      userId: "user-001",
      teamId: "team-001",
      reportDate: "2024-01-15",
      maxStalenessSeconds: 300,
      retentionPeriodDays: null,
    };

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const mockDatabaseTransaction = {
      selectFromMorningReports: jest.fn().mockResolvedValue([
        {
          reportId: "report-001",
          reportDate: "2024-01-15",
          submissionTimestamp: "2024-01-15T08:00:00Z",
        },
      ]),
      deleteOldMorningReports: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    const mockAlertNotificationService = {
      sendAlert: jest.fn().mockResolvedValue({ sent: true }),
    };

    await expect(
      ensureDashboardDataFreshness(input, {
        logger: mockLogger,
        databaseTransaction: mockDatabaseTransaction,
        alertNotificationService: mockAlertNotificationService,
      })
    ).rejects.toThrow(/RETENTION_PERIOD_NOT_DEFINED/);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("保持期間の設定値がnullのため")
    );

    expect(mockDatabaseTransaction.deleteOldMorningReports).not.toHaveBeenCalled();
    expect(mockDatabaseTransaction.rollback).toHaveBeenCalled();

    expect(mockAlertNotificationService.sendAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "error",
        code: "RETENTION_PERIOD_NOT_DEFINED",
      })
    );
  });
});