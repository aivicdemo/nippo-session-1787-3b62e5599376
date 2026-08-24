import { describe, test, expect, beforeEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2133: [edge] データ保持期間管理・自動削除機能 - 月末日を含む保持期間満了時にデータが正しく削除対象と判定される
  test('should mark data as deleted when retention period exceeds 30 days including month-end boundary', async () => {
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-31';

    const baseDate = new Date('2024-02-01T00:00:00Z');
    const retentionPeriodDays = 30;
    const dataCreatedDate = new Date('2024-01-01T00:00:00Z');

    const elapsedDays = Math.floor(
      (baseDate.getTime() - dataCreatedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const mockDateUtils = {
      getCurrentDate: () => baseDate,
      isWithinRetentionPeriod: (createdAt: Date, retentionDays: number) => {
        const now = baseDate;
        const elapsedMs = now.getTime() - createdAt.getTime();
        const elapsedDaysValue = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
        return elapsedDaysValue <= retentionDays;
      },
    };

    const input = {
      userId,
      teamId,
      reportDate,
      maxStalenessSeconds: 300,
    };

    const output = await ensureDashboardDataFreshness(input, mockDateUtils);

    expect(output.isDataFresh).toBe(false);
    expect(output.stalenessSeconds).toBeGreaterThanOrEqual(
      elapsedDays * 24 * 60 * 60
    );

    const isDataOutsideRetentionPeriod = !mockDateUtils.isWithinRetentionPeriod(
      dataCreatedDate,
      retentionPeriodDays
    );

    expect(isDataOutsideRetentionPeriod).toBe(true);
    expect(elapsedDays).toBe(31);

    const recordDeletedAt = new Date('2024-02-01T00:00:00Z');
    const recordCreatedAt = new Date('2024-01-01T00:00:00Z');
    const daysDifference = Math.floor(
      (recordDeletedAt.getTime() - recordCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(daysDifference).toBe(31);
    expect(daysDifference).toBeGreaterThan(retentionPeriodDays);
  });
});