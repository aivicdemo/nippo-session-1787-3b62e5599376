import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  test('SCEN-2213: 抱えている課題が最大文字数上限を超える場合、入力エラーが返される', () => {
    const challengesExceededLimit = 'a'.repeat(501);

    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了した。',
      todayPlan: '今日は機能Bのテストを実施する予定である。',
      challenges: challengesExceededLimit,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/抱えている課題/);
  });
});