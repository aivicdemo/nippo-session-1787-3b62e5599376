import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness - Data Retention Management', () => {
  // SCEN-2105: [normal] データ保持期間管理機能 - 保持期間を超過した分析結果が自動削除される
  test('should delete analysis results exceeding retention period and preserve those within period', async () => {
    const retentionDays = 30;
    const currentTime = new Date('2024-01-15T09:00:00Z');
    
    const recordCreatedBefore30Days = {
      dashboardDataId: 'dash-001',
      analysisResultId: 'analysis-001',
      createdAt: new Date(new Date(currentTime).setDate(currentTime.getDate() - 30)).toISOString(),
      retentionDays: retentionDays,
      lastUpdatedAt: new Date(new Date(currentTime).setDate(currentTime.getDate() - 30)).toISOString(),
    };

    const recordCreatedBefore29Days = {
      dashboardDataId: 'dash-002',
      analysisResultId: 'analysis-002',
      createdAt: new Date(new Date(currentTime).setDate(currentTime.getDate() - 29)).toISOString(),
      retentionDays: retentionDays,
      lastUpdatedAt: new Date(new Date(currentTime).setDate(currentTime.getDate() - 29)).toISOString(),
    };

    const recordCreatedToday = {
      dashboardDataId: 'dash-003',
      analysisResultId: 'analysis-003',
      createdAt: currentTime.toISOString(),
      retentionDays: retentionDays,
      lastUpdatedAt: currentTime.toISOString(),
    };

    const mockDatabase = {
      records: [recordCreatedBefore30Days, recordCreatedBefore29Days, recordCreatedToday],
      deleteExpiredRecords: function(cutoffDate: Date): number {
        const initialLength = this.records.length;
        this.records = this.records.filter((record) => {
          const createdDate = new Date(record.createdAt);
          return createdDate > cutoffDate;
        });
        return initialLength - this.records.length;
      },
      getRecordById: function(id: string) {
        return this.records.find((record) => record.dashboardDataId === id);
      },
    };

    const cutoffDate = new Date(currentTime);
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await ensureDashboardDataFreshness(
      mockDatabase,
      retentionDays,
      currentTime
    );

    expect(result.deletedCount).toBe(1);
    expect(result.retainedCount).toBe(2);
    expect(mockDatabase.getRecordById('dash-001')).toBeUndefined();
    expect(mockDatabase.getRecordById('dash-002')).toBeDefined();
    expect(mockDatabase.getRecordById('dash-003')).toBeDefined();
  });
});