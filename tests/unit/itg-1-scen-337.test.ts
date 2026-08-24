import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力バリデーション機能', () => {
  // SCEN-337: [edge] 日報入力バリデーション機能 - 抱えている課題が文字数制限上限を1文字超過するとき該当項目がエラー表示される
  test('抱えている課題が文字数制限上限を1文字超過するときバリデーションエラーが返却される', () => {
    const challengesText = 'a'.repeat(401);
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Yesterday task completed successfully',
      todayPlan: 'Today plan is scheduled',
      challenges: challengesText,
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toHaveProperty('isValid');
    expect(result.isValid).toBe(false);
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'challenges',
        errorCode: 'ExceedsCharacterLimit',
      })
    );
    expect(result.errors[0]).toHaveProperty('message');
    expect(typeof result.errors[0].message).toBe('string');
    expect(result.errors[0].message.length).toBeGreaterThan(0);
  });
});