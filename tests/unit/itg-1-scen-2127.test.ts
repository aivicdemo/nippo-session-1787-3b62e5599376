import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("朝会報告管理システム - ダッシュボードデータ鮮度管理", () => {
  // SCEN-2127
  test("古いデータ自動削除機能 - 監査対象データは保持期間超過後も削除されずエラーになる", async () => {
    const now = new Date("2026-08-20T10:00:00Z");
    const retentionEndDate = new Date("2026-07-21T10:00:00Z"); // 30日前

    const auditProtectedReportData = {
      reportId: "report-audit-protected-001",
      reportDate: "2026-07-20",
      submissionTimestamp: "2026-07-20T09:30:00Z",
      isAuditTarget: true,
      retentionEndDate: retentionEndDate.toISOString(),
      content: "Audit protected report content",
      status: "archived" as const,
    };

    const mockDatabaseQuery = jest.fn().mockResolvedValue([
      auditProtectedReportData,
    ]);

    const mockDeleteOperation = jest
      .fn()
      .mockRejectedValue(
        new Error("監査対象データのため削除スキップ")
      );

    const mockAuditLog = jest.fn().mockResolvedValue({
      logId: "audit-log-001",
      reportId: auditProtectedReportData.reportId,
      action: "DELETE_SKIPPED",
      reason: "監査対象データのため削除スキップ",
      timestamp: now.toISOString(),
    });

    const result = await ensureDashboardDataFreshness(
      {
        userId: "user-manager-001",
        teamId: "team-dev-001",
        reportDate: "2026-08-20",
        maxStalenessSeconds: 300,
      },
      {
        queryArchivedReports: mockDatabaseQuery,
        deleteArchivedReport: mockDeleteOperation,
        writeAuditLog: mockAuditLog,
        getCurrentTimestamp: () => now,
      }
    );

    expect(mockDatabaseQuery).toHaveBeenCalled();
    expect(result.isDataFresh).toBe(true);
    expect(result.displayTimestamp).toBe(now.toISOString());

    const auditLogCall = mockAuditLog.mock.calls[0];
    expect(auditLogCall[0]).toEqual(
      expect.objectContaining({
        reportId: auditProtectedReportData.reportId,
        reason: expect.stringMatching(/監査対象データ/),
      })
    );

    expect(mockDeleteOperation).toHaveBeenCalledWith(
      auditProtectedReportData.reportId
    );
    expect(mockDeleteOperation).toHaveRejectedWith(/監査対象データ/);
  });
});