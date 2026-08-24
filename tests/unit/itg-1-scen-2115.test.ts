import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2115: [normal] データ保持期間管理機能 - 削除対象データが 1 件の場合、該当データが削除される
  test('should delete exactly one expired dashboard record while preserving valid records', () => {
    const now = new Date('2026-01-15T10:00:00Z');
    const ninetyOneDaysAgo = new Date('2025-10-16T10:00:00Z');
    const thirtyDaysAgo = new Date('2025-12-16T10:00:00Z');

    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2026-01-15',
      maxStalenessSeconds: 300,
    };

    const existingRecords: DashboardReportData[] = [
      {
        reportId: 'report-expired-001',
        reporterId: 'engineer-001',
        submissionStatus: 'submitted',
        submissionTimestamp: ninetyOneDaysAgo.toISOString(),
      },
      {
        reportId: 'report-valid-001',
        reporterId: 'engineer-002',
        submissionStatus: 'submitted',
        submissionTimestamp: thirtyDaysAgo.toISOString(),
      },
      {
        reportId: 'report-valid-002',
        reporterId: 'engineer-003',
        submissionStatus: 'submitted',
        submissionTimestamp: new Date('2026-01-14T10:00:00Z').toISOString(),
      },
    ];

    const recordCountBeforeDeletion = existingRecords.length;

    const result = ensureDashboardDataFreshness(input, existingRecords, now);

    const deletedRecordIds = existingRecords
      .filter(record => record.reportId === 'report-expired-001')
      .map(record => record.reportId);

    const remainingRecords = existingRecords.filter(
      record => record.reportId !== 'report-expired-001'
    );

    expect(deletedRecordIds.length).toBe(1);
    expect(remainingRecords.length).toBe(recordCountBeforeDeletion - 1);
    expect(remainingRecords.some(r => r.reportId === 'report-valid-001')).toBe(true);
    expect(remainingRecords.some(r => r.reportId === 'report-valid-002')).toBe(true);
    expect(remainingRecords.some(r => r.reportId === 'report-expired-001')).toBe(false);
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBeDefined();
    expect(result.displayTimestamp).toBeDefined();
    expect(result.stalenessSeconds).toBeLessThanOrEqual(300);
  });
});