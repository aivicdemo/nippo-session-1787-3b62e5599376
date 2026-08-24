import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2412: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間の開始日時点で、期間内の日報データが保持期間の上限を1件超過するとき、超過分も集約対象に含まれる
  test('保持期間の上限を1件超過したときすべてのデータが集約対象に含まれアーカイブテーブルへ移行される', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00.000Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59.999Z');
    const teamIds: string[] = [];
    const retentionLimitRecords = 10;
    const totalRecordsInPeriod = 11;

    const mockReportRecords = Array.from({ length: totalRecordsInPeriod }, (_, index) => ({
      reportId: `report-${String(index + 1).padStart(2, '0')}`,
      teamId: 'team-alpha',
      submittedAt: new Date(new Date(aggregationStartDate).getTime() + index * 86400000),
      reportContent: `Report content ${index + 1}`,
      yesterdayAccomplishments: `Accomplished task ${index + 1}`,
      todayPlan: `Today plan ${index + 1}`,
      issues: `Issue ${index + 1}`,
    }));

    const result = extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: mockReportRecords,
      retentionLimit: retentionLimitRecords,
    });

    expect(result.totalReportCount).toBe(11);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].reportIds).toHaveLength(11);
    expect(result.reportsByTeam[0].reportIds).toContain('report-01');
    expect(result.reportsByTeam[0].reportIds).toContain('report-11');
    expect(result.extractionPeriodStart).toBe(aggregationStartDate.toISOString());
    expect(result.extractionPeriodEnd).toBe(aggregationEndDate.toISOString());
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});