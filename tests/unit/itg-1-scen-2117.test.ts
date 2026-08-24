import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('Dashboard Data Freshness - Idempotent Data Retention', () => {
  // SCEN-2117
  test('should ensure data freshness is idempotent when deleting expired reports', async () => {
    const testDatabase: Array<{
      reportId: string;
      createdAt: Date;
      isRetained: boolean;
    }> = [];

    // Setup: Insert 10 expired report records (created 30+ days ago)
    const thirtyOneDaysAgo = new Date(
      new Date().getTime() - 31 * 24 * 60 * 60 * 1000
    );
    for (let i = 0; i < 10; i++) {
      testDatabase.push({
        reportId: `expired_report_${i}`,
        createdAt: thirtyOneDaysAgo,
        isRetained: true,
      });
    }

    // Setup: Insert 5 records within retention period (created 15 days ago)
    const fifteenDaysAgo = new Date(
      new Date().getTime() - 15 * 24 * 60 * 60 * 1000
    );
    for (let i = 0; i < 5; i++) {
      testDatabase.push({
        reportId: `recent_report_${i}`,
        createdAt: fifteenDaysAgo,
        isRetained: true,
      });
    }

    const maxStalenessSeconds = 2592000; // 30 days in seconds
    const currentTime = new Date();

    // First execution: Delete expired reports
    const firstExecutionResult = await ensureDashboardDataFreshness(
      {
        userId: 'test_manager_001',
        teamId: 'team_dev_001',
        reportDate: '2024-01-15',
        maxStalenessSeconds: maxStalenessSeconds,
      },
      {
        deleteExpiredReports: async (retentionSeconds: number) => {
          const expiredThreshold = new Date(
            currentTime.getTime() - retentionSeconds * 1000
          );
          const deletedCount = testDatabase.filter(
            (record) => record.createdAt < expiredThreshold
          ).length;

          // Simulate deletion
          const beforeCount = testDatabase.length;
          testDatabase.splice(
            0,
            testDatabase.filter((record) => record.createdAt < expiredThreshold)
              .length
          );

          return deletedCount;
        },
        getCurrentTimestamp: () => currentTime.toISOString(),
      }
    );

    // Verify first execution deleted exactly 10 records
    expect(firstExecutionResult.deletedCount).toBe(10);

    // Verify database state after first deletion: 5 recent records remain
    const remainingAfterFirstDelete = testDatabase.filter(
      (record) => record.isRetained
    );
    expect(remainingAfterFirstDelete.length).toBe(5);

    // Second execution: Run same deletion process again
    const secondExecutionResult = await ensureDashboardDataFreshness(
      {
        userId: 'test_manager_001',
        teamId: 'team_dev_001',
        reportDate: '2024-01-15',
        maxStalenessSeconds: maxStalenessSeconds,
      },
      {
        deleteExpiredReports: async (retentionSeconds: number) => {
          const expiredThreshold = new Date(
            currentTime.getTime() - retentionSeconds * 1000
          );
          const deletedCount = testDatabase.filter(
            (record) => record.createdAt < expiredThreshold
          ).length;

          // Simulate deletion
          testDatabase.splice(
            0,
            testDatabase.filter((record) => record.createdAt < expiredThreshold)
              .length
          );

          return deletedCount;
        },
        getCurrentTimestamp: () => currentTime.toISOString(),
      }
    );

    // Verify second execution deleted 0 records (idempotent)
    expect(secondExecutionResult.deletedCount).toBe(0);

    // Verify data integrity: only 5 recent records remain unchanged
    const remainingAfterSecondDelete = testDatabase.filter(
      (record) => record.isRetained
    );
    expect(remainingAfterSecondDelete.length).toBe(5);

    // Verify specific recent records still exist
    expect(remainingAfterSecondDelete.some((r) => r.reportId === 'recent_report_0')).toBe(true);
    expect(remainingAfterSecondDelete.some((r) => r.reportId === 'recent_report_4')).toBe(true);

    // Verify all expired records are gone after both executions
    const expiredRecordsStillPresent = testDatabase.filter(
      (record) => record.reportId.startsWith('expired_report_')
    );
    expect(expiredRecordsStillPresent.length).toBe(0);
  });
});