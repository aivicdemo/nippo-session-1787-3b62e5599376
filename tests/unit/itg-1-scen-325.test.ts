import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-325: [error] 朝会報告入力フォーム検証 - 「抱えている課題」項目が文字数制限を超過したとき、エラー表示される
  test('should reject submission when challenges field exceeds character limit', () => {
    const yesterdayAccomplishment = '昨日はA機能の開発を完了しました';
    const todayPlan = '本日はB機能のテストを予定しています';
    const challengesExceedingLimit = 'x'.repeat(501); // 制限値 500 文字を超える 501 文字

    const input = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      challenges: challengesExceedingLimit,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数/);
  });
});