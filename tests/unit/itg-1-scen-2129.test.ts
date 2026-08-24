import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度確保', () => {
  // SCEN-2129: [error] 古いデータ自動削除機能 - データベース接続が切れているとき、エラーが発生して処理が中断される
  test('should fail with database connection error and log error, set status to FAILED, retain old data, and add alert when DB connection fails during old data deletion', async () => {
    // Mock logger to capture error logs
    const errorLogs: string[] = [];
    const mockLogger = {
      error: (message: string) => {
        errorLogs.push(message);
      },
      info: () => {},
      warn: () => {},
    };

    // Mock alert queue to capture admin notifications
    const alertQueue: Array<{ type: string; message: string; timestamp: string }> = [];
    const mockAlertService = {
      addAlert: (alertType: string, message: string) => {
        alertQueue.push({
          type: alertType,
          message: message,
          timestamp: new Date().toISOString(),
        });
      },
    };

    // Mock database connection that fails
    const mockDbConnection = {
      isConnected: false,
      connect: async () => {
        throw new Error('Unable to connect to database');
      },
      query: async () => {
        throw new Error('Database connection lost');
      },
      close: async () => {},
    };

    // Old report data (30+ days ago)
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    const oldReportData = {
      reportId: 'report-001-old',
      reporterId: 'user-001',
      reportDate: thirtyOneDaysAgo.toISOString().split('T')[0],
      submissionStatus: 'submitted',
      submissionTimestamp: thirtyOneDaysAgo.toISOString(),
    };

    // Input for ensureDashboardDataFreshness
    const input = {
      userId: 'admin-001',
      teamId: 'team-001',
      reportDate: new Date().toISOString().split('T')[0],
      maxStalenessSeconds: 300,
      dbConnection: mockDbConnection,
      logger: mockLogger,
      alertService: mockAlertService,
      existingOldData: [oldReportData],
    };

    // Execute function and expect it to handle the error
    let deletionStatus = 'PENDING';
    let caughtError: Error | null = null;

    try {
      // Attempt to ensure data freshness which triggers old data deletion
      await ensureDashboardDataFreshness(input);
    } catch (error) {
      caughtError = error as Error;
      deletionStatus = 'FAILED';
    }

    // Verify error occurred
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/Unable to connect to database/);

    // Verify deletion status transitioned to FAILED
    expect(deletionStatus).toBe('FAILED');

    // Verify error log contains expected message
    expect(errorLogs.length).toBeGreaterThan(0);
    const dbErrorLog = errorLogs.find((log) =>
      log.includes('DBConnection Error') || log.includes('Unable to connect to database')
    );
    expect(dbErrorLog).toBeDefined();

    // Verify old data was NOT deleted (remains in test data)
    expect(input.existingOldData).toContainEqual(oldReportData);
    expect(input.existingOldData.length).toBe(1);

    // Verify alert queue has 1 deletion failure notification
    expect(alertQueue.length).toBe(1);
    expect(alertQueue[0].type).toBe('DELETION_FAILURE');
    expect(alertQueue[0].message).toMatch(/deletion failed|failed to delete/i);
  });
});