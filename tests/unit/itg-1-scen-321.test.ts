import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-321: [error] 朝会報告入力フォーム検証 - 「抱えている課題」項目が未定義（undefined）のとき、エラー表示される
  test('submitDailyReport - challenges フィールドが undefined の場合、検証エラーを返す', () => {
    const input = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了した',
      todayPlan: '本日は機能Bのテストを実施する予定',
      challenges: undefined as unknown as string,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/課題/);
  });
});