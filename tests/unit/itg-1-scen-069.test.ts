import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-069: [error] 日報送信期限判定機能 - 日報送信時刻が不正な日付形式のとき処理が進まずエラーを返す
  test('submitDailyReport: 不正な日付形式で送信を試みると例外を返す', () => {
    const invalidDateFormats = [
      '2024-13-45',
      '2024/12/32',
      'invalid-date',
      '2024-12-',
      '12-31-2024',
      null,
      undefined,
      ''
    ];

    for (const invalidDateFormat of invalidDateFormats) {
      const input = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Yesterday tasks completed',
        todayPlan: 'Today plan details',
        challenges: 'Current challenges',
        reportDate: invalidDateFormat as any
      };

      expect(() => submitDailyReport(input)).toThrow(/日付形式|日報送信時刻/);
    }
  });
});