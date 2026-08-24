import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  test('SCEN-319: [error] 朝会報告入力フォーム検証 - 「抱えている課題」項目が空文字列のとき、エラー表示される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能Aのバグ修正を完了しました',
      todayPlan: '本日は機能Bの開発に取り組みます',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => {
      submitDailyReport(input);
    }).toThrow(/抱えている課題/);
  });
});