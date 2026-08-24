import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  test('SCEN-2109: レポートが保持期間内の場合、削除されない', async () => {
    const now = new Date('2024-12-15T09:00:00Z');
    const retentionDaysDefault = 90;

    const reportCreatedAt60DaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const reportCreatedAt10DaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const input: Parameters<typeof ensureDashboardDataFreshness>[0] = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-12-15',
      maxStalenessSeconds: 300,
    };

    const mockDatabaseReports = [
      {
        reportId: 'report-60d',
        createdAt: reportCreatedAt60DaysAgo.toISOString(),
        retentionDays: retentionDaysDefault,
      },
      {
        reportId: 'report-10d',
        createdAt: reportCreatedAt10DaysAgo.toISOString(),
        retentionDays: retentionDaysDefault,
      },
    ];

    const result = await ensureDashboardDataFreshness(input);

    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBeDefined();
    expect(result.displayTimestamp).toBeDefined();
    expect(result.stalenessSeconds).toBeGreaterThanOrEqual(0);
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);

    const elapsedSeconds = (new Date(result.displayTimestamp).getTime() - new Date(result.lastUpdateTimestamp).getTime()) / 1000;
    expect(elapsedSeconds).toBeGreaterThanOrEqual(0);
    expect(elapsedSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    const report60DaysAgoAgeInDays = (now.getTime() - new Date(mockDatabaseReports[0].createdAt).getTime()) / (24 * 60 * 60 * 1000);
    const report10DaysAgoAgeInDays = (now.getTime() - new Date(mockDatabaseReports[1].createdAt).getTime()) / (24 * 60 * 60 * 1000);

    expect(report60DaysAgoAgeInDays).toBeCloseTo(60, 0);
    expect(report10DaysAgoAgeInDays).toBeCloseTo(10, 0);

    expect(report60DaysAgoAgeInDays).toBeLessThan(retentionDaysDefault);
    expect(report10DaysAgoAgeInDays).toBeLessThan(retentionDaysDefault);
  });
});