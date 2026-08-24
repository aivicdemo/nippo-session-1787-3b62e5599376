import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2504: [normal] 初回テスト報告の入力検証機能 - 必須項目が空の場合に修正指示が返される
  test('should return validation error when yesterdayAccomplishment is empty', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: '',
      todayPlan: '会議参加',
      challenges: 'ツール選定',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        fieldName: 'yesterdayAccomplishment',
        errorCode: 'MissingRequiredField',
      })
    );
  });
});