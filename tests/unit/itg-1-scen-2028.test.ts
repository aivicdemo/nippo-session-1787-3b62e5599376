import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2028
  test('対策案が空文字列のとき検証エラーを返す', () => {
    const input = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: '昨日はAPIの実装を完了しました。',
      todayPlan: '今日はテストコードを作成する予定です。',
      challenges: '対策案::::実行計画:本来の対応が必要です。',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/対策案/),
      ])
    );
  });
});