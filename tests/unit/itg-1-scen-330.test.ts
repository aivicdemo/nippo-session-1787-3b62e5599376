import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-330: [edge] 日報入力バリデーション機能 - 今日やることが空文字列のとき該当項目がエラー表示される
  test('今日やることが空文字列の場合、バリデーションエラーを返す', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了した',
      todayPlan: '',
      challenges: '依存関係の解決に時間がかかっている',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/今日やること|必須項目/),
      ])
    );
    expect(result.errors).toHaveLength(1);
  });
});