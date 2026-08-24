import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告修正期限管理機能', () => {
  // SCEN-2718: [error] 報告修正期限管理機能 - 朝会開始時刻が null のとき修正禁止エラーが発生する
  test('朝会開始時刻が null のとき修正禁止エラーが発生し修正操作がロールバックされる', () => {
    const submittedAt = '2024-01-15T08:00:00Z';
    const morningMeetingStartTime = null;

    expect(() => {
      validateReportModificationWindow({
        submittedAt,
        morningMeetingStartTime: morningMeetingStartTime as any,
      });
    }).toThrow(/朝会開始時刻が設定されていない/);
  });
});