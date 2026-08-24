import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告修正期限管理機能', () => {
  test('SCEN-2715: reportId が空文字のとき修正禁止エラーが発生する', () => {
    const reportModificationRequest = {
      reportId: '',
      userId: 'user-001',
      currentTimestamp: new Date('2024-01-15T08:50:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => {
      validateReportModificationWindow(reportModificationRequest);
    }).toThrow(/reportId|REPORT_ID/i);
  });
});