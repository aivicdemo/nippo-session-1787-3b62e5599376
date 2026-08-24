import { extractDashboardReportData } from '../../src/logic/manager-dashboard';

describe('manager-dashboard - extractDashboardReportData', () => {
  // SCEN-2761: [error] ダッシュボード優先度表示機能 - 報告日時が null のとき提出状況の判定が失敗する
  test('should throw error when report submission timestamp is null', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    const mockReportData = {
      reportId: 'report-001',
      reporterId: 'user-001',
      submissionStatus: null,
      submissionTimestamp: null,
    };

    expect(() => {
      extractDashboardReportData(input, mockReportData);
    }).toThrow(/提出状況/);
  });
});