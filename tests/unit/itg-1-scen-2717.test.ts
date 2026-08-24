import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2717: [error] 報告修正期限管理機能 - 修正内容データが空オブジェクトのとき修正禁止エラーが発生する
  test('修正内容が空オブジェクトのとき修正禁止エラーが発生する', () => {
    const submittedAt = new Date('2024-01-15T08:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimestamp = new Date('2024-01-15T08:45:00Z');
    const emptyModificationContent = {};

    expect(() => {
      validateReportModificationWindow(
        {
          submittedAt,
          morningMeetingStartTime,
        },
        {
          reportId: 'report-001',
          userId: 'user-001',
          currentTimestamp,
          morningMeetingStartTime,
        },
        emptyModificationContent
      );
    }).toThrow(/修正内容/);
  });
});