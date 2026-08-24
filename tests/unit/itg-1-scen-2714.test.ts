import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理機能', () => {
  // SCEN-2714
  test('reportId が null のとき修正禁止エラーが発生する', () => {
    const modificationRequest = {
      reportId: null,
      userId: 'user-001',
      currentTimestamp: new Date('2024-01-15T08:30:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => {
      validateReportModificationWindow(modificationRequest as any);
    }).toThrow(/報告ID/);
  });
});