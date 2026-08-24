import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告入力フォーム検証', () => {
  // SCEN-316: [error] 朝会報告入力フォーム検証 - 「今日やること」項目がnullのとき、エラー表示される
  test('「今日やること」項目がnullの場合、エラーメッセージが表示される', () => {
    const yesterdayAccomplishment = 'データベース最適化対応を完了した';
    const todayPlan = null;
    const challenges = 'キャッシュ戦略の改善が必要';
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';

    const result = submitDailyReport({
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      reportDate,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain('今日やことは必須項目です');
  });
});