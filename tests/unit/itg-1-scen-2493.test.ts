import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2493
  test('操作習熟度スコア計算機能 - 期待ステップ定義が空配列のとき、エラーを返す', () => {
    const input = {
      userId: 'user-123',
      teamId: 'team-456',
      yesterdayAccomplishment: 'テストコード作成完了',
      todayPlan: 'レビュー対応',
      challenges: 'パフォーマンス最適化が課題',
      reportDate: '2024-01-15',
      expectedStepsDefinition: [],
    };

    const result = submitDailyReport(input);

    expect(result).toEqual({
      isValid: false,
      errorCode: 'EMPTY_STEPS_DEFINITION',
      errorMessage: '期待ステップ定義が空配列です。最低1件以上のステップを定義してください',
    });
  });
});