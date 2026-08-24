import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2724: [error] 報告修正期限管理機能 - ユーザー ID が null のとき修正禁止エラーが発生する
  test('ユーザーIDがnullの場合、修正禁止エラーを発生させ、バリデーション処理を実行する', () => {
    const reportModificationRequest = {
      reportId: 'report-001',
      userId: null,
      currentTimestamp: new Date('2024-01-15T08:45:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => {
      validateReportModificationWindow(reportModificationRequest);
    }).toThrow(/ユーザー認証情報/);
  });
});