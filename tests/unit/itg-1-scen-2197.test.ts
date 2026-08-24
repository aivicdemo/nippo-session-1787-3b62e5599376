import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2197: [normal] 日報入力検証機能 - 今日やることと抱えている課題が入力されていて昨日やったことが空文字列の場合、昨日やったこと項目のみにエラーメッセージが表示される
  test('should return validation error only for empty yesterdayAccomplishment field when todayPlan and challenges are provided', () => {
    const input = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: '',
      todayPlan: 'プロジェクトAのコード レビュー実施',
      challenges: 'データベース接続タイムアウトの調査中',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]).toMatch(/昨日やったこと/);
    expect(result.errors?.some((err: string) => err.includes('今日やること'))).toBe(false);
    expect(result.errors?.some((err: string) => err.includes('抱えている課題'))).toBe(false);
  });
});