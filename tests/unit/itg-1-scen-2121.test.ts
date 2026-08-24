import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('manager-dashboard: ensureDashboardDataFreshness', () => {
  // SCEN-2121: [error] 古いデータ自動削除機能 - データ作成日時が null のとき、エラーが発生して処理が中断される
  test('should throw error when encountering null createdAt field during old data deletion', async () => {
    const mockDashboardReportWithNullCreatedAt = {
      reportId: 'report-001',
      reportDate: '2024-01-15',
      createdAt: null,
      submissionTimestamp: '2024-01-15T08:00:00Z',
      reporterId: 'user-001',
      submissionStatus: 'submitted' as const,
    };

    const mockValidDashboardReport = {
      reportId: 'report-002',
      reportDate: '2024-01-15',
      createdAt: '2024-01-15T08:30:00Z',
      submissionTimestamp: '2024-01-15T08:30:00Z',
      reporterId: 'user-002',
      submissionStatus: 'submitted' as const,
    };

    const referenceDate = new Date('2024-02-15T12:00:00Z');
    const thirtyDaysAgoMs = 30 * 24 * 60 * 60 * 1000;
    const deletionThresholdDate = new Date(referenceDate.getTime() - thirtyDaysAgoMs);

    const mockDashboardReports = [
      mockDashboardReportWithNullCreatedAt,
      mockValidDashboardReport,
    ];

    const input = {
      userId: 'manager-user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
      dashboardReports: mockDashboardReports,
      deletionThresholdDate: deletionThresholdDate,
    };

    expect(() => {
      ensureDashboardDataFreshness(input);
    }).toThrow(/createdAt|作成日時/);
  });
});