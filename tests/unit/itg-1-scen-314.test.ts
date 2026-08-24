import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-314: [error] 朝会報告入力フォーム検証 - 「昨日やったこと」項目がスペースのみのとき、エラー表示される
  test('「昨日やったこと」がスペースのみの場合、バリデーションエラーを返す', () => {
    const yesterdayAccomplishment = '　　　';
    const todayPlan = '会議資料作成';
    const challenges = '進捗遅延';
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';

    const input = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});