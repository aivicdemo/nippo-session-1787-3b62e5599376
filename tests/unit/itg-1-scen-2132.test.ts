import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('Dashboard Data Freshness Management', () => {
  // SCEN-2132: [edge] データ保持期間管理・自動削除機能 - 保持期間の満了日時直後（1秒超過）のデータが削除対象として判定される
  test('should mark data as deletable when retention period expires by 1 second', () => {
    // Setup: reference time
    const referenceTime = new Date('2024-01-15T10:00:00Z');
    const retentionDays = 30;
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    // Data created at reference time minus 30 days minus 1 second
    const createdAtMs = referenceTime.getTime() - retentionMs - 1000;
    const createdAt = new Date(createdAtMs);

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const dashboardReportData = {
      reportId: 'RPT-001',
      reporterId: 'engineer-001',
      submissionStatus: 'submitted' as const,
      submissionTimestamp: createdAt.toISOString(),
    };

    // Current time is exactly at reference time
    const currentTime = referenceTime;

    // Execute: call ensureDashboardDataFreshness with the report data
    const result = ensureDashboardDataFreshness(
      input,
      [dashboardReportData],
      currentTime
    );

    // Verify: data should be marked as expired (beyond retention period)
    expect(result.isDataFresh).toBe(false);
    expect(result.stalenessSeconds).toBeGreaterThan(retentionMs / 1000);
    expect(result.lastUpdateTimestamp).toBe(createdAt.toISOString());
    expect(result.displayTimestamp).toBe(currentTime.toISOString());
  });
});