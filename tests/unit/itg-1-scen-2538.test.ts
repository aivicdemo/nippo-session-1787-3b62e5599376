import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2538: [edge] 初回テスト報告の入力検証機能 - 報告テキストの文字数が最大許容値を1文字超過する場合、品質基準検証が不合格となる
  test('should reject submission when yesterdayAccomplishment exceeds maximum character limit by 1', () => {
    const MAX_ACCOMPLISHMENT_CHARS = 2000;
    const oversizedText = 'a'.repeat(MAX_ACCOMPLISHMENT_CHARS + 1);

    const input = {
      userId: 'engineer-001',
      teamId: 'team-001',
      yesterdayAccomplishment: oversizedText,
      todayPlan: 'Valid today plan text',
      challenges: 'Valid challenges text',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.some(err => /文字/.test(err))).toBe(true);
    expect(result.errors?.some(err => /最大許容/.test(err))).toBe(true);
  });
});