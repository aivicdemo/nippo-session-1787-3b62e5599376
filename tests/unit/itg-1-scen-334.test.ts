import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-334: [edge] 日報入力バリデーション機能 - 抱えている課題が空文字列のとき該当項目がエラー表示される
  test('抱えている課題が空文字列の場合、バリデーションエラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-a',
      yesterdayAccomplishment: '昨日は機能Aの開発を完了しました',
      todayPlan: '今日は機能Bのテストを実施します',
      challenges: '',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/課題/),
      ])
    );
  });
});